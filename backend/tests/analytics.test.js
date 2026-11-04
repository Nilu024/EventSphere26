import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { api, setupDB, clearDB, teardownDB, createUser, createEvent, registerFor } from './helpers.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

describe('event analytics', () => {
  it('returns correct totals, attendance percentage and question engagement', async () => {
    const org = await createUser({ role: 'organizer' });
    const [p1, p2, p3, p4] = [await createUser(), await createUser(), await createUser(), await createUser()];
    const id = await createEvent(org);
    for (const p of [p1, p2, p3, p4]) await registerFor(p, id).expect(201);
    await api().delete(`/api/v1/events/${id}/register`).set(p4.auth).expect(200);
    await api().post(`/api/v1/events/${id}/attendance/check-in`).set(p1.auth).expect(201);
    const q1 = (await api().post(`/api/v1/events/${id}/questions`).set(p1.auth).send({ questionText: 'First analytics question' })).body.data.id;
    await api().post(`/api/v1/events/${id}/questions`).set(p2.auth).send({ questionText: 'Second analytics question' }).expect(201);
    await api().post(`/api/v1/questions/${q1}/upvote`).set(p2.auth).expect(200);
    await api().post(`/api/v1/questions/${q1}/upvote`).set(p3.auth).expect(200);

    const res = await api().get(`/api/v1/analytics/events/${id}`).set(org.auth);
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.registrations).toMatchObject({ total: 3, cancelled: 1, capacity: 50 });
    expect(d.attendance).toEqual({ totalAttendees: 1, attendancePercentage: 33.33 });
    expect(d.questions).toMatchObject({ total: 2, totalUpvotes: 2, uniqueAskers: 2, uniqueVoters: 2, averageUpvotesPerQuestion: 1 });
    expect(d.questions.topQuestion.id).toBe(q1);
    expect(d.networking.completedSessions).toBe(0);
  });
  it('handles zero registrations without dividing by zero', async () => {
    const org = await createUser({ role: 'organizer' });
    const id = await createEvent(org);
    const res = await api().get(`/api/v1/analytics/events/${id}`).set(org.auth);
    expect(res.body.data.attendance).toEqual({ totalAttendees: 0, attendancePercentage: 0 });
    expect(res.body.data.questions.total).toBe(0);
  });
  it('restricts access: owner/admin only; participants and other organizers refused', async () => {
    const org = await createUser({ role: 'organizer' });
    const other = await createUser({ role: 'organizer' });
    const p = await createUser();
    const admin = await createUser({ role: 'admin' });
    const id = await createEvent(org);
    expect((await api().get(`/api/v1/analytics/events/${id}`).set(p.auth)).status).toBe(403);
    expect((await api().get(`/api/v1/analytics/events/${id}`).set(other.auth)).status).toBe(403);
    expect((await api().get(`/api/v1/analytics/events/${id}`).set(admin.auth)).status).toBe(200);
    expect((await api().get(`/api/v1/analytics/events/${id}`)).status).toBe(401);
  });
});

describe('platform analytics', () => {
  it('is admin-only and aggregates platform data', async () => {
    const admin = await createUser({ role: 'admin' });
    const org = await createUser({ role: 'organizer' });
    const p = await createUser();
    const id = await createEvent(org);
    await registerFor(p, id).expect(201);
    expect((await api().get('/api/v1/analytics/platform').set(org.auth)).status).toBe(403);
    expect((await api().get('/api/v1/analytics/platform').set(p.auth)).status).toBe(403);
    const res = await api().get('/api/v1/analytics/platform').set(admin.auth);
    expect(res.status).toBe(200);
    expect(res.body.data.users.byRole).toEqual({ admin: 1, organizer: 1, participant: 1 });
    expect(res.body.data.events.byStatus.published).toBe(1);
    expect(res.body.data.registrations.total).toBe(1);
  });
});
