import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { api, setupDB, clearDB, teardownDB, createUser, createEvent, registerFor, days } from './helpers.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

const payload = (o = {}) => ({ title: 'Cloud Summit', description: 'All about cloud computing', category: 'conference', startDate: days(1), endDate: days(2), capacity: 10, ...o });

describe('event CRUD', () => {
  it('organizer creates a draft event; participant cannot', async () => {
    const org = await createUser({ role: 'organizer' });
    const p = await createUser();
    const res = await api().post('/api/v1/events').set(org.auth).send(payload());
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.organizer).toBe(org.id);
    expect((await api().post('/api/v1/events').set(p.auth).send(payload())).status).toBe(403);
    expect((await api().post('/api/v1/events').send(payload())).status).toBe(401);
  });
  it('validates dates and required fields (422)', async () => {
    const org = await createUser({ role: 'organizer' });
    const bad = await api().post('/api/v1/events').set(org.auth).send(payload({ startDate: days(3), endDate: days(2) }));
    expect(bad.status).toBe(422);
    expect((await api().post('/api/v1/events').set(org.auth).send({ title: 'x' })).status).toBe(422);
  });
  it('ignores client-supplied organizer / status', async () => {
    const org = await createUser({ role: 'organizer' });
    const other = await createUser({ role: 'organizer' });
    const res = await api().post('/api/v1/events').set(org.auth).send(payload({ organizer: other.id, status: 'published' }));
    expect(res.body.data.organizer).toBe(org.id);
    expect(res.body.data.status).toBe('draft');
  });
  it('reads, updates, publishes, cancels and deletes', async () => {
    const org = await createUser({ role: 'organizer' });
    const id = await createEvent(org, {}, { publish: false });
    const upd = await api().patch(`/api/v1/events/${id}`).set(org.auth).send({ title: 'Renamed Summit' });
    expect(upd.body.data.title).toBe('Renamed Summit');
    expect((await api().patch(`/api/v1/events/${id}/publish`).set(org.auth)).body.data.status).toBe('published');
    expect((await api().patch(`/api/v1/events/${id}/publish`).set(org.auth)).status).toBe(409);
    expect((await api().patch(`/api/v1/events/${id}/cancel`).set(org.auth)).body.data.status).toBe('cancelled');
    expect((await api().patch(`/api/v1/events/${id}`).set(org.auth).send({ title: 'Nope Nope' })).status).toBe(409);
    expect((await api().delete(`/api/v1/events/${id}`).set(org.auth)).status).toBe(200);
    expect((await api().get(`/api/v1/events/${id}`).set(org.auth)).status).toBe(404);
  });
  it('cannot delete an event that has registrations', async () => {
    const org = await createUser({ role: 'organizer' });
    const p = await createUser();
    const id = await createEvent(org);
    await registerFor(p, id).expect(201);
    expect((await api().delete(`/api/v1/events/${id}`).set(org.auth)).status).toBe(409);
  });
});

describe('organizer ownership', () => {
  it("blocks another organizer from modifying, publishing, cancelling or deleting", async () => {
    const a = await createUser({ role: 'organizer' });
    const b = await createUser({ role: 'organizer' });
    const id = await createEvent(a, {}, { publish: false });
    expect((await api().patch(`/api/v1/events/${id}`).set(b.auth).send({ title: 'Hijacked' })).status).toBe(403);
    expect((await api().patch(`/api/v1/events/${id}/publish`).set(b.auth)).status).toBe(403);
    expect((await api().patch(`/api/v1/events/${id}/cancel`).set(b.auth)).status).toBe(403);
    expect((await api().delete(`/api/v1/events/${id}`).set(b.auth)).status).toBe(403);
    expect((await api().post(`/api/v1/events/${id}/sessions`).set(b.auth).send({ title: 'Intruder', startTime: days(1.1), endTime: days(1.2) })).status).toBe(403);
    expect((await api().post(`/api/v1/events/${id}/speakers`).set(b.auth).send({ name: 'Intruder' })).status).toBe(403);
  });
  it('lets an admin manage any event', async () => {
    const org = await createUser({ role: 'organizer' });
    const admin = await createUser({ role: 'admin' });
    const id = await createEvent(org, {}, { publish: false });
    expect((await api().patch(`/api/v1/events/${id}`).set(admin.auth).send({ title: 'Admin Edit' })).status).toBe(200);
  });
});

describe('listing, search, pagination', () => {
  it('shows only published events publicly and hides drafts', async () => {
    const org = await createUser({ role: 'organizer' });
    const draft = await createEvent(org, { title: 'Hidden Draft' }, { publish: false });
    await createEvent(org, { title: 'Visible One' });
    const list = await api().get('/api/v1/events');
    expect(list.status).toBe(200);
    expect(list.body.data.map((e) => e.title)).toEqual(['Visible One']);
    expect((await api().get(`/api/v1/events/${draft}`)).status).toBe(404);
    expect((await api().get(`/api/v1/events/${draft}`).set(org.auth)).status).toBe(200);
  });
  it('supports search, category filter, sorting and pagination', async () => {
    const org = await createUser({ role: 'organizer' });
    await createEvent(org, { title: 'Alpha Workshop', category: 'workshop' });
    await createEvent(org, { title: 'Beta Conference' });
    await createEvent(org, { title: 'Gamma Conference' });
    const search = await api().get('/api/v1/events?search=alpha');
    expect(search.body.data).toHaveLength(1);
    const cat = await api().get('/api/v1/events?category=conference&sortBy=title&order=desc');
    expect(cat.body.data.map((e) => e.title)).toEqual(['Gamma Conference', 'Beta Conference']);
    const page = await api().get('/api/v1/events?limit=2&page=2&sortBy=title');
    expect(page.body.data).toHaveLength(1);
    expect(page.body.meta).toMatchObject({ total: 3, totalPages: 2, hasPrev: true });
  });
  it('mine=true returns the organizer\'s drafts and requires auth', async () => {
    const org = await createUser({ role: 'organizer' });
    const other = await createUser({ role: 'organizer' });
    await createEvent(org, { title: 'My Draft' }, { publish: false });
    await createEvent(other, { title: 'Theirs' }, { publish: false });
    const res = await api().get('/api/v1/events?mine=true').set(org.auth);
    expect(res.body.data.map((e) => e.title)).toEqual(['My Draft']);
    expect((await api().get('/api/v1/events?mine=true')).status).toBe(401);
  });
});

describe('sessions and speakers', () => {
  it('creates sessions inside the event window, assigns a speaker of the same event', async () => {
    const org = await createUser({ role: 'organizer' });
    const id = await createEvent(org);
    const sp = await api().post(`/api/v1/events/${id}/speakers`).set(org.auth).send({ name: 'Dr. Grace', expertise: ['AI', 'ai'] });
    expect(sp.status).toBe(201);
    expect(sp.body.data.expertise).toEqual(['ai']);
    const ses = await api().post(`/api/v1/events/${id}/sessions`).set(org.auth).send({ title: 'Keynote', speaker: sp.body.data.id, startTime: days(1.1), endTime: days(1.2) });
    expect(ses.status).toBe(201);
    const outside = await api().post(`/api/v1/events/${id}/sessions`).set(org.auth).send({ title: 'Too late', startTime: days(5), endTime: days(5.1) });
    expect(outside.status).toBe(422);
    const list = await api().get(`/api/v1/events/${id}/sessions`);
    expect(list.body.data[0].speaker.name).toBe('Dr. Grace');
    const upd = await api().patch(`/api/v1/sessions/${ses.body.data.id}`).set(org.auth).send({ title: 'Opening Keynote' });
    expect(upd.body.data.title).toBe('Opening Keynote');
    expect((await api().delete(`/api/v1/speakers/${sp.body.data.id}`).set(org.auth)).status).toBe(200);
    expect((await api().get(`/api/v1/events/${id}/sessions`)).body.data[0].speaker).toBeNull();
    expect((await api().delete(`/api/v1/sessions/${ses.body.data.id}`).set(org.auth)).status).toBe(200);
  });
  it('rejects a speaker from a different event', async () => {
    const org = await createUser({ role: 'organizer' });
    const e1 = await createEvent(org);
    const e2 = await createEvent(org);
    const sp = await api().post(`/api/v1/events/${e1}/speakers`).set(org.auth).send({ name: 'Speaker One' });
    const res = await api().post(`/api/v1/events/${e2}/sessions`).set(org.auth).send({ title: 'Session X', speaker: sp.body.data.id, startTime: days(1.1), endTime: days(1.2) });
    expect(res.status).toBe(422);
  });
});
