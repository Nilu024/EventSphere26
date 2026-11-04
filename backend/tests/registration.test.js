import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { api, setupDB, clearDB, teardownDB, createUser, createEvent, registerFor } from './helpers.js';
import { Event } from '../src/models/Event.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

describe('event registration', () => {
  it('registers a participant and increments the seat counter', async () => {
    const org = await createUser({ role: 'organizer' });
    const p = await createUser();
    const id = await createEvent(org);
    const res = await registerFor(p, id);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('registered');
    expect((await Event.findById(id)).registeredCount).toBe(1);
    const mine = await api().get('/api/v1/registrations/me').set(p.auth);
    expect(mine.body.data).toHaveLength(1);
    const notes = await api().get('/api/v1/notifications').set(p.auth);
    expect(notes.body.data[0].type).toBe('event_registration');
  });
  it('prevents duplicate registrations (409)', async () => {
    const org = await createUser({ role: 'organizer' });
    const p = await createUser();
    const id = await createEvent(org);
    await registerFor(p, id).expect(201);
    expect((await registerFor(p, id)).status).toBe(409);
    expect((await Event.findById(id)).registeredCount).toBe(1);
  });
  it('rejects registration for full events, drafts and passed deadlines', async () => {
    const org = await createUser({ role: 'organizer' });
    const [p1, p2] = [await createUser(), await createUser()];
    const full = await createEvent(org, { capacity: 1 });
    await registerFor(p1, full).expect(201);
    expect((await registerFor(p2, full)).status).toBe(409);
    const draft = await createEvent(org, {}, { publish: false });
    expect((await registerFor(p2, draft)).status).toBe(409);
    const late = await createEvent(org);
    await Event.updateOne({ _id: late }, { registrationDeadline: new Date(Date.now() - 1000) });
    expect((await registerFor(p2, late)).status).toBe(409);
  });
  it('never oversells capacity under concurrent registrations', async () => {
    const org = await createUser({ role: 'organizer' });
    const id = await createEvent(org, { capacity: 3 });
    const users = await Promise.all(Array.from({ length: 8 }, () => createUser()));
    const results = await Promise.all(users.map((u) => registerFor(u, id)));
    expect(results.filter((r) => r.status === 201)).toHaveLength(3);
    expect(results.filter((r) => r.status === 409)).toHaveLength(5);
    expect((await Event.findById(id)).registeredCount).toBe(3);
  });
  it('cancels and allows re-registration, freeing the seat in between', async () => {
    const org = await createUser({ role: 'organizer' });
    const p = await createUser();
    const id = await createEvent(org, { capacity: 1 });
    await registerFor(p, id).expect(201);
    await api().delete(`/api/v1/events/${id}/register`).set(p.auth).expect(200);
    expect((await Event.findById(id)).registeredCount).toBe(0);
    expect((await api().delete(`/api/v1/events/${id}/register`).set(p.auth)).status).toBe(404);
    expect((await registerFor(p, id)).status).toBe(201);
    expect((await Event.findById(id)).registeredCount).toBe(1);
  });
  it('only participants register; only the owner lists registrations', async () => {
    const org = await createUser({ role: 'organizer' });
    const other = await createUser({ role: 'organizer' });
    const p = await createUser();
    const id = await createEvent(org);
    expect((await registerFor(org, id)).status).toBe(403);
    await registerFor(p, id).expect(201);
    expect((await api().get(`/api/v1/events/${id}/registrations`).set(org.auth)).body.data).toHaveLength(1);
    expect((await api().get(`/api/v1/events/${id}/registrations`).set(other.auth)).status).toBe(403);
    expect((await api().get(`/api/v1/events/${id}/registrations`).set(p.auth)).status).toBe(403);
  });
});

describe('attendance', () => {
  it('records check-in once, requires registration, and updates the registration status', async () => {
    const org = await createUser({ role: 'organizer' });
    const p = await createUser();
    const stranger = await createUser();
    const id = await createEvent(org);
    await registerFor(p, id).expect(201);
    expect((await api().post(`/api/v1/events/${id}/attendance/check-in`).set(stranger.auth)).status).toBe(403);
    expect((await api().post(`/api/v1/events/${id}/attendance/check-in`).set(p.auth)).status).toBe(201);
    expect((await api().post(`/api/v1/events/${id}/attendance/check-in`).set(p.auth)).status).toBe(409);
    const reg = await api().get('/api/v1/registrations/me').set(p.auth);
    expect(reg.body.data[0].status).toBe('attended');
    const out = await api().post(`/api/v1/events/${id}/attendance/check-out`).set(p.auth);
    expect(out.body.data.attendanceStatus).toBe('checked_out');
    const report = await api().get(`/api/v1/events/${id}/attendance`).set(org.auth);
    expect(report.body.meta.summary).toEqual({ registered: 1, attended: 1, attendancePercentage: 100 });
  });
  it('lets only the owning organizer mark attendance manually', async () => {
    const org = await createUser({ role: 'organizer' });
    const other = await createUser({ role: 'organizer' });
    const p = await createUser();
    const id = await createEvent(org);
    await registerFor(p, id).expect(201);
    expect((await api().post(`/api/v1/events/${id}/attendance/mark`).set(other.auth).send({ participantId: p.id })).status).toBe(403);
    expect((await api().post(`/api/v1/events/${id}/attendance/mark`).set(org.auth).send({ participantId: p.id })).status).toBe(201);
    expect((await api().post(`/api/v1/events/${id}/attendance/mark`).set(org.auth).send({ participantId: p.id })).status).toBe(409);
  });
});
