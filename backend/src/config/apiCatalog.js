/**
 * Single source of truth for API documentation. Used by config/swagger.js (OpenAPI) and
 * scripts/generateApiDocs.js (docs/API.md). Keep in sync with src/routes/*.
 * auth: 'public' | 'optional' | 'required'
 * body/query values: "type" with trailing * for required. Error codes are listed in `err`.
 */
const E = (method, path, tag, summary, o = {}) => ({
  method, path, tag, summary,
  auth: o.auth || 'required',
  roles: o.roles || 'any authenticated',
  body: o.body || null,
  query: o.query || null,
  status: o.status || 200,
  response: o.response || '{ success, message, data }',
  err: o.err || '401',
});
const PAG = { page: 'int', limit: 'int (max 100)' };
const ORG = 'organizer (owner), admin';
const PART = 'participant';
const ADM = 'admin';

export const apiCatalog = [
  // Auth
  E('POST', '/auth/register', 'Auth', 'Register a new user (participant or organizer)', { auth: 'public', roles: 'public', status: 201, body: { name: 'string*', email: 'string*', password: 'string* (8-72, upper+lower+digit)', role: 'participant|organizer', designation: 'string', company: 'string' }, response: 'data.user', err: '409 email exists, 422 validation, 429' }),
  E('POST', '/auth/login', 'Auth', 'Log in; returns JWT (also set as httpOnly cookie)', { auth: 'public', roles: 'public', body: { email: 'string*', password: 'string*' }, response: 'data.{user, token, expiresIn}', err: '401 invalid credentials, 403 deactivated, 422, 429' }),
  E('POST', '/auth/logout', 'Auth', 'Logout - revokes all tokens of the user', { err: '401' }),
  E('GET', '/auth/me', 'Auth', 'Current user', { response: 'data.user' }),
  E('PATCH', '/auth/change-password', 'Auth', 'Change password (revokes old tokens, returns a new one)', { body: { currentPassword: 'string*', newPassword: 'string*' }, err: '401 wrong current password, 422' }),
  E('POST', '/auth/forgot-password', 'Auth', 'Request password-reset email (always 200)', { auth: 'public', roles: 'public', body: { email: 'string*' }, err: '422, 429' }),
  E('POST', '/auth/reset-password', 'Auth', 'Reset password with emailed token', { auth: 'public', roles: 'public', body: { token: 'string(64 hex)*', newPassword: 'string*' }, err: '400 invalid/expired token, 422' }),
  // Users
  E('GET', '/users/me', 'Users', 'Own profile'),
  E('PATCH', '/users/me', 'Users', 'Update own profile incl. skills & interests (normalised, de-duplicated)', { body: { name: 'string', bio: 'string', designation: 'string', company: 'string', experience: 'string', skills: 'string[] (max 30)', interests: 'string[] (max 30)', socialLinks: '{linkedin,github,twitter,website}' }, err: '422' }),
  E('POST', '/users/me/avatar', 'Users', 'Upload profile image (multipart field "image", JPEG/PNG/WebP, 2 MB; needs Cloudinary)', { err: '400 bad file, 413, 503 not configured' }),
  E('GET', '/users', 'Users', 'List users', { roles: ADM, query: { ...PAG, role: 'string', isActive: 'bool', search: 'string' }, err: '403' }),
  E('GET', '/users/:id', 'Users', 'Public profile (no email). Inactive/blocked users return 404', { err: '404' }),
  E('PATCH', '/users/:id/status', 'Users', 'Activate/deactivate account (deactivation revokes tokens)', { roles: ADM, body: { isActive: 'bool*' }, err: '400 self, 403, 404' }),
  E('PATCH', '/users/:id/role', 'Users', 'Change role', { roles: ADM, body: { role: 'admin|organizer|participant*' }, err: '400 self, 403, 404' }),
  // Events
  E('GET', '/events', 'Events', 'Browse/search events (published only unless admin or mine=true)', { auth: 'optional', roles: 'public', query: { ...PAG, search: 'string', category: 'string', status: 'string (admin/mine)', organizer: 'id', mine: 'bool', upcoming: 'bool', from: 'date', to: 'date', sortBy: 'startDate|createdAt|title|registeredCount', order: 'asc|desc' }, response: 'data[] + meta pagination', err: '401 (mine), 403' }),
  E('POST', '/events', 'Events', 'Create event (draft)', { roles: 'organizer, admin', status: 201, body: { title: 'string*', description: 'string*', category: 'string*', startDate: 'ISO date* (future)', endDate: 'ISO date*', timezone: 'IANA tz', meetingLink: 'url', capacity: 'int', registrationDeadline: 'ISO date' }, err: '403, 422' }),
  E('GET', '/events/:id', 'Events', 'Event details (drafts visible to owner/admin only)', { auth: 'optional', roles: 'public', err: '404' }),
  E('PATCH', '/events/:id', 'Events', 'Update event', { roles: ORG, body: { title: 'string', description: 'string', category: 'string', startDate: 'date', endDate: 'date', timezone: 'string', meetingLink: 'url', capacity: 'int', registrationDeadline: 'date|null' }, err: '403 not owner, 404, 409 cancelled/completed or capacity<registrations, 422' }),
  E('DELETE', '/events/:id', 'Events', 'Delete event (only when it has no registrations; cascades sessions/speakers/questions)', { roles: ORG, err: '403, 404, 409' }),
  E('PATCH', '/events/:id/publish', 'Events', 'Publish a draft event', { roles: ORG, err: '403, 404, 409' }),
  E('PATCH', '/events/:id/cancel', 'Events', 'Cancel event (notifies registrants)', { roles: ORG, err: '403, 404, 409' }),
  E('PATCH', '/events/:id/complete', 'Events', 'Mark a published event completed', { roles: ORG, err: '403, 404, 409' }),
  E('POST', '/events/:id/banner', 'Events', 'Upload banner (multipart "image"; needs Cloudinary)', { roles: ORG, err: '400, 403, 413, 503' }),
  // Sessions
  E('GET', '/events/:eventId/sessions', 'Sessions', 'List event sessions', { auth: 'optional', roles: 'public', err: '404' }),
  E('POST', '/events/:eventId/sessions', 'Sessions', 'Create session', { roles: ORG, status: 201, body: { title: 'string*', description: 'string', speaker: 'speakerId|null', startTime: 'date*', endTime: 'date*', meetingLink: 'url', status: 'scheduled|live|completed|cancelled' }, err: '403, 404, 409, 422 (outside event window / foreign speaker)' }),
  E('PATCH', '/sessions/:id', 'Sessions', 'Update session', { roles: ORG, body: { title: 'string', startTime: 'date', endTime: 'date', speaker: 'id|null', status: 'string' }, err: '403, 404, 422' }),
  E('DELETE', '/sessions/:id', 'Sessions', 'Delete session', { roles: ORG, err: '403, 404' }),
  // Speakers
  E('GET', '/events/:eventId/speakers', 'Speakers', 'List event speakers', { auth: 'optional', roles: 'public', err: '404' }),
  E('POST', '/events/:eventId/speakers', 'Speakers', 'Add speaker', { roles: ORG, status: 201, body: { name: 'string*', designation: 'string', organization: 'string', biography: 'string', expertise: 'string[]', socialLinks: 'object', user: 'userId' }, err: '403, 404, 422' }),
  E('PATCH', '/speakers/:id', 'Speakers', 'Update speaker', { roles: ORG, err: '403, 404, 422' }),
  E('DELETE', '/speakers/:id', 'Speakers', 'Remove speaker (unassigns from sessions)', { roles: ORG, err: '403, 404' }),
  E('POST', '/speakers/:id/image', 'Speakers', 'Upload speaker image (multipart "image")', { roles: ORG, err: '400, 403, 503' }),
  // Registration
  E('POST', '/events/:eventId/register', 'Registrations', 'Register for event (atomic capacity check)', { roles: PART, status: 201, err: '403, 404, 409 duplicate/full/deadline/not published' }),
  E('DELETE', '/events/:eventId/register', 'Registrations', 'Cancel own registration', { roles: PART, err: '404, 409' }),
  E('GET', '/registrations/me', 'Registrations', 'Own registrations', { roles: PART, query: { ...PAG, status: 'string' } }),
  E('GET', '/events/:eventId/registrations', 'Registrations', 'Participants registered for an event', { roles: ORG, query: { ...PAG, status: 'string' }, err: '403, 404' }),
  // Attendance
  E('POST', '/events/:eventId/attendance/check-in', 'Attendance', 'Participant check-in (server time & eligibility)', { roles: PART, status: 201, err: '403 not registered, 409 duplicate/not open/ended' }),
  E('POST', '/events/:eventId/attendance/check-out', 'Attendance', 'Participant check-out', { roles: PART, err: '409' }),
  E('GET', '/events/:eventId/attendance/me', 'Attendance', 'Own attendance record (data null if none)', { roles: PART }),
  E('POST', '/events/:eventId/attendance/mark', 'Attendance', 'Organizer records attendance for a registered participant', { roles: ORG, status: 201, body: { participantId: 'id*' }, err: '403, 404, 409 duplicate' }),
  E('GET', '/events/:eventId/attendance', 'Attendance', 'Attendance report + summary (meta.summary)', { roles: ORG, query: { ...PAG, status: 'present|checked_out' }, err: '403, 404' }),
  // Matchmaker
  E('GET', '/networking/recommendations', 'Matchmaker', 'Top-5 recommended participants: 0.60*skillJaccard + 0.40*interestJaccard', { roles: PART, query: { eventId: 'id (restrict to event attendees)' }, response: 'data[] {user, score, skillSimilarity, interestSimilarity, sharedSkills, sharedInterests}', err: '403, 404' }),
  E('GET', '/networking/recommendations/:id', 'Matchmaker', 'Score breakdown + relationship with one eligible user', { roles: PART, query: { eventId: 'id' }, err: '400 self, 404 ineligible/blocked' }),
  // Connections
  E('POST', '/connections/request/:userId', 'Connections', 'Send connection request', { roles: PART, status: 201, err: '400 self, 403 blocked, 404, 409 duplicate/already connected' }),
  E('PATCH', '/connections/:id/accept', 'Connections', 'Accept (recipient only)', { roles: PART, err: '403, 404, 409' }),
  E('PATCH', '/connections/:id/reject', 'Connections', 'Reject (recipient only)', { roles: PART, err: '403, 404, 409' }),
  E('PATCH', '/connections/:id/cancel', 'Connections', 'Cancel own pending request', { roles: PART, err: '403, 404, 409' }),
  E('DELETE', '/connections/:id', 'Connections', 'Remove an accepted connection', { roles: PART, err: '404, 409' }),
  E('GET', '/connections', 'Connections', 'Accepted connections', { roles: PART, query: PAG }),
  E('GET', '/connections/requests', 'Connections', 'Pending requests', { roles: PART, query: { direction: 'incoming|outgoing|all (default all)' }, response: 'data.{incoming[], outgoing[]}' }),
  E('POST', '/connections/block/:userId', 'Connections', 'Block a user', { roles: PART, err: '400, 403, 404' }),
  E('DELETE', '/connections/block/:userId', 'Connections', 'Unblock a user you blocked', { roles: PART, err: '404' }),
  E('GET', '/connections/blocked', 'Connections', 'Users you blocked', { roles: PART }),
  // Speed networking
  E('POST', '/networking/queue/join', 'Speed Networking', 'Join queue; returns queued or matched (with Jitsi room). Requires an open Socket.IO connection', { roles: PART, body: { eventId: 'id*' }, response: 'data.{status: queued|matched, session?}', err: '403 not registered, 409 active session/other queue/not live/no socket' }),
  E('POST', '/networking/queue/leave', 'Speed Networking', 'Leave queue', { roles: PART }),
  E('GET', '/networking/sessions/active', 'Speed Networking', 'Current open session incl. Jitsi room (null if none)', { roles: PART }),
  E('GET', '/networking/sessions/history', 'Speed Networking', 'Finished sessions', { roles: PART, query: PAG }),
  E('GET', '/networking/sessions/:id', 'Speed Networking', 'Room info for an open session - paired participants only', { roles: PART, err: '404 not a participant, 409 ended' }),
  E('POST', '/networking/sessions/:id/end', 'Speed Networking', 'End session early (recorded as cancelled)', { roles: PART, err: '404, 409' }),
  // Q&A
  E('GET', '/events/:eventId/questions', 'Q&A', 'Questions sorted pinned-first then by votes. Participants never see hidden/rejected', { query: { ...PAG, sessionId: 'id', includeHidden: 'bool (managers)' }, roles: 'registered participant, event organizer, admin', err: '403, 404' }),
  E('POST', '/events/:eventId/questions', 'Q&A', 'Submit question (broadcast via socket)', { roles: 'registered participant, event organizer, admin', status: 201, body: { questionText: 'string 5-500*', sessionId: 'id' }, err: '403, 404, 409, 422' }),
  E('POST', '/questions/:id/upvote', 'Q&A', 'Upvote (one per user)', { roles: 'registered participant, organizer, admin', err: '403, 404, 409 already voted' }),
  E('DELETE', '/questions/:id/upvote', 'Q&A', 'Remove own upvote', { roles: 'registered participant, organizer, admin', err: '404, 409' }),
  E('PATCH', '/questions/:id/moderate', 'Q&A', 'Moderate', { roles: ORG, body: { action: 'approve|reject|hide|unhide|pin|unpin*' }, err: '403 not owner, 404, 422' }),
  // Messages
  E('GET', '/messages/:userId', 'Messages', 'Conversation history, newest first (accepted connections only)', { roles: PART, query: { page: 'int', limit: 'int (max 100)' }, err: '403 not connected' }),
  E('POST', '/messages', 'Messages', 'Send message over HTTP (also delivered via socket)', { roles: PART, status: 201, body: { receiverId: 'id*', content: 'string 1-2000*' }, err: '403 not connected, 422, 429' }),
  // Notifications
  E('GET', '/notifications', 'Notifications', 'Own notifications (meta.unreadCount)', { query: { ...PAG, isRead: 'bool' } }),
  E('PATCH', '/notifications/read-all', 'Notifications', 'Mark all as read'),
  E('PATCH', '/notifications/:id/read', 'Notifications', 'Mark one as read', { err: '404' }),
  // Analytics
  E('GET', '/analytics/events/:eventId', 'Analytics', 'Event analytics (registrations, attendance %, questions, upvotes, networking)', { roles: ORG, err: '403 not owner, 404' }),
  E('GET', '/analytics/platform', 'Analytics', 'Platform-wide analytics', { roles: ADM, err: '403' }),
];
