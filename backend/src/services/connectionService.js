import { Connection } from '../models/Connection.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { CONNECTION_STATUS as S, NOTIFICATION_TYPE } from '../constants/enums.js';
import { ROLES } from '../constants/roles.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { notify } from './notificationService.js';

const USER_FIELDS = 'name profileImage designation company';

const otherParty = (conn, me) => (conn.requester.equals(me) ? conn.recipient : conn.requester);

/** Ids of users with whom `userId` has a connection in any of the given statuses. */
export async function relatedUserIds(userId, statuses) {
  const rows = await Connection.find({ status: { $in: statuses }, $or: [{ requester: userId }, { recipient: userId }] }).select('requester recipient').lean();
  return rows.map((r) => (String(r.requester) === String(userId) ? String(r.recipient) : String(r.requester)));
}

export const blockedUserIds = (userId) => relatedUserIds(userId, [S.BLOCKED]);

export async function isBlockedBetween(a, b) {
  return Boolean(await Connection.exists({ pairKey: Connection.pairKey(a, b), status: S.BLOCKED }));
}

/** Describes the relationship from `me` toward `other`. */
export async function getRelationship(me, other) {
  const c = await Connection.findOne({ pairKey: Connection.pairKey(me, other) });
  if (!c || c.status === S.BLOCKED) return { status: 'none' };
  if (c.status === S.PENDING) return { status: c.requester.equals(me) ? 'pending_outgoing' : 'pending_incoming', connectionId: c.id };
  return { status: c.status, connectionId: c.id };
}

export async function sendRequest(requesterId, recipientId) {
  if (String(requesterId) === String(recipientId)) throw ApiError.badRequest('You cannot connect with yourself');
  const recipient = await User.findOne({ _id: recipientId, isActive: true, role: ROLES.PARTICIPANT });
  if (!recipient) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
  const pairKey = Connection.pairKey(requesterId, recipientId);

  let conn = await Connection.findOne({ pairKey });
  if (!conn) {
    try {
      conn = await Connection.create({ pairKey, requester: requesterId, recipient: recipientId });
    } catch (err) {
      if (err.code === 11000) throw ApiError.conflict('A connection request already exists between these users');
      throw err;
    }
  } else if (conn.status === S.PENDING) {
    throw ApiError.conflict(conn.recipient.equals(requesterId) ? 'This user already sent you a request - accept it instead' : 'A request is already pending');
  } else if (conn.status === S.ACCEPTED) {
    throw ApiError.conflict('You are already connected');
  } else if (conn.status === S.BLOCKED) {
    throw ApiError.forbidden('Connection request not allowed');
  } else {
    // rejected | cancelled -> pending again (atomic: only if still in a re-requestable state)
    conn = await Connection.findOneAndUpdate(
      { _id: conn._id, status: { $in: [S.REJECTED, S.CANCELLED] } },
      { requester: requesterId, recipient: recipientId, status: S.PENDING, respondedAt: null, removedAt: null },
      { new: true }
    );
    if (!conn) throw ApiError.conflict('Connection state changed, please retry');
  }
  const requester = await User.findById(requesterId).select('name');
  await notify({
    recipient: recipientId, type: NOTIFICATION_TYPE.CONNECTION_REQUEST,
    title: 'New connection request', message: `${requester.name} wants to connect with you`, relatedEntityId: conn._id,
  });
  return conn;
}

/** Atomic state transition; on failure diagnoses 404 vs 403 vs 409. */
async function transition(id, userId, { from, to, actor }) {
  const actorFilter = actor === 'recipient' ? { recipient: userId } : { requester: userId };
  const updated = await Connection.findOneAndUpdate(
    { _id: id, status: from, ...actorFilter },
    { status: to, respondedAt: new Date() },
    { new: true }
  );
  if (updated) return updated;
  const existing = await Connection.findById(id);
  const involved = existing && (existing.requester.equals(userId) || existing.recipient.equals(userId));
  if (!existing || !involved || existing.status === S.BLOCKED) throw ApiError.notFound(MESSAGES.CONNECTION_NOT_FOUND);
  if (existing.status === from) throw ApiError.forbidden(`Only the ${actor} can perform this action`);
  throw ApiError.conflict(`Cannot change a ${existing.status} connection to ${to}`);
}

export async function acceptRequest(id, userId) {
  const conn = await transition(id, userId, { from: S.PENDING, to: S.ACCEPTED, actor: 'recipient' });
  const me = await User.findById(userId).select('name');
  await notify({
    recipient: conn.requester, type: NOTIFICATION_TYPE.CONNECTION_ACCEPTED,
    title: 'Connection accepted', message: `${me.name} accepted your connection request`, relatedEntityId: conn._id,
  });
  return conn;
}
export const rejectRequest = (id, userId) => transition(id, userId, { from: S.PENDING, to: S.REJECTED, actor: 'recipient' });
export const cancelRequest = (id, userId) => transition(id, userId, { from: S.PENDING, to: S.CANCELLED, actor: 'requester' });

/** Removes an accepted connection (either side). The document is kept as `cancelled` so history stays consistent. */
export async function removeConnection(id, userId) {
  const conn = await Connection.findOneAndUpdate(
    { _id: id, status: S.ACCEPTED, $or: [{ requester: userId }, { recipient: userId }] },
    { status: S.CANCELLED, removedAt: new Date() },
    { new: true }
  );
  if (!conn) {
    const existing = await Connection.findById(id);
    const involved = existing && (existing.requester.equals(userId) || existing.recipient.equals(userId));
    if (!involved || existing.status === S.BLOCKED) throw ApiError.notFound(MESSAGES.CONNECTION_NOT_FOUND);
    throw ApiError.conflict('Only accepted connections can be removed');
  }
  return conn;
}

export async function blockUser(userId, targetId) {
  if (String(userId) === String(targetId)) throw ApiError.badRequest('You cannot block yourself');
  const target = await User.exists({ _id: targetId });
  if (!target) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
  const pairKey = Connection.pairKey(userId, targetId);
  const existing = await Connection.findOne({ pairKey });
  if (existing?.status === S.BLOCKED) {
    if (existing.blockedBy.equals(userId)) return existing; // idempotent
    // The other user already blocked us; keep their block authoritative.
    throw ApiError.forbidden('Action not allowed');
  }
  return Connection.findOneAndUpdate(
    { pairKey },
    { $set: { requester: userId, recipient: targetId, status: S.BLOCKED, blockedBy: userId, respondedAt: new Date() } },
    { new: true, upsert: true, runValidators: true }
  );
}

export async function unblockUser(userId, targetId) {
  const conn = await Connection.findOneAndUpdate(
    { pairKey: Connection.pairKey(userId, targetId), status: S.BLOCKED, blockedBy: userId },
    { status: S.CANCELLED, blockedBy: null },
    { new: true }
  );
  if (!conn) throw ApiError.notFound('Block not found');
  return conn;
}

export async function listBlocked(userId) {
  const rows = await Connection.find({ status: S.BLOCKED, blockedBy: userId }).populate('recipient requester', USER_FIELDS);
  return rows.map((c) => (c.requester._id.equals(userId) ? c.recipient : c.requester));
}

export async function listAccepted(userId, query) {
  const { page, limit, skip } = getPagination(query);
  const filter = { status: S.ACCEPTED, $or: [{ requester: userId }, { recipient: userId }] };
  const [rows, total] = await Promise.all([
    Connection.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('requester recipient', USER_FIELDS),
    Connection.countDocuments(filter),
  ]);
  const items = rows.map((c) => ({
    id: c.id, connectedAt: c.respondedAt, user: c.requester._id.equals(userId) ? c.recipient : c.requester,
  }));
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function listRequests(userId, direction) {
  const out = {};
  if (direction === 'incoming' || direction === 'all') {
    out.incoming = await Connection.find({ recipient: userId, status: S.PENDING }).sort({ createdAt: -1 }).populate('requester', USER_FIELDS);
  }
  if (direction === 'outgoing' || direction === 'all') {
    out.outgoing = await Connection.find({ requester: userId, status: S.PENDING }).sort({ createdAt: -1 }).populate('recipient', USER_FIELDS);
  }
  return out;
}

export { otherParty };
