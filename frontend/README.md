# EventSphere – Frontend

React + Vite frontend for **EventSphere**, a virtual event management and professional networking platform (CDAC final project). Three roles (Admin, Organizer, Participant) and five headline features: Smart Networking Matchmaker, Virtual Speed Networking (Jitsi), Live Q&A, Connection Hub & Private Chat, Analytics Dashboard.

> **Read "Backend assumptions" and "Verification status" before running.** The API documentation lists endpoints and methods but not request bodies, response envelopes or Socket.IO events. Those details are isolated in a few files so they are quick to correct.

## Stack
React 18 · Vite 6 · Tailwind CSS 4 · shadcn-style UI (hand-authored in `src/components/ui`, not CLI-generated) · React Router 6 · TanStack Query 5 · Axios · React Hook Form + Zod · Socket.IO client · `@jitsi/react-sdk` · Recharts · Motion · date-fns · Sonner · Lucide · Vitest + React Testing Library + Playwright.

## Quick start
```bash
npm install
cp .env.example .env      # adjust if your backend is not on localhost:5000
npm run dev               # http://localhost:5173
```
Start the backend first (`http://localhost:5000/api/v1`). The backend must allow CORS **with credentials** for `http://localhost:5173` (the session is an HttpOnly cookie, so `Access-Control-Allow-Credentials: true` and an explicit origin are required; `SameSite`/`Secure` must suit your setup).

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm run preview` | Production build / local preview (`dist/`) |
| `npm test` | Vitest unit + component tests |
| `npm run test:e2e` | Playwright smoke tests (`npx playwright install` once; no backend needed) |

## Environment (`.env`)
`VITE_API_BASE_URL`, `VITE_SOCKET_URL`, `VITE_JITSI_DOMAIN`, optional `VITE_CONTACT_EMAIL`. Only public values – no secrets. Cloudinary uploads go **through the backend** (no cloud keys in the frontend).
For SPA hosting (Vercel/Netlify) add a rewrite of all routes to `index.html`.

## Folder structure
```
src/
  components/  common/ (cards, states, tables, pickers) · layout/ · protected/ · ui/ (button, form, modal, tabs…)
  context/     Auth · Socket · Notification · Theme
  hooks/       useAuth, useSocket(+useSocketEvent), useNotifications, useEvents, useSocial, useApiMutation…
  services/    api.js (Axios) · adapters.js · payloads.js · socketEvents.js · per-domain *Service.js
  features/    matchmaker · speedNetworking · liveQA · connectionHub · analytics   (pages/ components/ *Service.js)
  pages/       public · auth · shared · participant · organizer (+panels) · admin
  routes/      AppRoutes.jsx · routeConfig.js (navigation per role)
  utils/       fields.js (view-model mappers) · validators.js (Zod) · formatDate.js · constants.js
e2e/           Playwright specs
```

## Features implemented
- **Auth:** register (participant/organizer only – admin is never offered), login, logout, forgot/reset/change password, `/auth/me` bootstrap, protected + role-protected routes, 401 handling. No tokens in JS/localStorage (HttpOnly cookie, `withCredentials`).
- **Participant:** dashboard, explore/search events, event detail (agenda, speakers), register/cancel, My Events (upcoming/past), check-in/out, attendance view, profile + avatar upload + skills/interests, notifications.
- **Organizer:** dashboard, event CRUD, publish/cancel/complete/delete with confirmation, banner upload, sessions, speakers (+photo upload), registrations, mark attendance, attendance records, Q&A moderation, event analytics.
- **Admin:** platform dashboard/analytics, user list (search/role filter), activate/deactivate, role change, organizers view, event moderation.
- **Matchmaker:** recommendations, client-side search + skill filter, shared skills highlighted, profile modal, connection requests. A match percentage is shown **only if the backend returns one**; the frontend never invents scores.
- **Speed networking:** lobby → queue (polls `/networking/sessions/active`) → matched room with Jitsi + countdown timer + end meeting → history.
- **Live Q&A:** list, ask, upvote/remove, sort/filter, moderation controls (organizer), auto-refresh.
- **Connection hub & chat:** connections, incoming/sent requests, accept/reject/cancel, remove, block/unblock, private chat with history (polled every 5 s).
- **Analytics:** Recharts dashboards for platform and per-event data.
- **UX:** light/dark theme (persisted), responsive layouts, skeletons, empty/error states, toasts, confirm dialogs, error boundary, keyboard-accessible modal.

## Backend assumptions (verify these first)
All live in these files – edit here only:

| Area | File | Assumption |
|---|---|---|
| Response envelope | `services/adapters.js` | `{data: …}` or bare body; lists under `data`/`items`/`results`/`<name>`; pagination under `pagination`/`meta` |
| Request bodies & upload field names | `services/payloads.js` | e.g. register `{name,email,password,role}`, reset `{token,password}`, change-password `{currentPassword,newPassword}`, message `{receiverId,content}`, question `{content}`, moderate `{status: approved\|answered\|rejected}`, user status `{status: active\|inactive}`, queue join `{eventId?}`, attendance mark `{userId,status}`; multipart fields `avatar`/`banner`/`image` |
| Query params | pages (`Events`, `Users`) | `search`, `page`, `limit`, `role` |
| Entity field names | `utils/fields.js` | common aliases (`_id`/`id`, `name`/`fullName`, `startDate`/`startTime`…) |
| Jitsi room data | `utils/fields.js → netSessionView` | `roomName`/`room`/`meetingUrl` and optional `jwt`; if absent the room shows a diagnostic instead of a call |
| Meeting length | `utils/constants.js` | 5 min **estimate** only when backend sends no end time/duration; shown as "est." and never auto-ends |
| Reset link | `pages/auth/ResetPassword.jsx` | token arrives as `?token=` |
| Socket.IO | `services/socketEvents.js` | **No event names are documented, so all are `null` (disabled).** Real-time currently works via polling. In dev, the console logs every incoming event (`[socket] name`); paste the real names into `socketEvents.js` to enable push. Handlers just invalidate queries, so payload shape doesn't matter. |
| Online/offline presence | – | Not implemented (no documented source) |
| Analytics | `features/analytics/analyticsAdapter.js` | Charts/stat cards are derived from whatever the API returns (numbers → cards, object arrays → line/bar charts); fine-tune titles once the real shape is known |

## Verification status (honest)
Built in an environment **without internet**, so `npm install`, `npm run build`, Vitest component tests, Playwright and any run against the real backend were **not executed**. What *was* done:
- Whole app graph bundled with esbuild (third-party packages external): syntax, import paths and local named exports resolve cleanly.
- 22 pure-logic assertions (adapters, field mappers, analytics derivation, Zod schemas incl. "admin cannot self-register" and "no invented match score") executed and passing via a minimal Vitest stand-in.

**Not verified:** installed-dependency API compatibility, `vite build`, `ProtectedRoute.test.jsx`, Playwright specs, visual/responsive rendering, cookie/CORS auth against your backend, Socket.IO, Jitsi, uploads, and every endpoint call. Treat first `npm install && npm run build && npm test` as the real check, then walk through each role against the live backend. No `package-lock.json` is included (generated on your first install).

## Known limitations
- Real-time push is disabled until socket events are supplied (polling fallback in place).
- Contact page has no form (no documented endpoint); it shows a mailto link.
- Presence (online/offline), queue-position and typing indicators are not available.
- Organizer event lists are filtered client-side by owner id when the API returns one.
