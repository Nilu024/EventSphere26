# EventSphere REST API (v1)

Base URL: `/api/v1`. Interactive docs: `/api-docs` (Swagger UI) and `/api-docs.json`.
Generated from `src/config/apiCatalog.js` - run `npm run docs:api` after changing routes.

## Conventions
- Auth: `Authorization: Bearer <JWT>` (or the httpOnly cookie set at login). "optional" = works anonymously, richer when authenticated.
- Success: `{ "success": true, "message": "...", "data": ..., "meta"?: {pagination...} }`
- Error: `{ "success": false, "message": "...", "errors"?: [{ "field", "message" }] }`
- Status codes: 200 OK, 201 created, 400 bad request, 401 unauthenticated/expired/revoked token, 403 forbidden (role or ownership), 404 not found, 409 conflict (duplicates, invalid state), 413 file too large, 422 validation failed, 429 rate limited, 503 external service not configured.
- Paginated lists accept `page` (default 1) and `limit` (default 20, max 100) and return `meta: { total, page, limit, totalPages, hasNext, hasPrev }`.
- Authorization is two-layered: role middleware, then server-side resource-ownership checks (e.g. an organizer can only manage their own events).
- Additional endpoints beyond the specification table (required by the master prompt): password reset, role change, avatar/banner/speaker-image upload, event complete, attendance, block/unblock, remove connection, networking session room/end, notification read-all.

## Auth

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| POST | `/auth/register` — Register a new user (participant or organizer) | public | public | **Body**<br>`name`: string*<br>`email`: string*<br>`password`: string* (8-72, upper+lower+digit)<br>`role`: participant|organizer<br>`designation`: string<br>`company`: string | 201 data.user | 409 email exists, 422 validation, 429 |
| POST | `/auth/login` — Log in; returns JWT (also set as httpOnly cookie) | public | public | **Body**<br>`email`: string*<br>`password`: string* | 200 data.{user, token, expiresIn} | 401 invalid credentials, 403 deactivated, 422, 429 |
| POST | `/auth/logout` — Logout - revokes all tokens of the user | required | any authenticated | - | 200 { success, message, data } | 401 |
| GET | `/auth/me` — Current user | required | any authenticated | - | 200 data.user | 401 |
| PATCH | `/auth/change-password` — Change password (revokes old tokens, returns a new one) | required | any authenticated | **Body**<br>`currentPassword`: string*<br>`newPassword`: string* | 200 { success, message, data } | 401 wrong current password, 422 |
| POST | `/auth/forgot-password` — Request password-reset email (always 200) | public | public | **Body**<br>`email`: string* | 200 { success, message, data } | 422, 429 |
| POST | `/auth/reset-password` — Reset password with emailed token | public | public | **Body**<br>`token`: string(64 hex)*<br>`newPassword`: string* | 200 { success, message, data } | 400 invalid/expired token, 422 |

## Users

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| GET | `/users/me` — Own profile | required | any authenticated | - | 200 { success, message, data } | 401 |
| PATCH | `/users/me` — Update own profile incl. skills & interests (normalised, de-duplicated) | required | any authenticated | **Body**<br>`name`: string<br>`bio`: string<br>`designation`: string<br>`company`: string<br>`experience`: string<br>`skills`: string[] (max 30)<br>`interests`: string[] (max 30)<br>`socialLinks`: {linkedin,github,twitter,website} | 200 { success, message, data } | 422 |
| POST | `/users/me/avatar` — Upload profile image (multipart field "image", JPEG/PNG/WebP, 2 MB; needs Cloudinary) | required | any authenticated | - | 200 { success, message, data } | 400 bad file, 413, 503 not configured |
| GET | `/users` — List users | required | admin | **Query**<br>`page`: int<br>`limit`: int (max 100)<br>`role`: string<br>`isActive`: bool<br>`search`: string | 200 { success, message, data } | 403 |
| GET | `/users/:id` — Public profile (no email). Inactive/blocked users return 404 | required | any authenticated | - | 200 { success, message, data } | 404 |
| PATCH | `/users/:id/status` — Activate/deactivate account (deactivation revokes tokens) | required | admin | **Body**<br>`isActive`: bool* | 200 { success, message, data } | 400 self, 403, 404 |
| PATCH | `/users/:id/role` — Change role | required | admin | **Body**<br>`role`: admin|organizer|participant* | 200 { success, message, data } | 400 self, 403, 404 |

## Events

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| GET | `/events` — Browse/search events (published only unless admin or mine=true) | optional | public | **Query**<br>`page`: int<br>`limit`: int (max 100)<br>`search`: string<br>`category`: string<br>`status`: string (admin/mine)<br>`organizer`: id<br>`mine`: bool<br>`upcoming`: bool<br>`from`: date<br>`to`: date<br>`sortBy`: startDate|createdAt|title|registeredCount<br>`order`: asc|desc | 200 data[] + meta pagination | 401 (mine), 403 |
| POST | `/events` — Create event (draft) | required | organizer, admin | **Body**<br>`title`: string*<br>`description`: string*<br>`category`: string*<br>`startDate`: ISO date* (future)<br>`endDate`: ISO date*<br>`timezone`: IANA tz<br>`meetingLink`: url<br>`capacity`: int<br>`registrationDeadline`: ISO date | 201 { success, message, data } | 403, 422 |
| GET | `/events/:id` — Event details (drafts visible to owner/admin only) | optional | public | - | 200 { success, message, data } | 404 |
| PATCH | `/events/:id` — Update event | required | organizer (owner), admin | **Body**<br>`title`: string<br>`description`: string<br>`category`: string<br>`startDate`: date<br>`endDate`: date<br>`timezone`: string<br>`meetingLink`: url<br>`capacity`: int<br>`registrationDeadline`: date|null | 200 { success, message, data } | 403 not owner, 404, 409 cancelled/completed or capacity<registrations, 422 |
| DELETE | `/events/:id` — Delete event (only when it has no registrations; cascades sessions/speakers/questions) | required | organizer (owner), admin | - | 200 { success, message, data } | 403, 404, 409 |
| PATCH | `/events/:id/publish` — Publish a draft event | required | organizer (owner), admin | - | 200 { success, message, data } | 403, 404, 409 |
| PATCH | `/events/:id/cancel` — Cancel event (notifies registrants) | required | organizer (owner), admin | - | 200 { success, message, data } | 403, 404, 409 |
| PATCH | `/events/:id/complete` — Mark a published event completed | required | organizer (owner), admin | - | 200 { success, message, data } | 403, 404, 409 |
| POST | `/events/:id/banner` — Upload banner (multipart "image"; needs Cloudinary) | required | organizer (owner), admin | - | 200 { success, message, data } | 400, 403, 413, 503 |

## Sessions

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| GET | `/events/:eventId/sessions` — List event sessions | optional | public | - | 200 { success, message, data } | 404 |
| POST | `/events/:eventId/sessions` — Create session | required | organizer (owner), admin | **Body**<br>`title`: string*<br>`description`: string<br>`speaker`: speakerId|null<br>`startTime`: date*<br>`endTime`: date*<br>`meetingLink`: url<br>`status`: scheduled|live|completed|cancelled | 201 { success, message, data } | 403, 404, 409, 422 (outside event window / foreign speaker) |
| PATCH | `/sessions/:id` — Update session | required | organizer (owner), admin | **Body**<br>`title`: string<br>`startTime`: date<br>`endTime`: date<br>`speaker`: id|null<br>`status`: string | 200 { success, message, data } | 403, 404, 422 |
| DELETE | `/sessions/:id` — Delete session | required | organizer (owner), admin | - | 200 { success, message, data } | 403, 404 |

## Speakers

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| GET | `/events/:eventId/speakers` — List event speakers | optional | public | - | 200 { success, message, data } | 404 |
| POST | `/events/:eventId/speakers` — Add speaker | required | organizer (owner), admin | **Body**<br>`name`: string*<br>`designation`: string<br>`organization`: string<br>`biography`: string<br>`expertise`: string[]<br>`socialLinks`: object<br>`user`: userId | 201 { success, message, data } | 403, 404, 422 |
| PATCH | `/speakers/:id` — Update speaker | required | organizer (owner), admin | - | 200 { success, message, data } | 403, 404, 422 |
| DELETE | `/speakers/:id` — Remove speaker (unassigns from sessions) | required | organizer (owner), admin | - | 200 { success, message, data } | 403, 404 |
| POST | `/speakers/:id/image` — Upload speaker image (multipart "image") | required | organizer (owner), admin | - | 200 { success, message, data } | 400, 403, 503 |

## Registrations

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| POST | `/events/:eventId/register` — Register for event (atomic capacity check) | required | participant | - | 201 { success, message, data } | 403, 404, 409 duplicate/full/deadline/not published |
| DELETE | `/events/:eventId/register` — Cancel own registration | required | participant | - | 200 { success, message, data } | 404, 409 |
| GET | `/registrations/me` — Own registrations | required | participant | **Query**<br>`page`: int<br>`limit`: int (max 100)<br>`status`: string | 200 { success, message, data } | 401 |
| GET | `/events/:eventId/registrations` — Participants registered for an event | required | organizer (owner), admin | **Query**<br>`page`: int<br>`limit`: int (max 100)<br>`status`: string | 200 { success, message, data } | 403, 404 |

## Attendance

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| POST | `/events/:eventId/attendance/check-in` — Participant check-in (server time & eligibility) | required | participant | - | 201 { success, message, data } | 403 not registered, 409 duplicate/not open/ended |
| POST | `/events/:eventId/attendance/check-out` — Participant check-out | required | participant | - | 200 { success, message, data } | 409 |
| GET | `/events/:eventId/attendance/me` — Own attendance record (data null if none) | required | participant | - | 200 { success, message, data } | 401 |
| POST | `/events/:eventId/attendance/mark` — Organizer records attendance for a registered participant | required | organizer (owner), admin | **Body**<br>`participantId`: id* | 201 { success, message, data } | 403, 404, 409 duplicate |
| GET | `/events/:eventId/attendance` — Attendance report + summary (meta.summary) | required | organizer (owner), admin | **Query**<br>`page`: int<br>`limit`: int (max 100)<br>`status`: present|checked_out | 200 { success, message, data } | 403, 404 |

## Matchmaker

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| GET | `/networking/recommendations` — Top-5 recommended participants: 0.60*skillJaccard + 0.40*interestJaccard | required | participant | **Query**<br>`eventId`: id (restrict to event attendees) | 200 data[] {user, score, skillSimilarity, interestSimilarity, sharedSkills, sharedInterests} | 403, 404 |
| GET | `/networking/recommendations/:id` — Score breakdown + relationship with one eligible user | required | participant | **Query**<br>`eventId`: id | 200 { success, message, data } | 400 self, 404 ineligible/blocked |

## Connections

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| POST | `/connections/request/:userId` — Send connection request | required | participant | - | 201 { success, message, data } | 400 self, 403 blocked, 404, 409 duplicate/already connected |
| PATCH | `/connections/:id/accept` — Accept (recipient only) | required | participant | - | 200 { success, message, data } | 403, 404, 409 |
| PATCH | `/connections/:id/reject` — Reject (recipient only) | required | participant | - | 200 { success, message, data } | 403, 404, 409 |
| PATCH | `/connections/:id/cancel` — Cancel own pending request | required | participant | - | 200 { success, message, data } | 403, 404, 409 |
| DELETE | `/connections/:id` — Remove an accepted connection | required | participant | - | 200 { success, message, data } | 404, 409 |
| GET | `/connections` — Accepted connections | required | participant | **Query**<br>`page`: int<br>`limit`: int (max 100) | 200 { success, message, data } | 401 |
| GET | `/connections/requests` — Pending requests | required | participant | **Query**<br>`direction`: incoming|outgoing|all (default all) | 200 data.{incoming[], outgoing[]} | 401 |
| POST | `/connections/block/:userId` — Block a user | required | participant | - | 200 { success, message, data } | 400, 403, 404 |
| DELETE | `/connections/block/:userId` — Unblock a user you blocked | required | participant | - | 200 { success, message, data } | 404 |
| GET | `/connections/blocked` — Users you blocked | required | participant | - | 200 { success, message, data } | 401 |

## Speed Networking

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| POST | `/networking/queue/join` — Join queue; returns queued or matched (with Jitsi room). Requires an open Socket.IO connection | required | participant | **Body**<br>`eventId`: id* | 200 data.{status: queued|matched, session?} | 403 not registered, 409 active session/other queue/not live/no socket |
| POST | `/networking/queue/leave` — Leave queue | required | participant | - | 200 { success, message, data } | 401 |
| GET | `/networking/sessions/active` — Current open session incl. Jitsi room (null if none) | required | participant | - | 200 { success, message, data } | 401 |
| GET | `/networking/sessions/history` — Finished sessions | required | participant | **Query**<br>`page`: int<br>`limit`: int (max 100) | 200 { success, message, data } | 401 |
| GET | `/networking/sessions/:id` — Room info for an open session - paired participants only | required | participant | - | 200 { success, message, data } | 404 not a participant, 409 ended |
| POST | `/networking/sessions/:id/end` — End session early (recorded as cancelled) | required | participant | - | 200 { success, message, data } | 404, 409 |

## Q&A

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| GET | `/events/:eventId/questions` — Questions sorted pinned-first then by votes. Participants never see hidden/rejected | required | registered participant, event organizer, admin | **Query**<br>`page`: int<br>`limit`: int (max 100)<br>`sessionId`: id<br>`includeHidden`: bool (managers) | 200 { success, message, data } | 403, 404 |
| POST | `/events/:eventId/questions` — Submit question (broadcast via socket) | required | registered participant, event organizer, admin | **Body**<br>`questionText`: string 5-500*<br>`sessionId`: id | 201 { success, message, data } | 403, 404, 409, 422 |
| POST | `/questions/:id/upvote` — Upvote (one per user) | required | registered participant, organizer, admin | - | 200 { success, message, data } | 403, 404, 409 already voted |
| DELETE | `/questions/:id/upvote` — Remove own upvote | required | registered participant, organizer, admin | - | 200 { success, message, data } | 404, 409 |
| PATCH | `/questions/:id/moderate` — Moderate | required | organizer (owner), admin | **Body**<br>`action`: approve|reject|hide|unhide|pin|unpin* | 200 { success, message, data } | 403 not owner, 404, 422 |

## Messages

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| GET | `/messages/:userId` — Conversation history, newest first (accepted connections only) | required | participant | **Query**<br>`page`: int<br>`limit`: int (max 100) | 200 { success, message, data } | 403 not connected |
| POST | `/messages` — Send message over HTTP (also delivered via socket) | required | participant | **Body**<br>`receiverId`: id*<br>`content`: string 1-2000* | 201 { success, message, data } | 403 not connected, 422, 429 |

## Notifications

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| GET | `/notifications` — Own notifications (meta.unreadCount) | required | any authenticated | **Query**<br>`page`: int<br>`limit`: int (max 100)<br>`isRead`: bool | 200 { success, message, data } | 401 |
| PATCH | `/notifications/read-all` — Mark all as read | required | any authenticated | - | 200 { success, message, data } | 401 |
| PATCH | `/notifications/:id/read` — Mark one as read | required | any authenticated | - | 200 { success, message, data } | 404 |

## Analytics

| Method | Endpoint | Auth | Roles | Request | Success | Errors |
|---|---|---|---|---|---|---|
| GET | `/analytics/events/:eventId` — Event analytics (registrations, attendance %, questions, upvotes, networking) | required | organizer (owner), admin | - | 200 { success, message, data } | 403 not owner, 404 |
| GET | `/analytics/platform` — Platform-wide analytics | required | admin | - | 200 { success, message, data } | 403 |

