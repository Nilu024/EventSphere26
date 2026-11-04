import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { api, setupDB, clearDB, teardownDB, createUser, connect } from './helpers.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

const send = (from, to, content) => api().post('/api/v1/messages').set(from.auth).send({ receiverId: to.id, content });

describe('private chat authorization', () => {
  it('refuses messaging and history without an accepted connection', async () => {
    const [a, b] = [await createUser(), await createUser()];
    expect((await send(a, b, 'hello')).status).toBe(403);
    expect((await api().get(`/api/v1/messages/${b.id}`).set(a.auth)).status).toBe(403);
    await api().post(`/api/v1/connections/request/${b.id}`).set(a.auth).expect(201); // pending is not enough
    expect((await send(a, b, 'hello')).status).toBe(403);
  });
  it('persists messages and returns paginated history newest-first to both parties only', async () => {
    const [a, b, c] = [await createUser(), await createUser(), await createUser()];
    await connect(a, b);
    for (let i = 1; i <= 5; i++) await send(i % 2 ? a : b, i % 2 ? b : a, `message ${i}`).expect(201);
    const page1 = await api().get(`/api/v1/messages/${b.id}?limit=2&page=1`).set(a.auth);
    expect(page1.body.data.map((m) => m.content)).toEqual(['message 5', 'message 4']);
    expect(page1.body.meta).toMatchObject({ total: 5, totalPages: 3, hasNext: true });
    const page3 = await api().get(`/api/v1/messages/${a.id}?limit=2&page=3`).set(b.auth);
    expect(page3.body.data.map((m) => m.content)).toEqual(['message 1']);
    // a third user has no connection with a and cannot read that conversation
    expect((await api().get(`/api/v1/messages/${a.id}`).set(c.auth)).status).toBe(403);
    expect((await send(c, a, 'intrude')).status).toBe(403);
  });
  it('stops messaging after the connection is removed; validates content', async () => {
    const [a, b] = [await createUser(), await createUser()];
    const id = await connect(a, b);
    expect((await send(a, b, '   ')).status).toBe(422);
    expect((await send(a, b, 'x'.repeat(2001))).status).toBe(422);
    await send(a, b, 'hi').expect(201);
    await api().delete(`/api/v1/connections/${id}`).set(b.auth).expect(200);
    expect((await send(a, b, 'still there?')).status).toBe(403);
    expect((await api().get(`/api/v1/messages/${b.id}`).set(a.auth)).status).toBe(403);
  });
  it('creates a single unread "new message" notification per conversation', async () => {
    const [a, b] = [await createUser(), await createUser()];
    await connect(a, b);
    await send(a, b, 'one').expect(201);
    await send(a, b, 'two').expect(201);
    const notes = await api().get('/api/v1/notifications').set(b.auth);
    expect(notes.body.data.filter((n) => n.type === 'new_message')).toHaveLength(1);
  });
  it('cannot message yourself; organizers cannot use chat', async () => {
    const a = await createUser();
    const org = await createUser({ role: 'organizer' });
    expect((await send(a, a, 'me')).status).toBe(400);
    expect((await send(org, a, 'hi')).status).toBe(403);
  });
});

describe('notifications', () => {
  it('lists, marks one and all as read, and is private to the owner', async () => {
    const [a, b] = [await createUser(), await createUser()];
    await api().post(`/api/v1/connections/request/${b.id}`).set(a.auth).expect(201);
    const list = await api().get('/api/v1/notifications').set(b.auth);
    expect(list.body.meta.unreadCount).toBe(1);
    const id = list.body.data[0].id;
    expect((await api().patch(`/api/v1/notifications/${id}/read`).set(a.auth)).status).toBe(404);
    expect((await api().patch(`/api/v1/notifications/${id}/read`).set(b.auth)).body.data.isRead).toBe(true);
    await api().patch('/api/v1/notifications/read-all').set(b.auth).expect(200);
    expect((await api().get('/api/v1/notifications?isRead=false').set(b.auth)).body.data).toHaveLength(0);
  });
});
