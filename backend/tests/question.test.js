import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { api, setupDB, clearDB, teardownDB, createUser, createEvent, registerFor } from './helpers.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

async function setup() {
  const org = await createUser({ role: 'organizer' });
  const eventId = await createEvent(org);
  const [p1, p2, p3] = [await createUser(), await createUser(), await createUser()];
  for (const p of [p1, p2, p3]) await registerFor(p, eventId).expect(201);
  return { org, eventId, p1, p2, p3 };
}
const ask = (user, eventId, text) => api().post(`/api/v1/events/${eventId}/questions`).set(user.auth).send({ questionText: text });

describe('live Q&A', () => {
  it('lets registered participants submit; others are refused', async () => {
    const { eventId, p1 } = await setup();
    const stranger = await createUser();
    const res = await ask(p1, eventId, 'What is the roadmap?');
    expect(res.status).toBe(201);
    expect(res.body.data.voteCount).toBe(0);
    expect((await ask(stranger, eventId, 'Can I ask anyway?')).status).toBe(403);
    expect((await api().get(`/api/v1/events/${eventId}/questions`).set(stranger.auth)).status).toBe(403);
    expect((await ask(p1, eventId, 'abc')).status).toBe(422);
  });
  it('allows one upvote per participant per question and supports removal', async () => {
    const { eventId, p1, p2 } = await setup();
    const q = (await ask(p1, eventId, 'First question here')).body.data.id;
    const up = await api().post(`/api/v1/questions/${q}/upvote`).set(p2.auth);
    expect(up.status).toBe(200);
    expect(up.body.data.voteCount).toBe(1);
    expect((await api().post(`/api/v1/questions/${q}/upvote`).set(p2.auth)).status).toBe(409);
    const rm = await api().delete(`/api/v1/questions/${q}/upvote`).set(p2.auth);
    expect(rm.body.data.voteCount).toBe(0);
    expect((await api().delete(`/api/v1/questions/${q}/upvote`).set(p2.auth)).status).toBe(409);
  });
  it('cannot double-vote under concurrent requests', async () => {
    const { eventId, p1, p2 } = await setup();
    const q = (await ask(p1, eventId, 'Concurrent voting test')).body.data.id;
    const results = await Promise.all(Array.from({ length: 6 }, () => api().post(`/api/v1/questions/${q}/upvote`).set(p2.auth)));
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    const list = await api().get(`/api/v1/events/${eventId}/questions`).set(p2.auth);
    expect(list.body.data[0].voteCount).toBe(1);
    expect(list.body.data[0].hasUpvoted).toBe(true);
    expect(JSON.stringify(list.body)).not.toMatch(/upvotes/);
  });
  it('sorts by vote count and floats pinned questions', async () => {
    const { org, eventId, p1, p2, p3 } = await setup();
    const q1 = (await ask(p1, eventId, 'Question number one')).body.data.id;
    const q2 = (await ask(p1, eventId, 'Question number two')).body.data.id;
    const q3 = (await ask(p1, eventId, 'Question number three')).body.data.id;
    await api().post(`/api/v1/questions/${q2}/upvote`).set(p2.auth);
    await api().post(`/api/v1/questions/${q2}/upvote`).set(p3.auth);
    await api().post(`/api/v1/questions/${q3}/upvote`).set(p2.auth);
    let list = await api().get(`/api/v1/events/${eventId}/questions`).set(p1.auth);
    expect(list.body.data.map((q) => q.id)).toEqual([q2, q3, q1]);
    await api().patch(`/api/v1/questions/${q1}/moderate`).set(org.auth).send({ action: 'pin' }).expect(200);
    list = await api().get(`/api/v1/events/${eventId}/questions`).set(p1.auth);
    expect(list.body.data[0].id).toBe(q1);
  });
  it('moderation: owner can hide/reject; hidden questions vanish for participants; others cannot moderate', async () => {
    const { org, eventId, p1, p2 } = await setup();
    const otherOrg = await createUser({ role: 'organizer' });
    const q = (await ask(p1, eventId, 'Inappropriate question')).body.data.id;
    expect((await api().patch(`/api/v1/questions/${q}/moderate`).set(p2.auth).send({ action: 'hide' })).status).toBe(403);
    expect((await api().patch(`/api/v1/questions/${q}/moderate`).set(otherOrg.auth).send({ action: 'hide' })).status).toBe(403);
    expect((await api().patch(`/api/v1/questions/${q}/moderate`).set(org.auth).send({ action: 'bogus' })).status).toBe(422);
    await api().patch(`/api/v1/questions/${q}/moderate`).set(org.auth).send({ action: 'hide' }).expect(200);
    expect((await api().get(`/api/v1/events/${eventId}/questions`).set(p2.auth)).body.data).toHaveLength(0);
    expect((await api().get(`/api/v1/events/${eventId}/questions`).set(org.auth)).body.data).toHaveLength(1);
    expect((await api().post(`/api/v1/questions/${q}/upvote`).set(p2.auth)).status).toBe(404);
    await api().patch(`/api/v1/questions/${q}/moderate`).set(org.auth).send({ action: 'unhide' }).expect(200);
    await api().patch(`/api/v1/questions/${q}/moderate`).set(org.auth).send({ action: 'reject' }).expect(200);
    expect((await api().get(`/api/v1/events/${eventId}/questions`).set(p2.auth)).body.data).toHaveLength(0);
    const notes = await api().get('/api/v1/notifications').set(p1.auth);
    expect(notes.body.data.some((n) => n.type === 'question_moderated')).toBe(true);
  });
});
