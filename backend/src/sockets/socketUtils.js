import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

const buckets = new WeakMap();

/** Sliding-window rate limit per socket + event name. */
function allow(socket, key, max, windowMs) {
  const now = Date.now();
  const map = buckets.get(socket) || new Map();
  buckets.set(socket, map);
  const hits = (map.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) { map.set(key, hits); return false; }
  hits.push(now);
  map.set(key, hits);
  return true;
}

/**
 * Registers a validated, rate-limited, auth-expiry-checked socket event.
 * Acknowledgement contract: { ok: true, data } | { ok: false, code, message, errors? }.
 * `errorEvent` additionally emits an error event (e.g. "message:error") to the caller.
 */
export function onEvent(socket, event, { schema, max = 30, windowMs = 10000, errorEvent } = {}, handler) {
  socket.on(event, async (payload, ack) => {
    if (typeof payload === 'function') { ack = payload; payload = {}; }
    const reply = typeof ack === 'function' ? ack : () => {};
    const fail = (code, message, errors) => {
      if (errorEvent) socket.emit(errorEvent, { code, message, errors });
      reply({ ok: false, code, message, errors });
    };
    try {
      if (Date.now() >= socket.data.expiresAt) { fail('TOKEN_EXPIRED', 'Token expired'); socket.disconnect(true); return; }
      if (!allow(socket, event, max, windowMs)) return fail('RATE_LIMITED', 'Too many events, slow down');
      let data = payload ?? {};
      if (schema) {
        const { value, error } = schema.validate(data, { abortEarly: false, stripUnknown: true, convert: true });
        if (error) return fail(422, 'Validation failed', error.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/"/g, '') })));
        data = value;
      }
      const result = await handler(data);
      return reply({ ok: true, data: result ?? null });
    } catch (err) {
      if (err instanceof ApiError) return fail(err.statusCode, err.message, err.errors);
      logger.error(`socket ${event} failed: ${err.message}`, { stack: err.stack });
      return fail(500, 'Internal error');
    }
  });
}
