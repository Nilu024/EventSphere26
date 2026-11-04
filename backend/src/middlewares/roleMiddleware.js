import { ApiError } from '../utils/ApiError.js';

/** Role gate. NOTE: a role check is never sufficient for event-scoped actions; services also verify ownership. */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};
