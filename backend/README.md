# EventSphere Backend

Virtual event management and professional networking platform - modular-monolith REST + Socket.IO backend.
Node.js (ES modules) · Express · MongoDB/Mongoose · JWT · Socket.IO · Jitsi Meet · Joi · Winston · Jest/Supertest · Swagger.

## Features
Auth & roles (admin/organizer/participant) · profiles with skills/interests · events, sessions, speakers · registration with atomic capacity control ·
attendance · **Smart Networking Matchmaker** (Jaccard, 0.60 skills + 0.40 interests, top 5) · connections (state machine, block) ·
**Virtual speed networking** (server-timed 2-minute Jitsi sessions) · live Q&A (one vote per user) · private chat · notifications · analytics (aggregation pipelines).

## Prerequisites
- Node.js >= 18.18 (developed on 22) and npm
- MongoDB 5.0+ (local `mongod` or Atlas). Tests need a *separate* database.

## Install & run
```bash
cd backend
npm install                 # also generates package-lock.json (commit it)
cp .env.example .env        # then edit: MONGODB_URI, JWT_SECRET (>=32 random chars), CLIENT_URL
npm run dev                 # nodemon        |  npm start  # production
npm run seed                # optional demo data (dev only)
```
- Health: `GET http://localhost:5000/health`
- REST base: `http://localhost:5000/api/v1`
- Swagger UI: `http://localhost:5000/api-docs` (disabled by default in production; `ENABLE_SWAGGER=true` to enable)

## Tests
```bash
# MongoDB must be running. Uses MONGODB_URI_TEST (default mongodb://127.0.0.1:27017/eventsphere_test)
npm test
```
The suite refuses to run unless the database name contains `test`, drops that database, and runs serially (`--runInBand`). `npm test` sets
`NETWORKING_DURATION_SECONDS=2` and `ENFORCE_EVENT_TIME_WINDOW=false` so speed-networking/attendance can be exercised without waiting.
Suites: `auth`, `event`, `registration` (+attendance), `connection`, `match`, `question`, `message` (+notifications), `analytics`, `socket` (auth, chat, Q&A, speed networking).

## Documentation
| File | Content |
|---|---|
| `docs/API.md` | Every endpoint: method, auth, roles, request, response, errors (generated: `npm run docs:api`) |
| `docs/DATABASE.md` | Collections, fields, relationships, indexes |
| `docs/SOCKETS.md` | Socket.IO events, payloads, acks, room authorisation |
| `docs/JITSI.md` | Jitsi integration and configuration |
| `docs/DEPLOYMENT.md` | Production checklist and scaling notes |
| `docs/TRACEABILITY.md` | Requirement-to-code-to-test report and honest verification status |
| `.env.example` | All environment variables explained |

## Seed data
`npm run seed` wipes the users/events/sessions/speakers/registrations/connections/questions collections of the **configured** database and creates:
`admin@eventsphere.test`, `organizer@eventsphere.test`, and participants `priya|rahul|meera|arjun|sara|vikram@eventsphere.test`
(password = `SEED_ADMIN_PASSWORD`, default `ChangeMe123!`), one live published event with sessions, a speaker, registrations, a connection, a pending request and two questions. Refuses to run when `NODE_ENV=production`.

## Project layout
Follows the agreed structure: `src/{config,models,controllers,routes,services,middlewares,sockets,validators,utils,constants}`, `src/app.js`, `src/server.js`, `tests/`.
Additions: `attendance*`, `notification*` modules, `scripts/`, `docs/`, extra validators.

## Key design decisions (where the specification was silent)
- **Tokens:** 15-minute HS256 JWT carrying only `sub` + `tv` (token version). Logout, password change/reset, deactivation and role change bump `tokenVersion`, instantly revoking all outstanding tokens (incl. sockets at next connect). No refresh tokens (allowed by spec). Token is returned in the body and set as an httpOnly cookie; `Authorization: Bearer` takes precedence.
- **Admin accounts** cannot self-register; create via `seed` or by an admin changing a role.
- **Speaker** gets an `event` reference (spec model had none, but speakers are managed per event).
- **Event delete** is allowed only with no registrations (otherwise cancel). Cancel notifies registrants.
- **Connection** uses one document per user pair (`pairKey`) so duplicates are impossible at DB level; removal marks it `cancelled`.
- **Speed networking:** in-memory queue behind a global async mutex (single instance, per spec), DB partial unique index as backstop, in-memory timers rebuilt on boot via `recoverSessions()`. Only a full timer expiry is `completed`; early end/disconnect is `cancelled`.
- **Validation errors** return 422; malformed JSON / bad ids return 400.
- Email/Cloudinary/Jitsi-JWT are real integrations that need your credentials - no fake success is returned when unconfigured (see `.env.example`).
