import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const windowMs = env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
const handler = (_req, res) =>
  res.status(429).json({ success: false, message: 'Too many requests, please try again later' });

const base = { windowMs, standardHeaders: true, legacyHeaders: false, handler, skip: () => env.isTest };

export const apiLimiter = rateLimit({ ...base, max: env.RATE_LIMIT_MAX });
/** Stricter limiter for credential endpoints (brute-force protection). */
export const authLimiter = rateLimit({ ...base, max: env.AUTH_RATE_LIMIT_MAX });
/** Limiter for write-heavy actions such as messages and questions. */
export const writeLimiter = rateLimit({ ...base, windowMs: 60 * 1000, max: 60 });
