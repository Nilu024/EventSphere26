import { Attendance } from '../models/Attendance.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { ATTENDANCE_STATUS, EVENT_STATUS, REGISTRATION_STATUS as R, ACTIVE_REGISTRATION_STATUSES } from '../constants/enums.js';
import { attendancePercentage } from '../utils/similarity.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { assertEventManager, getEventOrThrow } from './accessService.js';

export function assertEventLive(event) {
  if (event.status !== EVENT_STATUS.PUBLISHED) throw ApiError.conflict('Attendance is only available for published events');
  if (!env.ENFORCE_EVENT_TIME_WINDOW) return;
  const now = Date.now();
  const opensAt = event.startDate.getTime() - env.ATTENDANCE_EARLY_MINUTES * 60 * 1000;
  if (now < opensAt) throw ApiError.conflict('Check-in has not opened yet');
  if (now > event.endDate.getTime()) throw ApiError.conflict('This event has ended');
}

async function record(event, participantId, { markedBy, markedByUser }) {
  const registration = await EventRegistration.findOne({ event: event._id, participant: participantId, status: { $in: ACTIVE_REGISTRATION_STATUSES } });
  if (!registration) throw ApiError.forbidden('Participant is not registered for this event (not eligible for attendance)');
  let attendance;
  try {
    attendance = await Attendance.create({ event: event._id, participant: participantId, markedBy, markedByUser });
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('Attendance already recorded for this participant');
    throw err;
  }
  await EventRegistration.updateOne({ _id: registration._id }, { $set: { status: R.ATTENDED } });
  return attendance;
}

/** Participant self check-in. Time and eligibility come from the server, never from the client. */
export async function checkIn(user, eventId) {
  const event = await getEventOrThrow(eventId);
  assertEventLive(event);
  return record(event, user._id, { markedBy: 'self' });
}

export async function checkOut(user, eventId) {
  const attendance = await Attendance.findOneAndUpdate(
    { event: eventId, participant: user._id, checkOutTime: { $exists: false } },
    { $set: { checkOutTime: new Date(), attendanceStatus: ATTENDANCE_STATUS.CHECKED_OUT } },
    { new: true }
  );
  if (!attendance) throw ApiError.conflict('No open check-in found for this event');
  return attendance;
}

/** Organizer/admin manually records attendance for a registered participant. */
export async function markAttendance(manager, eventId, participantId) {
  const event = await assertEventManager(eventId, manager);
  if (event.status === EVENT_STATUS.DRAFT || event.status === EVENT_STATUS.CANCELLED) throw ApiError.conflict(`Cannot record attendance for a ${event.status} event`);
  return record(event, participantId, { markedBy: 'organizer', markedByUser: manager._id });
}

export const getMine = (user, eventId) => Attendance.findOne({ event: eventId, participant: user._id });

export async function listForEvent(manager, eventId, query) {
  const event = await assertEventManager(eventId, manager);
  const { page, limit, skip } = getPagination(query);
  const filter = { event: event._id };
  if (query.status) filter.attendanceStatus = query.status;
  const [items, total, registered, attended] = await Promise.all([
    Attendance.find(filter).sort({ checkInTime: 1 }).skip(skip).limit(limit).populate('participant', 'name email designation company'),
    Attendance.countDocuments(filter),
    EventRegistration.countDocuments({ event: event._id, status: { $in: ACTIVE_REGISTRATION_STATUSES } }),
    Attendance.countDocuments({ event: event._id }),
  ]);
  return {
    items,
    meta: { ...paginationMeta(total, page, limit), summary: { registered, attended, attendancePercentage: attendancePercentage(attended, registered) } },
  };
}
