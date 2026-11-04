/**
 * Virtual speed networking.
 *
 * Design notes
 *  - The waiting queue is in memory (single-instance deployment, as in the spec). All queue mutations and pairing run
 *    inside one async mutex, so concurrent joins are serialised and can never double-match a user.
 *  - Sessions are persisted. A partial unique index on NetworkingSession.participants (isOpen:true) is the database
 *    backstop that prevents a user from being in two open sessions.
 *  - Session timing is authoritative on the server: waiting -> (start delay) -> active -> (duration) -> completed.
 *    Clients only render `endsAt`/`remainingSeconds` values the server sends.
 *  - Timers are in memory; recoverSessions() rebuilds them after a restart.
 */
import { NetworkingSession } from '../models/NetworkingSession.js';
import { Connection } from '../models/Connection.js';
import { User } from '../models/User.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { ROLES } from '../constants/roles.js';
import { ACTIVE_REGISTRATION_STATUSES, CONNECTION_STATUS, EVENT_STATUS, NETWORKING_STATUS as NS, NOTIFICATION_TYPE } from '../constants/enums.js';
import { destroyRoom, emitToRoom, emitToUser, isUserOnline, joinUserToRoom, networkingRoom } from '../utils/socketHub.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { getEventOrThrow } from './accessService.js';
import { buildRoomInfo, generateRoomId } from './jitsiService.js';
import { notify } from './notificationService.js';

const USER_CARD = 'name profileImage designation company';

/* ------------------------- in-memory state ------------------------- */
const queues = new Map(); // eventId -> Map<userId, { userId, eventId, joinedAt }>
const userQueue = new Map(); // userId -> eventId
const timers = new Map(); // sessionId -> { start, end, tick }
const disconnectTimers = new Map(); // userId -> Timeout
let lockTail = Promise.resolve();
let cleaner = null;

/** Global async mutex: serialises queue/pairing operations (safe under concurrent requests). */
function withLock(fn) {
  const run = lockTail.then(fn, fn);
  lockTail = run.catch(() => {});
  return run;
}

const unref = (t) => { t.unref?.(); return t; };

function queueFor(eventId) {
  const key = String(eventId);
  if (!queues.has(key)) queues.set(key, new Map());
  return queues.get(key);
}
function dequeue(userId) {
  const uid = String(userId);
  const eventId = userQueue.get(uid);
  if (!eventId) return false;
  userQueue.delete(uid);
  const q = queues.get(eventId);
  q?.delete(uid);
  if (q && q.size === 0) queues.delete(eventId);
  return true;
}
function enqueue(userId, eventId) {
  const entry = { userId: String(userId), eventId: String(eventId), joinedAt: Date.now() };
  queueFor(eventId).set(entry.userId, entry);
  userQueue.set(entry.userId, entry.eventId);
  return entry;
}

/* ------------------------- eligibility ------------------------- */
async function assertEligible(user, eventId) {
  if (user.role !== ROLES.PARTICIPANT) throw ApiError.forbidden('Only participants can use speed networking');
  const event = await getEventOrThrow(eventId);
  if (event.status !== EVENT_STATUS.PUBLISHED) throw ApiError.conflict('Speed networking is only available for published events');
  if (env.ENFORCE_EVENT_TIME_WINDOW) {
    const now = Date.now();
    if (now < event.startDate.getTime() - env.ATTENDANCE_EARLY_MINUTES * 60000) throw ApiError.conflict('The event has not started yet');
    if (now > event.endDate.getTime()) throw ApiError.conflict('The event has ended');
  }
  const reg = await EventRegistration.exists({ event: event._id, participant: user._id, status: { $in: ACTIVE_REGISTRATION_STATUSES } });
  if (!reg) throw ApiError.forbidden(MESSAGES.NOT_REGISTERED);
  return event;
}

/** Users that must not be paired with `userId`: blocked either way, or already met (completed session) in this event. */
async function excludedPartners(userId, eventId) {
  const [blocks, met] = await Promise.all([
    Connection.find({ status: CONNECTION_STATUS.BLOCKED, $or: [{ requester: userId }, { recipient: userId }] }).select('requester recipient').lean(),
    NetworkingSession.find({ event: eventId, participants: userId, status: NS.COMPLETED }).select('participants').lean(),
  ]);
  const set = new Set();
  blocks.forEach((b) => set.add(String(b.requester) === String(userId) ? String(b.recipient) : String(b.requester)));
  met.forEach((m) => m.participants.forEach((p) => { if (String(p) !== String(userId)) set.add(String(p)); }));
  return set;
}

function purgeStale(eventId) {
  const q = queues.get(String(eventId));
  if (!q) return;
  const cutoff = Date.now() - env.NETWORKING_QUEUE_TTL_SECONDS * 1000;
  for (const entry of [...q.values()]) {
    if (entry.joinedAt < cutoff) {
      dequeue(entry.userId);
      emitToUser(entry.userId, 'networking:queue:expired', { eventId: entry.eventId });
    }
  }
}

/* ------------------------- shaping ------------------------- */
async function shapeFor(session, viewer) {
  const viewerId = String(viewer._id || viewer.id);
  const partnerId = session.participants.map(String).find((p) => p !== viewerId);
  const partner = await User.findById(partnerId).select(USER_CARD);
  const endsAt = session.actualStart ? new Date(session.actualStart.getTime() + session.duration * 1000) : new Date(session.scheduledStart.getTime() + session.duration * 1000);
  return {
    sessionId: session.id,
    eventId: String(session.event),
    status: session.status,
    partner: partner ? { id: partner.id, name: partner.name, profileImage: partner.profileImage, designation: partner.designation, company: partner.company } : null,
    room: buildRoomInfo({ roomId: session.roomId, user: viewer, expiresAt: endsAt }),
    scheduledStart: session.scheduledStart,
    actualStart: session.actualStart || null,
    endsAt,
    duration: session.duration,
    serverTime: new Date(),
  };
}

/* ------------------------- lifecycle ------------------------- */
function clearTimers(sessionId) {
  const t = timers.get(String(sessionId));
  if (!t) return;
  clearTimeout(t.start);
  clearTimeout(t.end);
  clearInterval(t.tick);
  timers.delete(String(sessionId));
}

async function activateSession(sessionId) {
  const session = await NetworkingSession.findOneAndUpdate(
    { _id: sessionId, status: NS.WAITING, isOpen: true },
    { $set: { status: NS.ACTIVE, actualStart: new Date() } },
    { new: true }
  );
  if (!session) return null;
  const room = networkingRoom(session.id);
  const endsAt = new Date(session.actualStart.getTime() + session.duration * 1000);
  emitToRoom(room, 'networking:session:start', { sessionId: session.id, actualStart: session.actualStart, endsAt, duration: session.duration, serverTime: new Date() });
  armEnd(session, endsAt);
  return session;
}

function armEnd(session, endsAt) {
  const id = session.id;
  const t = timers.get(id) || {};
  clearTimeout(t.end);
  clearInterval(t.tick);
  t.end = unref(setTimeout(() => finishSession(id, NS.COMPLETED, 'time_elapsed').catch((e) => logger.error(e.message)), Math.max(0, endsAt.getTime() - Date.now())));
  t.tick = unref(setInterval(() => {
    const remaining = Math.max(0, Math.round((endsAt.getTime() - Date.now()) / 1000));
    emitToRoom(networkingRoom(id), 'networking:session:timer', { sessionId: id, remainingSeconds: remaining, serverTime: new Date() });
  }, 10000));
  timers.set(id, t);
}

function scheduleSession(session) {
  const id = session.id;
  const t = timers.get(id) || {};
  const delay = Math.max(0, session.scheduledStart.getTime() - Date.now());
  t.start = unref(setTimeout(() => activateSession(id).catch((e) => logger.error(e.message)), delay));
  timers.set(id, t);
}

/** Atomically closes an open session (idempotent: returns null if it was already closed) and tells both participants. */
export async function finishSession(sessionId, status, reason) {
  const session = await NetworkingSession.findOneAndUpdate(
    { _id: sessionId, isOpen: true },
    { $set: { status, endReason: reason, actualEnd: new Date(), isOpen: false } },
    { new: true }
  );
  if (!session) return null;
  clearTimers(session.id);
  const room = networkingRoom(session.id);
  emitToRoom(room, 'networking:session:end', { sessionId: session.id, status, reason, actualEnd: session.actualEnd, serverTime: new Date() });
  destroyRoom(room);
  return session;
}

async function createMatch(eventId, userAId, userBId) {
  const duration = env.NETWORKING_DURATION_SECONDS;
  const scheduledStart = new Date(Date.now() + env.NETWORKING_START_DELAY_SECONDS * 1000);
  const session = await NetworkingSession.create({
    event: eventId, participantOne: userAId, participantTwo: userBId, participants: [userAId, userBId],
    roomId: generateRoomId(), scheduledStart, duration, status: NS.WAITING, isOpen: true,
  });
  scheduleSession(session);

  const room = networkingRoom(session.id);
  joinUserToRoom(userAId, room);
  joinUserToRoom(userBId, room);

  const [a, b] = await Promise.all([User.findById(userAId).select(USER_CARD), User.findById(userBId).select(USER_CARD)]);
  const [payloadA, payloadB] = await Promise.all([shapeFor(session, a), shapeFor(session, b)]);
  emitToUser(userAId, 'networking:matched', payloadA);
  emitToUser(userBId, 'networking:matched', payloadB);
  await Promise.all([
    notify({ recipient: userAId, type: NOTIFICATION_TYPE.NETWORKING_MATCH, title: 'Speed networking match', message: `You were matched with ${b.name}`, relatedEntityId: session._id }),
    notify({ recipient: userBId, type: NOTIFICATION_TYPE.NETWORKING_MATCH, title: 'Speed networking match', message: `You were matched with ${a.name}`, relatedEntityId: session._id }),
  ]);
  return { session, payloadFor: payloadA };
}

/* ------------------------- public API ------------------------- */
export async function joinQueue(user, eventId) {
  await assertEligible(user, eventId);
  if (!(await isUserOnline(user._id))) {
    throw ApiError.conflict('Open a Socket.IO connection first so you can receive your match');
  }
  return withLock(async () => {
    const uid = String(user._id);
    const open = await NetworkingSession.findOne({ participants: user._id, isOpen: true });
    if (open) throw ApiError.conflict('You already have an active networking session');

    const queuedIn = userQueue.get(uid);
    if (queuedIn) {
      if (queuedIn === String(eventId)) return { status: 'queued', eventId: String(eventId), queueSize: queueFor(eventId).size, alreadyQueued: true };
      throw ApiError.conflict('You are already in the queue for another event');
    }

    purgeStale(eventId);
    const excluded = await excludedPartners(user._id, eventId);
    const partner = [...queueFor(eventId).values()].find((e) => e.userId !== uid && !excluded.has(e.userId));

    if (!partner) {
      enqueue(uid, eventId);
      return { status: 'queued', eventId: String(eventId), queueSize: queueFor(eventId).size };
    }
    dequeue(partner.userId);
    try {
      const { session, payloadFor } = await createMatch(eventId, user._id, partner.userId);
      return { status: 'matched', session: payloadFor, sessionId: session.id };
    } catch (err) {
      queueFor(eventId).set(partner.userId, partner); // restore partner on failure
      userQueue.set(partner.userId, String(eventId));
      if (err.code === 11000) throw ApiError.conflict('One of the participants already has an active session');
      throw err;
    }
  });
}

export function leaveQueue(userId) {
  return withLock(async () => ({ removed: dequeue(userId) }));
}

export async function getActiveSession(user) {
  const session = await NetworkingSession.findOne({ participants: user._id, isOpen: true });
  return session ? shapeFor(session, user) : null;
}

export async function getHistory(user, query) {
  const { page, limit, skip } = getPagination(query);
  const filter = { participants: user._id, isOpen: false };
  const [rows, total] = await Promise.all([
    NetworkingSession.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('participantOne participantTwo', USER_CARD),
    NetworkingSession.countDocuments(filter),
  ]);
  const items = rows.map((s) => ({
    id: s.id, eventId: String(s.event), status: s.status, endReason: s.endReason,
    actualStart: s.actualStart, actualEnd: s.actualEnd, duration: s.duration,
    partner: s.participantOne._id.equals(user._id) ? s.participantTwo : s.participantOne,
  }));
  return { items, meta: paginationMeta(total, page, limit) };
}

/** Only the two paired participants may obtain room details (+ per-user Jitsi JWT when configured). */
export async function getSessionForParticipant(user, sessionId) {
  const session = await NetworkingSession.findById(sessionId);
  if (!session || !session.participants.some((p) => p.equals(user._id))) throw ApiError.notFound('Networking session not found');
  if (!session.isOpen) throw ApiError.conflict('This networking session has ended');
  return shapeFor(session, user);
}

/** A participant ends their session early. Counts as cancelled (not "completed") so analytics stay honest. */
export async function endSession(user, sessionId) {
  const session = await NetworkingSession.findById(sessionId);
  if (!session || !session.participants.some((p) => p.equals(user._id))) throw ApiError.notFound('Networking session not found');
  const closed = await finishSession(session._id, NS.CANCELLED, 'ended_early');
  if (!closed) throw ApiError.conflict('This networking session has already ended');
  return closed;
}

/* ------------------------- disconnect handling ------------------------- */
export function handleUserConnect(userId) {
  const t = disconnectTimers.get(String(userId));
  if (t) { clearTimeout(t); disconnectTimers.delete(String(userId)); }
}

/** Called when a user's last socket closes. After a short reconnect grace the queue entry / session is cleaned up. */
export function handleUserDisconnect(userId) {
  const uid = String(userId);
  handleUserConnect(uid);
  const t = setTimeout(async () => {
    disconnectTimers.delete(uid);
    try {
      await leaveQueue(uid);
      const open = await NetworkingSession.findOne({ participants: uid, isOpen: true });
      if (open) await finishSession(open._id, NS.CANCELLED, 'participant_disconnected');
    } catch (err) {
      logger.error(`disconnect cleanup failed: ${err.message}`);
    }
  }, env.NETWORKING_DISCONNECT_GRACE_SECONDS * 1000);
  disconnectTimers.set(uid, unref(t));
}

/* ------------------------- housekeeping ------------------------- */
/** Periodically drops queue entries older than NETWORKING_QUEUE_TTL_SECONDS. Returns a stop function. */
export function startQueueCleaner(intervalMs = 30000) {
  if (cleaner) clearInterval(cleaner);
  cleaner = unref(setInterval(() => { for (const eventId of [...queues.keys()]) purgeStale(eventId); }, intervalMs));
  return () => { clearInterval(cleaner); cleaner = null; };
}

/** Rebuilds timers for sessions that were open when the server last stopped. */
export async function recoverSessions() {
  const open = await NetworkingSession.find({ isOpen: true });
  for (const s of open) {
    if (s.status === NS.ACTIVE) {
      const endsAt = new Date(s.actualStart.getTime() + s.duration * 1000);
      if (endsAt <= new Date()) await finishSession(s._id, NS.COMPLETED, 'time_elapsed');
      else armEnd(s, endsAt);
    } else {
      // waiting sessions cannot be resumed reliably (clients lost their sockets) -> cancel
      await finishSession(s._id, NS.CANCELLED, 'server_recovery');
    }
  }
  return open.length;
}

/** Test helper: wipe in-memory state and timers. */
export function __resetForTests() {
  for (const id of [...timers.keys()]) clearTimers(id);
  for (const t of disconnectTimers.values()) clearTimeout(t);
  disconnectTimers.clear();
  queues.clear();
  userQueue.clear();
}
export const __queueSize = (eventId) => queues.get(String(eventId))?.size || 0;
