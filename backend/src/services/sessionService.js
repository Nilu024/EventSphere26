import { Session } from '../models/Session.js';
import { Speaker } from '../models/Speaker.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { EVENT_STATUS } from '../constants/enums.js';
import { assertEventManager, getViewableEvent } from './accessService.js';
import { uploadImage } from './uploadService.js';

const validationError = (field, message) => ApiError.unprocessable(MESSAGES.VALIDATION_FAILED, [{ field, message }]);

async function assertSpeakerBelongsToEvent(speakerId, eventId) {
  if (!speakerId) return;
  const ok = await Speaker.exists({ _id: speakerId, event: eventId });
  if (!ok) throw validationError('speaker', 'Speaker does not exist for this event');
}

function assertWithinEvent(event, start, end) {
  if (start < event.startDate || end > event.endDate) {
    throw validationError('startTime', 'Session must fall within the event start and end dates');
  }
}

async function loadSessionForManager(id, user) {
  const session = await Session.findById(id);
  if (!session) throw ApiError.notFound(MESSAGES.SESSION_NOT_FOUND);
  const event = await assertEventManager(session.event, user);
  return { session, event };
}

/* ---------------- Sessions ---------------- */
export async function listSessions(user, eventId) {
  const event = await getViewableEvent(eventId, user);
  return Session.find({ event: event._id }).sort({ startTime: 1 }).populate('speaker', 'name designation organization profileImage');
}

export async function createSession(user, eventId, data) {
  const event = await assertEventManager(eventId, user);
  if ([EVENT_STATUS.CANCELLED, EVENT_STATUS.COMPLETED].includes(event.status)) throw ApiError.conflict(`Cannot add sessions to a ${event.status} event`);
  assertWithinEvent(event, data.startTime, data.endTime);
  await assertSpeakerBelongsToEvent(data.speaker, event._id);
  return Session.create({ ...data, event: event._id });
}

export async function updateSession(user, id, data) {
  const { session, event } = await loadSessionForManager(id, user);
  const start = data.startTime ?? session.startTime;
  const end = data.endTime ?? session.endTime;
  if (end <= start) throw validationError('endTime', 'endTime must be after startTime');
  assertWithinEvent(event, start, end);
  if (data.speaker) await assertSpeakerBelongsToEvent(data.speaker, event._id);
  session.set(data);
  await session.save();
  return session;
}

export async function deleteSession(user, id) {
  const { session } = await loadSessionForManager(id, user);
  await session.deleteOne();
}

/* ---------------- Speakers ---------------- */
export async function listSpeakers(user, eventId) {
  const event = await getViewableEvent(eventId, user);
  return Speaker.find({ event: event._id }).sort({ name: 1 });
}

async function assertLinkedUser(userId) {
  if (!userId) return;
  const exists = await User.exists({ _id: userId });
  if (!exists) throw validationError('user', 'Linked user does not exist');
}

export async function createSpeaker(user, eventId, data) {
  const event = await assertEventManager(eventId, user);
  await assertLinkedUser(data.user);
  return Speaker.create({ ...data, event: event._id, addedBy: user._id });
}

async function loadSpeakerForManager(id, user) {
  const speaker = await Speaker.findById(id);
  if (!speaker) throw ApiError.notFound(MESSAGES.SPEAKER_NOT_FOUND);
  await assertEventManager(speaker.event, user);
  return speaker;
}

export async function updateSpeaker(user, id, data) {
  const speaker = await loadSpeakerForManager(id, user);
  await assertLinkedUser(data.user);
  const { socialLinks, ...rest } = data;
  speaker.set(rest);
  if (socialLinks) Object.entries(socialLinks).forEach(([k, v]) => speaker.set(`socialLinks.${k}`, v));
  await speaker.save();
  return speaker;
}

export async function deleteSpeaker(user, id) {
  const speaker = await loadSpeakerForManager(id, user);
  await Session.updateMany({ speaker: speaker._id }, { $set: { speaker: null } }); // unassign from sessions
  await speaker.deleteOne();
}

export async function updateSpeakerImage(user, id, file) {
  const speaker = await loadSpeakerForManager(id, user);
  speaker.profileImage = await uploadImage(file.buffer, 'speakers');
  await speaker.save();
  return speaker;
}
