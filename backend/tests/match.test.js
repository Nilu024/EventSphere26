import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { jaccardPercent, weightedScore, attendancePercentage } from '../src/utils/similarity.js';
import { scoreProfiles, rankCandidates } from '../src/services/matchService.js';
import { api, setupDB, clearDB, teardownDB, createUser, connect, createEvent, registerFor } from './helpers.js';

describe('matching maths (unit)', () => {
  it('computes Jaccard similarity as a percentage', () => {
    expect(jaccardPercent(['a', 'b', 'c'], ['a', 'b', 'd'])).toBeCloseTo(50);
    expect(jaccardPercent(['a'], ['b'])).toBe(0);
    expect(jaccardPercent(['a', 'b'], ['a', 'b'])).toBe(100);
    expect(jaccardPercent([], [])).toBe(0);
    expect(jaccardPercent(['a'], [])).toBe(0);
  });
  it('applies the 60/40 weighting', () => {
    expect(weightedScore(100, 0)).toBe(60);
    expect(weightedScore(0, 100)).toBe(40);
    expect(weightedScore(50, 33.3333)).toBeCloseTo(43.33, 2);
  });
  it('reproduces the specification example', () => {
    const A = { skills: ['Java', 'React', 'MongoDB'], interests: ['Backend Development', 'Cloud Computing'] };
    const B = { skills: ['Java', 'React', 'Node.js'], interests: ['Backend Development', 'AI'] };
    const r = scoreProfiles(A, B);
    expect(r.skillSimilarity).toBe(50);
    expect(r.interestSimilarity).toBe(33.33);
    expect(r.score).toBe(43.33);
    expect(r.sharedSkills).toEqual(['java', 'react']);
  });
  it('ranks, excludes self, drops zero scores and returns at most five', () => {
    const me = { _id: 'me', skills: ['a', 'b'], interests: ['x'] };
    const others = [
      { _id: 'me', name: 'Me', skills: ['a', 'b'], interests: ['x'] },
      ...Array.from({ length: 7 }, (_, i) => ({ _id: `u${i}`, name: `U${i}`, skills: i < 6 ? ['a'] : [], interests: i < 3 ? ['x'] : [] })),
      { _id: 'zero', name: 'Zero', skills: ['q'], interests: ['z'] },
    ];
    const out = rankCandidates(me, others);
    expect(out).toHaveLength(5);
    expect(out.find((r) => r.user._id === 'me')).toBeUndefined();
    expect(out.find((r) => r.user._id === 'zero')).toBeUndefined();
    const scores = out.map((r) => r.score);
    expect(scores).toEqual([...scores].sort((x, y) => y - x));
  });
  it('handles attendance percentage with zero registrations', () => {
    expect(attendancePercentage(0, 0)).toBe(0);
    expect(attendancePercentage(1, 3)).toBe(33.33);
  });
});

describe('recommendation API', () => {
  beforeAll(setupDB);
  afterAll(teardownDB);
  beforeEach(clearDB);

  it('returns scored top-5, excluding self, connected, pending and blocked users', async () => {
    const me = await createUser({ skills: ['java', 'react'], interests: ['ai'] });
    const best = await createUser({ name: 'Best', skills: ['java', 'react'], interests: ['ai'] });
    const mid = await createUser({ name: 'Mid', skills: ['java'], interests: ['ai'] });
    const low = await createUser({ name: 'Low', skills: ['go'], interests: ['ai'] });
    const connected = await createUser({ skills: ['java', 'react'], interests: ['ai'] });
    const blocked = await createUser({ skills: ['java', 'react'], interests: ['ai'] });
    const pending = await createUser({ skills: ['java', 'react'], interests: ['ai'] });
    const inactive = await createUser({ skills: ['java', 'react'], interests: ['ai'] });
    const none = await createUser({ skills: ['cobol'], interests: ['gardening'] });
    await createUser({ role: 'organizer', skills: ['java', 'react'] });
    await connect(me, connected);
    await api().post(`/api/v1/connections/block/${blocked.id}`).set(me.auth).expect(200);
    await api().post(`/api/v1/connections/request/${pending.id}`).set(me.auth).expect(201);
    const admin = await createUser({ role: 'admin' });
    await api().patch(`/api/v1/users/${inactive.id}/status`).set(admin.auth).send({ isActive: false }).expect(200);

    const res = await api().get('/api/v1/networking/recommendations').set(me.auth);
    expect(res.status).toBe(200);
    const names = res.body.data.map((r) => r.user.name);
    expect(names).toEqual(['Best', 'Mid', 'Low']);
    expect(res.body.data[0].score).toBe(100);
    expect(res.body.data[1].score).toBe(70);
    const ids = res.body.data.map((r) => r.user.id);
    for (const excluded of [me, connected, blocked, pending, inactive, none]) expect(ids).not.toContain(excluded.id);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|email/);
    expect(best.id).toBe(ids[0]);
    expect(mid.id).toBe(ids[1]);
    expect(low.id).toBe(ids[2]);
  });
  it('limits to five and returns an empty list for empty profiles', async () => {
    const me = await createUser({ skills: ['java'] });
    for (let i = 0; i < 7; i++) await createUser({ skills: ['java'] });
    expect((await api().get('/api/v1/networking/recommendations').set(me.auth)).body.data).toHaveLength(5);
    const empty = await createUser();
    expect((await api().get('/api/v1/networking/recommendations').set(empty.auth)).body.data).toEqual([]);
  });
  it('supports event-specific recommendations and requires membership', async () => {
    const org = await createUser({ role: 'organizer' });
    const me = await createUser({ skills: ['java'] });
    const inEvent = await createUser({ name: 'In', skills: ['java'] });
    await createUser({ name: 'Out', skills: ['java'] });
    const eventId = await createEvent(org);
    await registerFor(me, eventId).expect(201);
    await registerFor(inEvent, eventId).expect(201);
    const ok = await api().get(`/api/v1/networking/recommendations?eventId=${eventId}`).set(me.auth);
    expect(ok.body.data.map((r) => r.user.name)).toEqual(['In']);
    const outsider = await createUser({ skills: ['java'] });
    expect((await api().get(`/api/v1/networking/recommendations?eventId=${eventId}`).set(outsider.auth)).status).toBe(403);
  });
  it('detail endpoint hides blocked users and self; only participants may call', async () => {
    const me = await createUser({ skills: ['java'] });
    const other = await createUser({ skills: ['java'] });
    const org = await createUser({ role: 'organizer' });
    const ok = await api().get(`/api/v1/networking/recommendations/${other.id}`).set(me.auth);
    expect(ok.status).toBe(200);
    expect(ok.body.data.score).toBe(60);
    expect((await api().get(`/api/v1/networking/recommendations/${me.id}`).set(me.auth)).status).toBe(400);
    await api().post(`/api/v1/connections/block/${me.id}`).set(other.auth).expect(200);
    expect((await api().get(`/api/v1/networking/recommendations/${other.id}`).set(me.auth)).status).toBe(404);
    expect((await api().get('/api/v1/networking/recommendations').set(org.auth)).status).toBe(403);
  });
});
