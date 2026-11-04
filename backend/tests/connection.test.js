import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { api, setupDB, clearDB, teardownDB, createUser, connect } from './helpers.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

const send = (from, to) => api().post(`/api/v1/connections/request/${to.id}`).set(from.auth);

describe('connection requests', () => {
  it('sends a request, notifies the recipient and lists it as incoming/outgoing', async () => {
    const [a, b] = [await createUser(), await createUser()];
    const res = await send(a, b);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    const incoming = await api().get('/api/v1/connections/requests?direction=incoming').set(b.auth);
    expect(incoming.body.data.incoming).toHaveLength(1);
    expect(incoming.body.data.outgoing).toBeUndefined();
    const outgoing = await api().get('/api/v1/connections/requests?direction=outgoing').set(a.auth);
    expect(outgoing.body.data.outgoing).toHaveLength(1);
    const notes = await api().get('/api/v1/notifications').set(b.auth);
    expect(notes.body.data[0].type).toBe('connection_request');
  });
  it('rejects self-requests, duplicates and reverse duplicates', async () => {
    const [a, b] = [await createUser(), await createUser()];
    expect((await send(a, a)).status).toBe(400);
    await send(a, b).expect(201);
    expect((await send(a, b)).status).toBe(409);
    expect((await send(b, a)).status).toBe(409);
  });
  it('only the recipient can accept/reject; only the requester can cancel', async () => {
    const [a, b, c] = [await createUser(), await createUser(), await createUser()];
    const id = (await send(a, b)).body.data.id;
    expect((await api().patch(`/api/v1/connections/${id}/accept`).set(a.auth)).status).toBe(403);
    expect((await api().patch(`/api/v1/connections/${id}/accept`).set(c.auth)).status).toBe(404);
    expect((await api().patch(`/api/v1/connections/${id}/cancel`).set(b.auth)).status).toBe(403);
    expect((await api().patch(`/api/v1/connections/${id}/accept`).set(b.auth)).status).toBe(200);
    const list = await api().get('/api/v1/connections').set(a.auth);
    expect(list.body.data[0].user.id).toBe(b.id);
  });
  it('enforces state transitions', async () => {
    const [a, b] = [await createUser(), await createUser()];
    const id = await connect(a, b);
    expect((await api().patch(`/api/v1/connections/${id}/accept`).set(b.auth)).status).toBe(409);
    expect((await api().patch(`/api/v1/connections/${id}/reject`).set(b.auth)).status).toBe(409);
    expect((await api().patch(`/api/v1/connections/${id}/cancel`).set(a.auth)).status).toBe(409);
    expect((await send(a, b)).status).toBe(409);
  });
  it('allows a new request after reject or cancel', async () => {
    const [a, b] = [await createUser(), await createUser()];
    const id = (await send(a, b)).body.data.id;
    await api().patch(`/api/v1/connections/${id}/reject`).set(b.auth).expect(200);
    const again = await send(a, b);
    expect(again.status).toBe(201);
    await api().patch(`/api/v1/connections/${again.body.data.id}/cancel`).set(a.auth).expect(200);
    expect((await send(b, a)).status).toBe(201);
  });
  it('removes accepted connections', async () => {
    const [a, b] = [await createUser(), await createUser()];
    const id = await connect(a, b);
    expect((await api().delete(`/api/v1/connections/${id}`).set(b.auth)).status).toBe(200);
    expect((await api().get('/api/v1/connections').set(a.auth)).body.data).toHaveLength(0);
    expect((await api().delete(`/api/v1/connections/${id}`).set(b.auth)).status).toBe(409);
  });
  it('blocking prevents requests and hides the profile', async () => {
    const [a, b] = [await createUser(), await createUser()];
    await api().post(`/api/v1/connections/block/${a.id}`).set(b.auth).expect(200);
    expect((await send(a, b)).status).toBe(403);
    expect((await api().get(`/api/v1/users/${b.id}`).set(a.auth)).status).toBe(404);
    expect((await api().delete(`/api/v1/connections/block/${a.id}`).set(a.auth)).status).toBe(404); // blocked user cannot unblock
    await api().delete(`/api/v1/connections/block/${a.id}`).set(b.auth).expect(200);
    expect((await send(a, b)).status).toBe(201);
  });
  it('does not allow requests to organizers/unknown users or unauthenticated calls', async () => {
    const a = await createUser();
    const org = await createUser({ role: 'organizer' });
    expect((await send(a, org)).status).toBe(404);
    expect((await api().post(`/api/v1/connections/request/${a.id}`)).status).toBe(401);
    expect((await send(org, a)).status).toBe(403);
  });
});
