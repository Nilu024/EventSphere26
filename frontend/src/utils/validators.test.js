import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, eventSchema, questionSchema, changePasswordSchema } from './validators';

const ok = (s, v) => s.safeParse(v).success;
describe('validators', () => {
  it('validates login', () => { expect(ok(loginSchema, { email: 'a@b.co', password: 'x' })).toBe(true); expect(ok(loginSchema, { email: 'nope', password: 'x' })).toBe(false); });
  const base = { name: 'Ada Lovelace', email: 'a@b.co', password: 'Passw0rdX', confirmPassword: 'Passw0rdX', role: 'participant' };
  it('registration accepts participant/organizer only – never admin', () => {
    expect(ok(registerSchema, base)).toBe(true);
    expect(ok(registerSchema, { ...base, role: 'organizer' })).toBe(true);
    expect(ok(registerSchema, { ...base, role: 'admin' })).toBe(false);
  });
  it('registration enforces password rules and confirmation', () => {
    expect(ok(registerSchema, { ...base, password: 'short1', confirmPassword: 'short1' })).toBe(false);
    expect(ok(registerSchema, { ...base, confirmPassword: 'different1' })).toBe(false);
  });
  it('event end must be after start', () => {
    const e = { title: 'Conf', description: 'A long enough description', startDate: '2026-05-01T10:00', endDate: '2026-05-01T09:00', capacity: '' };
    expect(ok(eventSchema, e)).toBe(false);
    expect(ok(eventSchema, { ...e, endDate: '2026-05-01T12:00' })).toBe(true);
    expect(ok(eventSchema, { ...e, endDate: '2026-05-01T12:00', capacity: '-3' })).toBe(false);
  });
  it('questions are length-limited', () => { expect(ok(questionSchema, { content: 'hey' })).toBe(false); expect(ok(questionSchema, { content: 'x'.repeat(501) })).toBe(false); expect(ok(questionSchema, { content: 'A real question?' })).toBe(true); });
  it('change password confirms', () => { expect(ok(changePasswordSchema, { currentPassword: 'a', newPassword: 'Newpass123', confirmPassword: 'Newpass123' })).toBe(true); });
});
