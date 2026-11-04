# Requirement traceability report

## Verification status - read this first
This backend was written in an environment **without network access and without MongoDB**, so `npm install` and `npm test` could **not** be executed there.
What *was* executed/verified in that environment:
- `node --check` syntax validation of all 113 `.js` files - pass.
- A static import/export resolution scan across `src/`, `tests/`, `scripts/` (every relative import resolves, every named import exists; the checker was proven to detect a deliberately injected error) - pass.
- Direct execution of the dependency-free logic: Jaccard, weighted score (spec example → skill 50, interest 33.33, **score 43.33**), normalisation, pagination, attendance % - correct.
- A script cross-check that the 71 registered routes exactly equal the 71 documented endpoints (`src/config/apiCatalog.js`) - pass. All endpoints of the specification (chapter 8) are present.

Everything else is **"Implemented but not externally verified"**: the Jest suites are written but have **never been run**. Expect that a first `npm install && npm test` may surface small defects (typos, assertion details, dependency-version behaviour); fix them before relying on the result.
"Test coverage" below names the written test file; it does not mean the test passed.

Legend: **IV** = implemented and verified (executed) · **INV** = implemented, not externally verified · **NI** = not implemented.

| Requirement | Implementation files | API / Socket events | Test (written, not run) | Status |
|---|---|---|---|---|
| A. Registration, login, logout, JWT, bcrypt hashing | `authService`, `authController`, `authRoutes`, `authMiddleware`, `generateToken`, `User` | `POST /auth/register, login, logout`, `GET /auth/me` | `auth.test.js` | INV |
| A. Token lifecycle (15 m expiry, revocation via tokenVersion) | `authService.resolveUser`, `User.tokenVersion` | all protected routes, socket handshake | `auth.test.js`, `socket.test.js` | INV |
| A. Roles & RBAC (admin/organizer/participant) | `roleMiddleware`, `roles.js` | all routes | `auth.test.js`, `event.test.js`, `analytics.test.js` | INV |
| A. Profile, skills & interests (normalised) | `userService`, `normalize.js`, `userValidator` | `GET/PATCH /users/me`, `GET /users/:id` | `auth.test.js` | INV |
| A. Password change & reset | `authService`, `emailService` | `PATCH /auth/change-password`, `POST /auth/forgot-password, reset-password` | `auth.test.js` | INV (SMTP delivery not externally verified) |
| A. Account status; admin user mgmt | `userService` | `GET /users`, `PATCH /users/:id/status`, `/role` | `auth.test.js` | INV |
| A. Avatar upload (Multer + Cloudinary) | `uploadMiddleware`, `uploadService` | `POST /users/me/avatar` | none (needs Cloudinary) | INV |
| B. Event CRUD, publish/cancel/complete, search, filter, sort, pagination, ownership | `eventService`, `eventController`, `eventRoutes`, `accessService`, `eventValidator` | `/events*` | `event.test.js` | INV |
| C. Sessions (CRUD, schedule within event, speaker assignment) | `sessionService`, `sessionController`, `sessionRoutes` | `/events/:id/sessions`, `/sessions/:id` | `event.test.js` | INV |
| D. Speakers (CRUD, event/organizer validation) | `sessionService`, `speakerController`, `speakerRoutes` | `/events/:id/speakers`, `/speakers/:id` | `event.test.js` | INV |
| E. Registration: duplicates, capacity (atomic), deadline, cancel, lists | `registrationService`, `registrationRoutes` | `/events/:id/register`, `/registrations/me`, `/events/:id/registrations` | `registration.test.js` (incl. concurrency) | INV |
| E/L. Attendance (trusted check-in/out, manual mark, report, no duplicates) | `attendanceService`, `attendanceRoutes`, `Attendance` | `/events/:id/attendance*` | `registration.test.js` | INV |
| F. Matchmaker: Jaccard, 0.6/0.4, top 5, exclusions, event-specific | `matchService`, `similarity.js`, `matchRoutes` | `GET /networking/recommendations[/:id]` | `match.test.js` | Maths **IV** (executed: 43.33 example); API INV |
| G. Connections: request/accept/reject/cancel/remove/lists/block, state machine | `connectionService`, `connectionRoutes`, `Connection` | `/connections*` | `connection.test.js` | INV |
| H. Speed networking: queue, pairing, unique Jitsi room, server 2-min timer, completion, disconnects, stale entries, no duplicate sessions, concurrency, broadcasts | `networkingService`, `jitsiService`, `networkingSocket`, `NetworkingSession` | `/networking/queue/*`, `/networking/sessions*`; `networking:*` events | `socket.test.js` | INV (Jitsi server integration not externally verified) |
| I. Live Q&A: submit, list, one-vote, unvote, sort, moderate, persist, broadcast | `questionService`, `questionSocket`, `questionRoutes`, `Question` | `/events/:id/questions`, `/questions/:id/*`; `question:*` | `question.test.js`, `socket.test.js` | INV |
| J. Private chat: send, history, pagination, real-time, connection check, persistence | `messageService`, `chatSocket`, `messageRoutes`, `Message` | `/messages*`; `message:*` | `message.test.js`, `socket.test.js` | INV |
| K. Notifications: create, list, read, read-all, real-time | `notificationService`, `notificationSocket`, `notificationRoutes` | `/notifications*`; `notification:*` | `message.test.js`, `socket.test.js` | INV |
| M. Analytics (aggregation pipelines; event + platform; access control) | `analyticsService`, `analyticsRoutes` | `/analytics/events/:id`, `/analytics/platform` | `analytics.test.js` | INV |
| Security: Helmet, CORS, rate limits, Joi validation, NoSQL-operator sanitiser, upload checks, central errors, no secret leakage | `app.js`, `middlewares/*`, `errorMiddleware` | all | `auth.test.js` (injection), all | INV |
| Swagger/OpenAPI | `config/swagger.js`, `apiCatalog.js` | `/api-docs`, `/api-docs.json` | route/catalog cross-check script (executed) | Catalog **IV**; UI INV |
| Docs: README, .env.example, API, DB, sockets, Jitsi, deployment, seed | `README.md`, `docs/*`, `.env.example`, `scripts/seed.js` | - | seed not executed | INV |
| `package-lock.json` | - | - | - | **NI** (needs network; `npm install` generates it) |
| Tests executed and passing | `tests/*` | - | - | **NI** - written, never executed |
| Deployment to a live host (spec acceptance #16) | `docs/DEPLOYMENT.md` | - | - | **NI** (instructions only) |

## Deviations / additions beyond the specification
Speaker has an `event` field; extra endpoints (password reset, role change, uploads, event complete, attendance, block/unblock, connection removal, session room/end, notification read-all); admin accounts via seed/role change only; 422 for validation errors; `tokenVersion` revocation instead of refresh tokens.
