import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { ROLES } from '../constants/roles.js';
import { ACTIVE_REGISTRATION_STATUSES, EVENT_STATUS } from '../constants/enums.js';

export async function getEventOrThrow(eventId) {
  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound(MESSAGES.EVENT_NOT_FOUND);
  return event;
}

/** Admins manage everything; organizers only events they own. Server-side only - never trust client-supplied ownership. */
export const isEventManager = (user, event) =>
  Boolean(user) && (user.role === ROLES.ADMIN || (user.role === ROLES.ORGANIZER && event.organizer.equals(user._id)));

export async function assertEventManager(eventId, user) {
  const event = await getEventOrThrow(eventId);
  if (!isEventManager(user, event)) throw ApiError.forbidden(MESSAGES.NOT_OWNER);
  return event;
}

/** Drafts are visible to managers only; every other status is publicly viewable. Hidden drafts look like 404s. */
export async function getViewableEvent(eventId, user) {
  const event = await getEventOrThrow(eventId);
  if (event.status === EVENT_STATUS.DRAFT && !isEventManager(user, event)) throw ApiError.notFound(MESSAGES.EVENT_NOT_FOUND);
  return event;
}

export const getActiveRegistration = (eventId, userId) =>
  EventRegistration.findOne({ event: eventId, participant: userId, status: { $in: ACTIVE_REGISTRATION_STATUSES } });

/** Q&A / event-room access: event managers, or participants with an active registration. */
export async function assertEventMember(eventId, user) {
  const event = await getEventOrThrow(eventId);
  if (isEventManager(user, event)) return { event, isManager: true };
  if (user.role !== ROLES.PARTICIPANT) throw ApiError.forbidden(MESSAGES.FORBIDDEN);
  if (event.status === EVENT_STATUS.DRAFT) throw ApiError.notFound(MESSAGES.EVENT_NOT_FOUND);
  const reg = await getActiveRegistration(event._id, user._id);
  if (!reg) throw ApiError.forbidden(MESSAGES.NOT_REGISTERED);
  return { event, isManager: false };
}
