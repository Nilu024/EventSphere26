# Jitsi Meet integration

EventSphere does not host video. On each match the backend (`jitsiService.js`) creates a room id `eventsphere-<32 hex chars>` (128 bits from `crypto.randomBytes`), stores it on the `NetworkingSession`, and sends `{ domain, roomName, url, jwt, authenticated }` **only to the two paired users** (socket `networking:matched`, `GET /networking/sessions/active`, `GET /networking/sessions/:id`; each returns 404 for non-participants and 409 once the session has ended).

## Modes
| Mode | Config | Security |
|---|---|---|
| Public Jitsi (default) | `JITSI_DOMAIN=meet.jit.si` | Room name is the only secret. **Not** real access control - anyone who learns the name can join. Suitable for demos only. |
| Self-hosted with token auth (HS256) | `JITSI_DOMAIN`, `JITSI_APP_ID`, `JITSI_APP_SECRET` | Per-user JWT bound to the room (`room`, `exp` = session end + 60 s). Configure Prosody `authentication = "token"` with the same `app_id`/`app_secret`. |
| 8x8 JaaS (RS256) | `JITSI_DOMAIN=8x8.vc`, `JITSI_APP_ID` (`vpaas-magic-cookie-…`), `JITSI_KEY_ID`, `JITSI_PRIVATE_KEY` (PEM, `\n` escaped) | RS256 JWT with `kid=<appId>/<keyId>`; room path is prefixed with the app id. |
JWT claims: `aud=jitsi`, `iss` (app id, or `chat` for JaaS), `sub`, `room`, `nbf`, `exp`, `context.user {id,name,moderator:false}`.

## Lifecycle
match → session `waiting` (+`NETWORKING_START_DELAY_SECONDS`) → `active` (server timer) → `completed` after `NETWORKING_DURATION_SECONDS` (120) or `cancelled` (early end/disconnect). Room access is closed server-side by ending the session and issuing JWTs that expire with it; with JWT mode the Jitsi server enforces expiry.

## Frontend
Use the returned `room.domain` + `room.roomName` with the Jitsi IFrame API (`new JitsiMeetExternalAPI(domain, { roomName, jwt, parentNode })`), or open `room.url`.
Hang up the call when `networking:session:end` arrives.

## Not verified
Jitsi JWT signing is implemented per Jitsi/JaaS documentation but could not be tested against a live Jitsi server in the build environment.
