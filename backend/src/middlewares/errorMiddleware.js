import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { MESSAGES } from '../constants/messages.js';

export const notFoundHandler = (req, _res, next) =>
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));

function normalise(err) {
  if (err instanceof ApiError) return err;
  if (err?.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new ApiError(422, MESSAGES.VALIDATION_FAILED, errors);
  }
  if (err?.name === 'CastError') return new ApiError(400, `Invalid value for ${err.path}`);
  if (err?.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    return new ApiError(409, `Duplicate value${fields.length ? ` for: ${fields.join(', ')}` : ''}`);
  }
  if (err?.name === 'TokenExpiredError') return new ApiError(401, 'Token expired');
  if (err?.name === 'JsonWebTokenError' || err?.name === 'NotBeforeError') return new ApiError(401, 'Invalid token');
  if (err?.type === 'entity.parse.failed') return new ApiError(400, 'Malformed JSON body');
  if (err?.type === 'entity.too.large') return new ApiError(413, 'Request body too large');
  if (err?.name === 'MulterError') {
    return new ApiError(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400, err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 2 MB)' : `Upload error: ${err.message}`);
  }
  if (err?.message === 'Not allowed by CORS') return new ApiError(403, 'Origin not allowed');
  return null;
}

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  const known = normalise(err);
  if (known) {
    if (known.statusCode >= 500) logger.error(known.message, { stack: known.stack, path: req.originalUrl });
  } else {
    logger.error(err?.message || 'Unhandled error', { stack: err?.stack, path: req.originalUrl, method: req.method });
  }
  const status = known?.statusCode || 500;
  const body = {
    success: false,
    message: known ? known.message : env.isProd ? MESSAGES.INTERNAL : err?.message || MESSAGES.INTERNAL,
  };
  if (known?.errors) body.errors = known.errors;
  if (!env.isProd && !known && err?.stack) body.stack = err.stack;
  res.status(status).json(body);
};
