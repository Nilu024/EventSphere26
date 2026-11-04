/**
 * Socket.IO event names.
 *
 * The documentation says Socket.IO is used for Q&A, chat, notifications and speed networking but
 * does NOT list event names or payloads, and the brief forbids inventing them. Every name is
 * therefore `null` (= disabled). Features keep working through TanStack Query polling.
 *
 * To enable real-time push: run the app in dev, open the console (SocketContext logs every
 * incoming event as "[socket] <name>"), then paste the real names below. Handlers only
 * invalidate queries, so payload shape does not matter.
 */
export const SOCKET_EVENTS = {
  notification: null,       // e.g. new notification
  message: null,            // new private message
  connectionUpdate: null,   // request received / accepted
  questionUpdate: null,     // question added / upvoted / moderated
  queueMatched: null,       // speed-networking match found
  sessionEnded: null,       // speed-networking session ended
};
/** Rooms are not documented either; leave empty unless the backend requires an explicit join. */
export const SOCKET_ROOM_JOIN = { event: null, eventPayload: (eventId) => ({ eventId }) };
