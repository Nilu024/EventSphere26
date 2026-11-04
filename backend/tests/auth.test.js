import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { api, setupDB, clearDB, teardownDB, createUser, uniqueEmail, PASSWORD } from './helpers.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { getTestOutbox } from '../src/services/emailService.js';

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

describe('registration', () => {
  it('registers a user and never returns the password hash', async () => {
    const res = await api().post('/api/v1/auth/register').send({ name: 'Ann', email: uniqueEmail(), password: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('participant');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|tokenVersion/);
    const stored = await User.findOne({ email: res.body.data.user.email }).select('+passwordHash');
    expect(stored.passwordHash).not.toBe(PASSWORD);
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
  });
  it('rejects duplicate emails (409)', async () => {
    const email = uniqueEmail();
    await api().post('/api/v1/auth/register').send({ name: 'Ann', email, password: PASSWORD }).expect(201);
    const res = await api().post('/api/v1/auth/register').send({ name: 'Ann2', email: email.toUpperCase(), password: PASSWORD });
    expect(res.status).toBe(409);
  });
  it('rejects weak passwords and self-registration as admin (422)', async () => {
    const weak = await api().post('/api/v1/auth/register').send({ name: 'Ann', email: uniqueEmail(), password: 'weak' });
    expect(weak.status).toBe(422);
    expect(weak.body.errors[0]).toHaveProperty('field');
    const admin = await api().post('/api/v1/auth/register').send({ name: 'Eve', email: uniqueEmail(), password: PASSWORD, role: 'admin' });
    expect(admin.status).toBe(422);
  });
});

describe('login and JWT', () => {
  it('logs in with valid credentials', async () => {
    const email = uniqueEmail();
    await api().post('/api/v1/auth/register').send({ name: 'Ann', email, password: PASSWORD });
    const res = await api().post('/api/v1/auth/login').send({ email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });
  it('rejects invalid credentials with the same message for unknown email and wrong password', async () => {
    const email = uniqueEmail();
    await api().post('/api/v1/auth/register').send({ name: 'Ann', email, password: PASSWORD });
    const wrong = await api().post('/api/v1/auth/login').send({ email, password: 'Wrong1234' });
    const unknown = await api().post('/api/v1/auth/login').send({ email: uniqueEmail('nobody'), password: PASSWORD });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });
  it('protects routes: missing, malformed and expired tokens give 401', async () => {
    expect((await api().get('/api/v1/auth/me')).status).toBe(401);
    expect((await api().get('/api/v1/auth/me').set('Authorization', 'Bearer garbage')).status).toBe(401);
    const u = await createUser();
    const expired = jwt.sign({ sub: u.id, tv: 0 }, env.JWT_SECRET, { expiresIn: -10 });
    const res = await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });
  it('rejects tokens signed with a different secret', async () => {
    const u = await createUser();
    const forged = jwt.sign({ sub: u.id, tv: 0 }, 'another-secret-another-secret-123456');
    expect((await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${forged}`)).status).toBe(401);
  });
  it('returns the current user for a valid token', async () => {
    const u = await createUser();
    const res = await api().get('/api/v1/auth/me').set(u.auth);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(u.email);
  });
  it('logout revokes the token', async () => {
    const u = await createUser();
    await api().post('/api/v1/auth/logout').set(u.auth).expect(200);
    expect((await api().get('/api/v1/auth/me').set(u.auth)).status).toBe(401);
  });
  it('blocks deactivated accounts (login and existing tokens)', async () => {
    const admin = await createUser({ role: 'admin' });
    const u = await createUser();
    await api().patch(`/api/v1/users/${u.id}/status`).set(admin.auth).send({ isActive: false }).expect(200);
    expect((await api().get('/api/v1/auth/me').set(u.auth)).status).toBe(401);
    const login = await api().post('/api/v1/auth/login').send({ email: u.email, password: PASSWORD });
    expect(login.status).toBe(403);
  });
});

describe('password management', () => {
  it('changes password, invalidating the old token', async () => {
    const u = await createUser();
    const res = await api().patch('/api/v1/auth/change-password').set(u.auth).send({ currentPassword: PASSWORD, newPassword: 'NewPassw0rd9' });
    expect(res.status).toBe(200);
    expect((await api().get('/api/v1/auth/me').set(u.auth)).status).toBe(401);
    const login = await api().post('/api/v1/auth/login').send({ email: u.email, password: 'NewPassw0rd9' });
    expect(login.status).toBe(200);
  });
  it('rejects a wrong current password', async () => {
    const u = await createUser();
    const res = await api().patch('/api/v1/auth/change-password').set(u.auth).send({ currentPassword: 'Nope12345', newPassword: 'NewPassw0rd9' });
    expect(res.status).toBe(401);
  });
  it('runs the forgot/reset workflow and does not reveal unknown emails', async () => {
    const u = await createUser();
    const unknown = await api().post('/api/v1/auth/forgot-password').send({ email: uniqueEmail('ghost') });
    expect(unknown.status).toBe(200);
    await api().post('/api/v1/auth/forgot-password').send({ email: u.email }).expect(200);
    const mail = getTestOutbox().filter((m) => m.to === u.email).pop();
    const token = /token=([0-9a-f]{64})/.exec(mail.text)[1];
    await api().post('/api/v1/auth/reset-password').send({ token, newPassword: 'Reset12345x' }).expect(200);
    expect((await api().post('/api/v1/auth/login').send({ email: u.email, password: 'Reset12345x' })).status).toBe(200);
    expect((await api().post('/api/v1/auth/reset-password').send({ token, newPassword: 'Reset12345y' })).status).toBe(400); // single use
  });
});

describe('role-based authorization and profile', () => {
  it('only admins can list users', async () => {
    const admin = await createUser({ role: 'admin' });
    const p = await createUser();
    expect((await api().get('/api/v1/users').set(p.auth)).status).toBe(403);
    expect((await api().get('/api/v1/users').set(admin.auth)).status).toBe(200);
  });
  it('only admins can change roles', async () => {
    const admin = await createUser({ role: 'admin' });
    const p = await createUser();
    expect((await api().patch(`/api/v1/users/${p.id}/role`).set(p.auth).send({ role: 'admin' })).status).toBe(403);
    const ok = await api().patch(`/api/v1/users/${p.id}/role`).set(admin.auth).send({ role: 'organizer' });
    expect(ok.body.data.user.role).toBe('organizer');
  });
  it('ignores mass-assignment of role/email and normalises skills', async () => {
    const u = await createUser();
    const res = await api().patch('/api/v1/users/me').set(u.auth).send({ bio: 'hi', role: 'admin', skills: ['  Java ', 'java', 'React  JS'], interests: ['AI'] });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('participant');
    expect(res.body.data.user.skills).toEqual(['java', 'react js']);
  });
  it('public profile hides email', async () => {
    const a = await createUser();
    const b = await createUser();
    const res = await api().get(`/api/v1/users/${b.id}`).set(a.auth);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBeUndefined();
  });
  it('rejects NoSQL operator injection in login', async () => {
    await createUser();
    const res = await api().post('/api/v1/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect([401, 422]).toContain(res.status);
  });
});
