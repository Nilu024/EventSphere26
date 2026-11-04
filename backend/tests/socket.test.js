import http from 'http';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { io as ioClient } from 'socket.io-client';
import app from '../src/app.js';
import { initSockets } from '../src/sockets/index.js';
import { setIO } from '../src/utils/socketHub.js';
import * as networking from '../src/services/networkingService.js';
import { NetworkingSession } from '../src/models/NetworkingSession.js';
import { env } from '../src/config/env.js';
import { api, setupDB, clearDB, teardownDB, createUser, createEvent, registerFor, connect } from './helpers.js';

let server;
let io;
let url;
const clients = [];

beforeAll(async () => {
  await setupDB();
  server = http.createServer(app);
  io = initSockets(server);
  await new Promise((r) => server.listen(0, r));
  url = `http://127.0.0.1:${server.address().port}`;
});
afterAll(async () => {
  io.close();
  await new Promise((r) => server.close(r));
  setIO(null);
  await teardownDB();
});
beforeEach(async () => { await clearDB(); networking.__resetForTests(); });
afterEach(() => { while (clients.length) clients.pop().close(); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Connects an authenticated client that records every event it receives. */
function connectClient(token) {
  return new Promise((resolve, reject) => {
    const socket = ioClient(url, { auth: { token }, transports: ['websocket'], reconnection: false });
    socket.log = [];
    socket.onAny((ev, payload) => socket.log.push({ ev, payload }));
    socket.on('connected', () => resolve(socket));
    socket.on('connect_error', (e) => reject(e));
    clients.push(socket);
  });
}
const emit = (socket, ev, payload) => new Promise((r) => socket.emit(ev, payload, r));
async function waitFor(socket, ev, timeout = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const hit = socket.log.find((l) => l.ev === ev);
    if (hit) return hit.payload;
    await sleep(25);
  }
  throw new Error(`timed out waiting for "${ev}" (got: ${socket.log.map((l) => l.ev).join(', ')})`);
}

describe('socket authentication', () => {
  it('rejects connections without or with invalid tokens', async () => {
    await expect(connectClient(undefined)).rejects.toBeTruthy();
    await expect(connectClient('not.a.jwt')).rejects.toBeTruthy();
  });
  it('rejects tokens revoked by logout', async () => {
    const u = await createUser();
    await api().post('/api/v1/auth/logout').set(u.auth).expect(200);
    await expect(connectClient(u.token)).rejects.toBeTruthy();
  });
  it('accepts a valid token and associates the verified user', async () => {
    const u = await createUser();
    const s = await connectClient(u.token);
    const hello = await waitFor(s, 'connected');
    expect(hello.userId).toBe(u.id);
  });
});

describe('private chat over sockets', () => {
  it('delivers messages between connected users and persists them', async () => {
    const [a, b] = [await createUser(), await createUser()];
    await connect(a, b);
    const [sa, sb] = [await connectClient(a.token), await connectClient(b.token)];
    const ack = await emit(sa, 'message:send', { receiverId: b.id, content: 'hello over ws' });
    expect(ack.ok).toBe(true);
    const received = await waitFor(sb, 'message:receive');
    expect(received.content).toBe('hello over ws');
    expect(received.sender).toBe(a.id);
    const history = await api().get(`/api/v1/messages/${a.id}`).set(b.auth);
    expect(history.body.data).toHaveLength(1);
    const note = await waitFor(sb, 'notification:new');
    expect(note.type).toBe('new_message');
  });
  it('rejects messages without an accepted connection with message:error', async () => {
    const [a, b] = [await createUser(), await createUser()];
    const [sa, sb] = [await connectClient(a.token), await connectClient(b.token)];
    const ack = await emit(sa, 'message:send', { receiverId: b.id, content: 'sneaky' });
    expect(ack.ok).toBe(false);
    expect(ack.code).toBe(403);
    expect((await waitFor(sa, 'message:error')).code).toBe(403);
    await sleep(100);
    expect(sb.log.find((l) => l.ev === 'message:receive')).toBeUndefined();
  });
});

describe('live Q&A over sockets', () => {
  it('only authorised users can join; new questions and votes are broadcast', async () => {
    const org = await createUser({ role: 'organizer' });
    const eventId = await createEvent(org);
    const [p1, p2, outsider] = [await createUser(), await createUser(), await createUser()];
    await registerFor(p1, eventId).expect(201);
    await registerFor(p2, eventId).expect(201);
    const [s1, s2, so] = [await connectClient(p1.token), await connectClient(p2.token), await connectClient(outsider.token)];
    expect((await emit(so, 'question:join', { eventId })).ok).toBe(false);
    expect((await emit(s1, 'question:join', { eventId })).ok).toBe(true);
    expect((await emit(s2, 'question:join', { eventId })).ok).toBe(true);

    const ack = await emit(s1, 'question:new', { eventId, questionText: 'Live question over ws' });
    expect(ack.ok).toBe(true);
    const broadcast = await waitFor(s2, 'question:new');
    expect(broadcast.questionText).toBe('Live question over ws');
    expect(so.log.find((l) => l.ev === 'question:new')).toBeUndefined();

    const vote = await emit(s2, 'question:upvote', { questionId: ack.data.id });
    expect(vote.ok).toBe(true);
    expect((await waitFor(s1, 'question:updated')).voteCount).toBe(1);
    expect((await emit(s2, 'question:upvote', { questionId: ack.data.id })).code).toBe(409);

    await api().patch(`/api/v1/questions/${ack.data.id}/moderate`).set(org.auth).send({ action: 'hide' }).expect(200);
    expect((await waitFor(s1, 'question:moderated')).action).toBe('hide');
  });
});

describe('speed networking', () => {
  async function setup(n = 2) {
    const org = await createUser({ role: 'organizer' });
    const eventId = await createEvent(org);
    const users = [];
    for (let i = 0; i < n; i++) {
      const u = await createUser({ name: `Speed ${i}` });
      await registerFor(u, eventId).expect(201);
      u.socket = await connectClient(u.token);
      users.push(u);
    }
    return { org, eventId, users };
  }

  it('pairs two participants, issues a unique Jitsi room and ends the session on the server timer', async () => {
    const { eventId, users: [a, b] } = await setup();
    const first = await emit(a.socket, 'networking:queue:join', { eventId });
    expect(first.data.status).toBe('queued');
    const second = await emit(b.socket, 'networking:queue:join', { eventId });
    expect(second.data.status).toBe('matched');

    const ma = await waitFor(a.socket, 'networking:matched');
    const mb = await waitFor(b.socket, 'networking:matched');
    expect(ma.room.roomName).toBe(mb.room.roomName);
    expect(ma.room.roomName).toMatch(/^eventsphere-[0-9a-f]{32}$/);
    expect(ma.partner.id).toBe(b.id);
    expect(mb.partner.id).toBe(a.id);
    expect(ma.duration).toBe(env.NETWORKING_DURATION_SECONDS);

    await waitFor(a.socket, 'networking:session:start');
    const end = await waitFor(b.socket, 'networking:session:end', 8000);
    expect(end.status).toBe('completed');
    expect(end.reason).toBe('time_elapsed');
    const stored = await NetworkingSession.findById(ma.sessionId);
    expect(stored.status).toBe('completed');
    expect(stored.isOpen).toBe(false);
    expect(stored.actualEnd.getTime() - stored.actualStart.getTime()).toBeGreaterThanOrEqual(env.NETWORKING_DURATION_SECONDS * 1000 - 200);

    const hist = await api().get('/api/v1/networking/sessions/history').set(a.auth);
    expect(hist.body.data).toHaveLength(1);
    expect(hist.body.data[0].partner.id).toBe(b.id);
  });

  it('never pairs a user with themselves and treats repeated joins idempotently', async () => {
    const { eventId, users: [a] } = await setup(1);
    await emit(a.socket, 'networking:queue:join', { eventId });
    const again = await emit(a.socket, 'networking:queue:join', { eventId });
    expect(again.data.status).toBe('queued');
    expect(again.data.alreadyQueued).toBe(true);
    expect(networking.__queueSize(eventId)).toBe(1);
  });

  it('prevents duplicate active sessions and does not re-pair users who already met', async () => {
    const { eventId, users: [a, b, c] } = await setup(3);
    await emit(a.socket, 'networking:queue:join', { eventId });
    await emit(b.socket, 'networking:queue:join', { eventId });
    const dup = await emit(a.socket, 'networking:queue:join', { eventId });
    expect(dup.ok).toBe(false);
    expect(dup.code).toBe(409);
    await waitFor(a.socket, 'networking:session:end', 8000);
    // a and b already met: a joins again and must not be matched with b
    await emit(b.socket, 'networking:queue:join', { eventId });
    const retry = await emit(a.socket, 'networking:queue:join', { eventId });
    expect(retry.data.status).toBe('queued');
    const withC = await emit(c.socket, 'networking:queue:join', { eventId });
    expect(withC.data.status).toBe('matched');
    expect(withC.data.session.partner.id).toBe(b.id);
  });

  it('matches safely under concurrent joins (each user in at most one session)', async () => {
    const { eventId, users } = await setup(6);
    const acks = await Promise.all(users.map((u) => emit(u.socket, 'networking:queue:join', { eventId })));
    expect(acks.every((x) => x.ok)).toBe(true);
    expect(acks.filter((x) => x.data.status === 'matched')).toHaveLength(3);
    const sessions = await NetworkingSession.find({ isOpen: true });
    expect(sessions).toHaveLength(3);
    const ids = sessions.flatMap((s) => s.participants.map(String));
    expect(new Set(ids).size).toBe(6);
  });

  it('removes a disconnected user from the queue so nobody is matched with a ghost', async () => {
    const { eventId, users: [a, b] } = await setup();
    await emit(a.socket, 'networking:queue:join', { eventId });
    a.socket.close();
    await sleep(env.NETWORKING_DISCONNECT_GRACE_SECONDS * 1000 + 400);
    expect(networking.__queueSize(eventId)).toBe(0);
    const res = await emit(b.socket, 'networking:queue:join', { eventId });
    expect(res.data.status).toBe('queued');
  });

  it('cancels an active session when a participant disconnects', async () => {
    const { eventId, users: [a, b] } = await setup();
    await emit(a.socket, 'networking:queue:join', { eventId });
    await emit(b.socket, 'networking:queue:join', { eventId });
    await waitFor(b.socket, 'networking:session:start');
    a.socket.close();
    const end = await waitFor(b.socket, 'networking:session:end', 4000);
    expect(end.status).toBe('cancelled');
    expect(end.reason).toBe('participant_disconnected');
  });

  it('leave-queue works; ineligible users (unregistered, organizers) are refused', async () => {
    const { org, eventId, users: [a] } = await setup(1);
    await emit(a.socket, 'networking:queue:join', { eventId });
    const left = await emit(a.socket, 'networking:queue:leave', {});
    expect(left.data.removed).toBe(true);
    expect(networking.__queueSize(eventId)).toBe(0);
    const stranger = await createUser();
    const ss = await connectClient(stranger.token);
    expect((await emit(ss, 'networking:queue:join', { eventId })).code).toBe(403);
    const so = await connectClient(org.token);
    expect((await emit(so, 'networking:queue:join', { eventId })).code).toBe(403);
  });

  it('only the paired participants can read the room; ending early records a cancelled session', async () => {
    const { eventId, users: [a, b, c] } = await setup(3);
    await emit(a.socket, 'networking:queue:join', { eventId });
    await emit(b.socket, 'networking:queue:join', { eventId });
    const m = await waitFor(a.socket, 'networking:matched');
    expect((await api().get(`/api/v1/networking/sessions/${m.sessionId}`).set(a.auth)).status).toBe(200);
    expect((await api().get(`/api/v1/networking/sessions/${m.sessionId}`).set(c.auth)).status).toBe(404);
    expect((await emit(c.socket, 'networking:session:join', { sessionId: m.sessionId })).ok).toBe(false);
    const active = await api().get('/api/v1/networking/sessions/active').set(b.auth);
    expect(active.body.data.sessionId).toBe(m.sessionId);
    expect((await api().post(`/api/v1/networking/sessions/${m.sessionId}/end`).set(c.auth)).status).toBe(404);
    const end = await api().post(`/api/v1/networking/sessions/${m.sessionId}/end`).set(a.auth);
    expect(end.body.data).toMatchObject({ status: 'cancelled', endReason: 'ended_early' });
    expect((await api().get('/api/v1/networking/sessions/active').set(b.auth)).body.data).toBeNull();
  });
});
