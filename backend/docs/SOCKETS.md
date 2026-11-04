# Socket.IO reference

Endpoint: same origin/port as the API (`io(BASE_URL, { auth: { token } })`).
Authentication: JWT from `auth.token`, `Authorization: Bearer` header, or the auth cookie. Invalid/expired/revoked token or inactive account → `connect_error` (`AUTH_REQUIRED`, `Invalid token`, `Token expired`, `Token has been revoked`, `Account is deactivated`).
User identity always comes from the verified token; ids in payloads are never trusted. Tokens that expire mid-connection are rejected on the next event (`TOKEN_EXPIRED`, socket disconnected).

## Acknowledgements
Every client→server event accepts an ack callback: `{ ok: true, data }` or `{ ok: false, code, message, errors? }` (`code` = HTTP-like status, `RATE_LIMITED`, `TOKEN_EXPIRED`).
Payloads are Joi-validated (unknown fields stripped). Per-socket rate limits apply (e.g. 20 `message:send` / 10 s).

## Rooms (joined server-side only)
| Room | Who | How |
|---|---|---|
| `user:<userId>` | that user's sockets | automatically on connect |
| `event:<eventId>` | registered participants, owning organizer, admin | `question:join` (authorised) |
| `networking:<sessionId>` | the two paired participants | server on match; `networking:session:join` re-authorises after reconnect |

## Server → client (on connect)
`connected` `{ userId, serverTime }`

## Chat
| Event | Dir | Payload | Notes |
|---|---|---|---|
| `message:send` | C→S | `{ receiverId, content(1-2000) }` | requires accepted connection; ack `data` = message |
| `message:receive` | S→C (receiver `user:` room) | message `{id, sender, receiver, connection, content, messageType, createdAt}` | |
| `message:sent` | S→C (sender's devices) | same message | multi-device sync |
| `message:error` | S→C (caller) | `{ code, message, errors? }` | e.g. 403 `You can only message users with an accepted connection` |

## Notifications
| Event | Dir | Payload |
|---|---|---|
| `notification:new` | S→C | `{ id, recipient, type, title, message, relatedEntityId, isRead, createdAt }` |
| `notification:read` | C→S | `{ notificationId }` (ack: notification). Other devices receive `notification:read {notificationId}` |
| `notification:read-all` | C→S | `{}` → ack `{ modified }` |
Types: `connection_request, connection_accepted, event_registration, registration_cancelled, event_update, event_cancelled, networking_match, new_message, question_moderated, system`.

## Live Q&A
| Event | Dir | Payload |
|---|---|---|
| `question:join` / `question:leave` | C→S | `{ eventId }` |
| `question:new` | C→S | `{ eventId, questionText(5-500), sessionId? }` → ack = question |
| `question:new` | S→room | `{ id, event, session, askedBy{id,name,profileImage}, questionText, voteCount, hasUpvoted:false, isApproved, isPinned, isHidden, createdAt }` |
| `question:upvote` | C→S | `{ questionId, remove?: boolean }` (409 if already voted / not voted) |
| `question:updated` | S→room | `{ questionId, eventId, voteCount }` |
| `question:moderated` | S→room | `{ questionId, eventId, action, isApproved, isHidden, isPinned }` (clients drop hidden/rejected questions) |
Moderation is performed over REST (`PATCH /questions/:id/moderate`) by the owning organizer/admin and broadcast here.

## Speed networking
| Event | Dir | Payload |
|---|---|---|
| `networking:queue:join` | C→S | `{ eventId }` → ack `data`: `{status:'queued', queueSize}` or `{status:'matched', session}` |
| `networking:queue:leave` | C→S | `{}` → `{ removed }` |
| `networking:matched` | S→C (both users) | `{ sessionId, eventId, status:'waiting', partner{id,name,...}, room{domain, roomName, url, jwt, authenticated}, scheduledStart, actualStart:null, endsAt, duration, serverTime }` |
| `networking:session:start` | S→room | `{ sessionId, actualStart, endsAt, duration, serverTime }` |
| `networking:session:timer` | S→room (every 10 s) | `{ sessionId, remainingSeconds, serverTime }` |
| `networking:session:end` | S→room | `{ sessionId, status: completed\|cancelled, reason: time_elapsed\|ended_early\|participant_disconnected\|server_recovery, actualEnd, serverTime }` |
| `networking:session:join` | C→S | `{ sessionId }` re-join the room after reconnect (pair only) → ack = session info |
| `networking:session:end` | C→S | `{ sessionId }` end early (recorded `cancelled/ended_early`) |
| `networking:queue:expired` | S→C | `{ eventId }` stale queue entry purged (> `NETWORKING_QUEUE_TTL_SECONDS`) |
Clients must render countdowns from `endsAt` / `remainingSeconds` (server authoritative; do not use local timers to end sessions).
Joining requires: participant role, active registration, published event (and live window when `ENFORCE_EVENT_TIME_WINDOW=true`), and an open socket connection.
Disconnects: after `NETWORKING_DISCONNECT_GRACE_SECONDS` without any socket the user is removed from the queue and any open session is cancelled.
