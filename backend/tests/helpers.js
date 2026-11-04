import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/services/authService.js';

export const PASSWORD = 'Passw0rdTest';
let counter = 0;
export const uniqueEmail = (p = 'user') => `${p}${Date.now()}${counter++}@example.com`;
export const api = () => request(app);
export const days = (n) => new Date(Date.now() + n * 86400000).toISOString();

/** Connects to the isolated test DB (name must contain "test") and rebuilds indexes. */
export async function setupDB() {
  await connectDB();
  if (!mongoose.connection.name.toLowerCase().includes('test')) {
    throw new Error(`Refusing to run tests against non-test database "${mongoose.connection.name}"`);
  }
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}
export async function clearDB() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}
export async function teardownDB() {
  await mongoose.connection.dropDatabase();
  await disconnectDB();
}

export async function createUser({ role = 'participant', name, skills, interests, email } = {}) {
  const mail = email || uniqueEmail(role);
  if (role === 'admin') {
    await User.create({ name: name || 'Admin User', email: mail, passwordHash: await hashPassword(PASSWORD), role: 'admin' });
  } else {
    const res = await api().post('/api/v1/auth/register').send({ name: name || `${role} user`, email: mail, password: PASSWORD, role });
    if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  }
  const login = await api().post('/api/v1/auth/login').send({ email: mail, password: PASSWORD });
  const token = login.body.data.token;
  const user = login.body.data.user;
  const auth = { Authorization: `Bearer ${token}` };
  if (skills || interests) {
    const r = await api().patch('/api/v1/users/me').set(auth).send({ ...(skills && { skills }), ...(interests && { interests }) });
    if (r.status !== 200) throw new Error(`profile failed: ${JSON.stringify(r.body)}`);
  }
  return { id: user.id, email: mail, token, auth, user };
}

export async function createEvent(organizer, overrides = {}, { publish = true } = {}) {
  const res = await api().post('/api/v1/events').set(organizer.auth).send({
    title: 'Tech Conference', description: 'A great technology conference', category: 'conference',
    startDate: days(1), endDate: days(2), capacity: 50, ...overrides,
  });
  if (res.status !== 201) throw new Error(`event failed: ${JSON.stringify(res.body)}`);
  const id = res.body.data.id;
  if (publish) await api().patch(`/api/v1/events/${id}/publish`).set(organizer.auth).expect(200);
  return id;
}

export function registerFor(user, eventId) {
  return api().post(`/api/v1/events/${eventId}/register`).set(user.auth);
}
export async function connect(a, b) {
  const r = await api().post(`/api/v1/connections/request/${b.id}`).set(a.auth).expect(201);
  await api().patch(`/api/v1/connections/${r.body.data.id}/accept`).set(b.auth).expect(200);
  return r.body.data.id;
}
