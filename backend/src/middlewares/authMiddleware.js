import { resolveUser } from '../services/authService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

export function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  return req.cookies?.[env.COOKIE_NAME] || null;
}

/** Requires a valid, non-revoked token for an active account. Attaches req.user (Mongoose doc) and req.tokenPayload. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized();
  const { user, payload } = await resolveUser(token);
  req.user = user;
  req.tokenPayload = payload;
  next();
});

/** Attaches req.user when a valid token is supplied; anonymous requests continue. Invalid tokens are rejected. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  const { user, payload } = await resolveUser(token);
  req.user = user;
  req.tokenPayload = payload;
  return next();
});
