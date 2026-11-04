# Deployment

## Requirements
Node >= 18.18 · MongoDB Atlas (or managed MongoDB 5.0+) · HTTPS terminator (Nginx/Caddy/PaaS) with **WebSocket** support · optional Cloudinary, SMTP, Jitsi JWT credentials.

## Steps
1. `npm ci --omit=dev` (commit the generated `package-lock.json` first).
2. Set environment variables on the host (never commit `.env`): `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (>=32 random chars - the app refuses to start otherwise), `CLIENT_URL` (exact frontend origin(s), comma separated), `TRUST_PROXY=1` behind one proxy, `COOKIE_SAMESITE=none` only if the frontend is on a different site (cookies are then `Secure`).
3. Restrict MongoDB network access to the app; use a least-privilege DB user.
4. Indexes are built automatically on first start (Mongoose autoIndex). To build/update them explicitly before taking traffic run `npm run db:indexes`.
5. `npm start` (use a process manager: systemd, PM2, or the PaaS). `SIGTERM` triggers graceful shutdown.
6. Verify: `GET /health`, a login, Socket.IO connect with a token, and a Jitsi room open (see JITSI.md).

## Checklist
- [ ] `npm test` green against a *test* database
- [ ] `ENABLE_SWAGGER` unset/false (or protected) in production
- [ ] HTTPS only; HSTS comes from Helmet
- [ ] Rate limits tuned (`RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`)
- [ ] Logs shipped (Winston writes `logs/error.log`, `logs/combined.log` in production)
- [ ] Seed script is not run in production (it refuses)

## Scaling limits (documented, by design)
Speed-networking queue, timers and reconnect-grace timers live in process memory (single instance, as specified). For multiple instances: add the Socket.IO Redis adapter, move the queue to a shared store (Redis) and elect a single owner for session timers (or persist timers via a job queue). `recoverSessions()` already restores timers after a restart of the single instance.
