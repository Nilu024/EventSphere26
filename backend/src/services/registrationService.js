import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { EVENT_STATUS, REGISTRATION_STATUS as R, ACTIVE_REGISTRATION_STATUSES, NOTIFICATION_TYPE } from '../constants/enums.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { assertEventManager, getEventOrThrow } from './accessService.js';
import { notify } from './notificationService.js';

/**
 * Registers a participant. Capacity is enforced with an atomic conditional $inc on Event.registeredCount, and
 * duplicates by the unique {event, participant} index, so concurrent requests can neither oversell nor duplicate.
 */
export async function register(user, eventId) {
  const event = await getEventOrThrow(eventId);
  if (event.status !== EVENT_STATUS.PUBLISHED) throw ApiError.conflict('Registration is only open for published events');
  const now = new Date();
  if (event.endDate <= now) throw ApiError.conflict('This event has already ended');
  if (event.registrationDeadline && now > event.registrationDeadline) throw ApiError.conflict('The registration deadline has passed');

  const existing = await EventRegistration.findOne({ event: event._id, participant: user._id });
  if (existing && ACTIVE_REGISTRATION_STATUSES.includes(existing.status)) throw ApiError.conflict('You are already registered for this event');

  const reserved = await Event.findOneAndUpdate(
    { _id: event._id, status: EVENT_STATUS.PUBLISHED, $expr: { $lt: ['$registeredCount', '$capacity'] } },
    { $inc: { registeredCount: 1 } },
    { new: true }
  );
  if (!reserved) throw ApiError.conflict('This event is full');

  let registration;
  try {
    registration = await EventRegistration.findOneAndUpdate(
      { event: event._id, participant: user._id, status: R.CANCELLED },
      { $set: { status: R.REGISTERED, registrationDate: new Date() } },
      { new: true }
    );
    if (!registration) registration = await EventRegistration.create({ event: event._id, participant: user._id });
  } catch (err) {
    await Event.updateOne({ _id: event._id }, { $inc: { registeredCount: -1 } }); // release the seat
    if (err.code === 11000) throw ApiError.conflict('You are already registered for this event');
    throw err;
  }

  await notify({
    recipient: user._id, type: NOTIFICATION_TYPE.EVENT_REGISTRATION, title: 'Registration confirmed',
    message: `You are registered for "${event.title}"`, relatedEntityId: event._id,
  });
  return registration;
}

export async function cancel(user, eventId) {
  const event = await getEventOrThrow(eventId);
  const registration = await EventRegistration.findOne({ event: event._id, participant: user._id });
  if (!registration || registration.status === R.CANCELLED) throw ApiError.notFound('You are not registered for this event');
  if (registration.status === R.ATTENDED) throw ApiError.conflict('Attended registrations cannot be cancelled');
  if (event.endDate <= new Date()) throw ApiError.conflict('This event has already ended');

  const updated = await EventRegistration.findOneAndUpdate(
    { _id: registration._id, status: R.REGISTERED },
    { $set: { status: R.CANCELLED } },
    { new: true }
  );
  if (!updated) throw ApiError.conflict('Registration state changed, please retry');
  await Event.updateOne({ _id: event._id, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });
  await notify({
    recipient: user._id, type: NOTIFICATION_TYPE.REGISTRATION_CANCELLED, title: 'Registration cancelled',
    message: `Your registration for "${event.title}" was cancelled`, relatedEntityId: event._id,
  });
  return updated;
}

export async function listMine(user, query) {
  const { page, limit, skip } = getPagination(query);
  const filter = { participant: user._id };
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    EventRegistration.find(filter).sort({ registrationDate: -1 }).skip(skip).limit(limit)
      .populate('event', 'title startDate endDate status category bannerImage timezone'),
    EventRegistration.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function listForEvent(user, eventId, query) {
  const event = await assertEventManager(eventId, user);
  const { page, limit, skip } = getPagination(query);
  const filter = { event: event._id };
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    EventRegistration.find(filter).sort({ registrationDate: -1 }).skip(skip).limit(limit)
      .populate('participant', 'name email profileImage designation company'),
    EventRegistration.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export { MESSAGES };
