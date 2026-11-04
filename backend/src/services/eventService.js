import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import { Speaker } from '../models/Speaker.js';
import { Question } from '../models/Question.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { ROLES } from '../constants/roles.js';
import { EVENT_STATUS, ACTIVE_REGISTRATION_STATUSES, NOTIFICATION_TYPE } from '../constants/enums.js';
import { escapeRegex } from '../utils/normalize.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { assertEventManager, getViewableEvent } from './accessService.js';
import { notifyMany } from './notificationService.js';
import { uploadImage } from './uploadService.js';

const ORGANIZER_FIELDS = 'name profileImage company designation';

export async function createEvent(user, data) {
  const event = await Event.create({ ...data, organizer: user._id, status: EVENT_STATUS.DRAFT });
  return event;
}

export async function listEvents(user, query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  const isAdmin = user?.role === ROLES.ADMIN;

  if (query.mine) {
    if (!user) throw ApiError.unauthorized();
    if (user.role === ROLES.PARTICIPANT) throw ApiError.forbidden();
    filter.organizer = user._id;
    if (query.status) filter.status = query.status;
  } else {
    if (isAdmin && query.status) filter.status = query.status;
    else if (!isAdmin) filter.status = EVENT_STATUS.PUBLISHED;
    if (query.organizer) filter.organizer = query.organizer;
  }
  if (query.category) filter.category = query.category;
  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }
  if (query.upcoming) filter.endDate = { $gte: new Date() };
  if (query.from || query.to) {
    filter.startDate = {};
    if (query.from) filter.startDate.$gte = query.from;
    if (query.to) filter.startDate.$lte = query.to;
  }
  const dir = query.order === 'desc' ? -1 : 1;
  const sort = { [query.sortBy || 'startDate']: dir, _id: 1 };

  const [items, total] = await Promise.all([
    Event.find(filter).sort(sort).skip(skip).limit(limit).populate('organizer', ORGANIZER_FIELDS),
    Event.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function getEvent(user, id) {
  const event = await getViewableEvent(id, user);
  await event.populate('organizer', ORGANIZER_FIELDS);
  return event;
}

export async function updateEvent(user, id, data) {
  const event = await assertEventManager(id, user);
  if ([EVENT_STATUS.CANCELLED, EVENT_STATUS.COMPLETED].includes(event.status)) {
    throw ApiError.conflict(`A ${event.status} event cannot be edited`);
  }
  const start = data.startDate ?? event.startDate;
  const end = data.endDate ?? event.endDate;
  if (end <= start) throw ApiError.unprocessable(MESSAGES.VALIDATION_FAILED, [{ field: 'endDate', message: 'endDate must be after startDate' }]);
  const deadline = data.registrationDeadline === undefined ? event.registrationDeadline : data.registrationDeadline;
  if (deadline && deadline > end) throw ApiError.unprocessable(MESSAGES.VALIDATION_FAILED, [{ field: 'registrationDeadline', message: 'registrationDeadline must not be after endDate' }]);
  if (data.capacity !== undefined && data.capacity < event.registeredCount) {
    throw ApiError.conflict(`Capacity cannot be lower than the current number of registrations (${event.registeredCount})`);
  }
  const scheduleChanged = ['startDate', 'endDate', 'title'].some((k) => data[k] !== undefined && String(data[k]) !== String(event[k]));
  event.set(data);
  await event.save();

  if (scheduleChanged && event.status === EVENT_STATUS.PUBLISHED) {
    const ids = await EventRegistration.find({ event: event._id, status: { $in: ACTIVE_REGISTRATION_STATUSES } }).distinct('participant');
    await notifyMany(ids, {
      type: NOTIFICATION_TYPE.EVENT_UPDATE, title: 'Event updated',
      message: `"${event.title}" has been updated. Please review the latest details.`, relatedEntityId: event._id,
    });
  }
  return event;
}

export async function publishEvent(user, id) {
  const event = await assertEventManager(id, user);
  if (event.status !== EVENT_STATUS.DRAFT) throw ApiError.conflict(`Only draft events can be published (current status: ${event.status})`);
  if (event.endDate <= new Date()) throw ApiError.conflict('Cannot publish an event that has already ended');
  event.status = EVENT_STATUS.PUBLISHED;
  await event.save();
  return event;
}

export async function cancelEvent(user, id) {
  const event = await assertEventManager(id, user);
  if (![EVENT_STATUS.DRAFT, EVENT_STATUS.PUBLISHED].includes(event.status)) {
    throw ApiError.conflict(`A ${event.status} event cannot be cancelled`);
  }
  event.status = EVENT_STATUS.CANCELLED;
  await event.save();
  const ids = await EventRegistration.find({ event: event._id, status: { $in: ACTIVE_REGISTRATION_STATUSES } }).distinct('participant');
  await notifyMany(ids, {
    type: NOTIFICATION_TYPE.EVENT_CANCELLED, title: 'Event cancelled',
    message: `"${event.title}" has been cancelled.`, relatedEntityId: event._id,
  });
  return event;
}

export async function completeEvent(user, id) {
  const event = await assertEventManager(id, user);
  if (event.status !== EVENT_STATUS.PUBLISHED) throw ApiError.conflict('Only published events can be marked completed');
  event.status = EVENT_STATUS.COMPLETED;
  await event.save();
  return event;
}

/** Deletes an event that has no active registrations and removes its sessions, speakers and questions. */
export async function deleteEvent(user, id) {
  const event = await assertEventManager(id, user);
  if (event.registeredCount > 0) {
    throw ApiError.conflict('This event has registrations and cannot be deleted. Cancel it instead.');
  }
  await Promise.all([
    Session.deleteMany({ event: event._id }),
    Speaker.deleteMany({ event: event._id }),
    Question.deleteMany({ event: event._id }),
    EventRegistration.deleteMany({ event: event._id }),
  ]);
  await event.deleteOne();
}

export async function updateBanner(user, id, file) {
  const event = await assertEventManager(id, user);
  event.bannerImage = await uploadImage(file.buffer, 'events');
  await event.save();
  return event;
}
