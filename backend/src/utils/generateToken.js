import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** JWT carries only: subject (user id), token-version, iat, exp. No role, no PII. */
export function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), tv: user.tokenVersion ?? 0 }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
}

export function durationToMs(value) {
  const m = /^(\d+)\s*(s|m|h|d)?$/.exec(String(value).trim());
  if (!m) return 15 * 60 * 1000;
  const n = Number(m[1]);
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2] || 's'];
  return n * mult;
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd || env.COOKIE_SAMESITE === 'none',
    sameSite: env.COOKIE_SAMESITE,
    maxAge: durationToMs(env.JWT_EXPIRES_IN),
    path: '/',
  };
}
