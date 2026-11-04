const vals = (o) => Object.freeze(Object.values(o));

export const EVENT_STATUS = Object.freeze({ DRAFT: 'draft', PUBLISHED: 'published', CANCELLED: 'cancelled', COMPLETED: 'completed' });
export const EVENT_STATUSES = vals(EVENT_STATUS);
export const EVENT_CATEGORIES = Object.freeze([
  'conference', 'workshop', 'webinar', 'networking', 'hackathon', 'meetup', 'seminar', 'training', 'other',
]);
export const SESSION_STATUS = Object.freeze({ SCHEDULED: 'scheduled', LIVE: 'live', COMPLETED: 'completed', CANCELLED: 'cancelled' });
export const SESSION_STATUSES = vals(SESSION_STATUS);
export const REGISTRATION_STATUS = Object.freeze({ REGISTERED: 'registered', CANCELLED: 'cancelled', ATTENDED: 'attended' });
export const REGISTRATION_STATUSES = vals(REGISTRATION_STATUS);
export const ACTIVE_REGISTRATION_STATUSES = Object.freeze([REGISTRATION_STATUS.REGISTERED, REGISTRATION_STATUS.ATTENDED]);
export const CONNECTION_STATUS = Object.freeze({
  PENDING: 'pending', ACCEPTED: 'accepted', REJECTED: 'rejected', CANCELLED: 'cancelled', BLOCKED: 'blocked',
});
export const CONNECTION_STATUSES = vals(CONNECTION_STATUS);
export const NETWORKING_STATUS = Object.freeze({ WAITING: 'waiting', ACTIVE: 'active', COMPLETED: 'completed', CANCELLED: 'cancelled' });
export const NETWORKING_STATUSES = vals(NETWORKING_STATUS);
export const ATTENDANCE_STATUS = Object.freeze({ PRESENT: 'present', CHECKED_OUT: 'checked_out' });
export const ATTENDANCE_STATUSES = vals(ATTENDANCE_STATUS);
export const NOTIFICATION_TYPE = Object.freeze({
  CONNECTION_REQUEST: 'connection_request',
  CONNECTION_ACCEPTED: 'connection_accepted',
  EVENT_REGISTRATION: 'event_registration',
  REGISTRATION_CANCELLED: 'registration_cancelled',
  EVENT_UPDATE: 'event_update',
  EVENT_CANCELLED: 'event_cancelled',
  NETWORKING_MATCH: 'networking_match',
  NEW_MESSAGE: 'new_message',
  QUESTION_MODERATED: 'question_moderated',
  SYSTEM: 'system',
});
export const NOTIFICATION_TYPES = vals(NOTIFICATION_TYPE);
export const QUESTION_ACTIONS = Object.freeze(['approve', 'reject', 'hide', 'unhide', 'pin', 'unpin']);
