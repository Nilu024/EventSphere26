import mongoose from 'mongoose';
import { Question } from '../models/Question.js';
import { Session } from '../models/Session.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { EVENT_STATUS, NOTIFICATION_TYPE } from '../constants/enums.js';
import { eventRoom, emitToRoom } from '../utils/socketHub.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { assertEventMember, assertEventManager, isEventManager, getEventOrThrow } from './accessService.js';
import { notify } from './notificationService.js';

const oid = (id) => new mongoose.Types.ObjectId(String(id));

function ensureOpenForQA(event) {
  if (event.status !== EVENT_STATUS.PUBLISHED) throw ApiError.conflict('Q&A is only available while the event is published');
}

/** Builds the shaped output for a question (vote count, hasUpvoted, no raw voter list). */
function shape(q, viewerId) {
  const upvotes = q.upvotes || [];
  return {
    id: q._id.toString(),
    event: q.event.toString(),
    session: q.session ? q.session.toString() : null,
    askedBy: q.askedBy && q.askedBy._id ? { id: q.askedBy._id.toString(), name: q.askedBy.name, profileImage: q.askedBy.profileImage } : q.askedBy?.toString(),
    questionText: q.questionText,
    voteCount: upvotes.length,
    hasUpvoted: viewerId ? upvotes.some((u) => u.toString() === String(viewerId)) : false,
    isApproved: q.isApproved,
    isPinned: q.isPinned,
    isHidden: q.isHidden,
    createdAt: q.createdAt,
  };
}

export async function submitQuestion(user, eventId, { questionText, sessionId }) {
  const { event } = await assertEventMember(eventId, user);
  ensureOpenForQA(event);
  if (sessionId) {
    const ok = await Session.exists({ _id: sessionId, event: event._id });
    if (!ok) throw ApiError.unprocessable(MESSAGES.VALIDATION_FAILED, [{ field: 'sessionId', message: 'Session does not belong to this event' }]);
  }
  const q = await Question.create({ event: event._id, session: sessionId || null, askedBy: user._id, questionText });
  await q.populate('askedBy', 'name profileImage');
  const payload = shape(q, user._id);
  emitToRoom(eventRoom(event._id), 'question:new', payload);
  return payload;
}

/** Visible questions sorted pinned-first, then by vote count (desc), then oldest-first. */
export async function listQuestions(user, eventId, query) {
  const { event, isManager } = await assertEventMember(eventId, user);
  const { page, limit, skip } = getPagination(query);
  const match = { event: event._id };
  if (query.sessionId) match.session = oid(query.sessionId);
  const showAll = isManager && query.includeHidden !== false;
  if (!showAll) { match.isApproved = true; match.isHidden = false; }

  const [rows, total] = await Promise.all([
    Question.aggregate([
      { $match: match },
      { $addFields: { voteCount: { $size: '$upvotes' }, hasUpvoted: { $in: [oid(user._id), '$upvotes'] } } },
      { $sort: { isPinned: -1, voteCount: -1, createdAt: 1, _id: 1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { upvotes: 0 } },
    ]),
    Question.countDocuments(match),
  ]);
  await Question.populate(rows, { path: 'askedBy', select: 'name profileImage' });
  const items = rows.map((r) => ({
    id: r._id.toString(), event: r.event.toString(), session: r.session ? r.session.toString() : null,
    askedBy: r.askedBy && r.askedBy._id ? { id: r.askedBy._id.toString(), name: r.askedBy.name, profileImage: r.askedBy.profileImage } : null,
    questionText: r.questionText, voteCount: r.voteCount, hasUpvoted: r.hasUpvoted,
    isApproved: r.isApproved, isPinned: r.isPinned, isHidden: r.isHidden, createdAt: r.createdAt,
  }));
  return { items, meta: paginationMeta(total, page, limit) };
}

async function loadVisibleQuestion(user, id) {
  const q = await Question.findById(id);
  if (!q) throw ApiError.notFound(MESSAGES.QUESTION_NOT_FOUND);
  const { event } = await assertEventMember(q.event, user);
  ensureOpenForQA(event);
  if ((!q.isApproved || q.isHidden)) throw ApiError.notFound(MESSAGES.QUESTION_NOT_FOUND);
  return q;
}

/** One vote per user per question, enforced atomically with $addToSet + a "not already voted" filter. */
export async function upvote(user, id) {
  const q = await loadVisibleQuestion(user, id);
  const res = await Question.updateOne({ _id: q._id, upvotes: { $ne: user._id } }, { $addToSet: { upvotes: user._id } });
  if (res.modifiedCount === 0) throw ApiError.conflict('You have already upvoted this question');
  const fresh = await Question.findById(q._id);
  const payload = { questionId: fresh.id, eventId: String(fresh.event), voteCount: fresh.upvotes.length };
  emitToRoom(eventRoom(fresh.event), 'question:updated', payload);
  return { ...payload, hasUpvoted: true };
}

export async function removeUpvote(user, id) {
  const q = await loadVisibleQuestion(user, id);
  const res = await Question.updateOne({ _id: q._id, upvotes: user._id }, { $pull: { upvotes: user._id } });
  if (res.modifiedCount === 0) throw ApiError.conflict('You have not upvoted this question');
  const fresh = await Question.findById(q._id);
  const payload = { questionId: fresh.id, eventId: String(fresh.event), voteCount: fresh.upvotes.length };
  emitToRoom(eventRoom(fresh.event), 'question:updated', payload);
  return { ...payload, hasUpvoted: false };
}

const ACTION_PATCH = {
  approve: { isApproved: true },
  reject: { isApproved: false },
  hide: { isHidden: true },
  unhide: { isHidden: false },
  pin: { isPinned: true },
  unpin: { isPinned: false },
};

/** Organizer-of-the-event (or admin) moderation. */
export async function moderate(user, id, action) {
  const q = await Question.findById(id);
  if (!q) throw ApiError.notFound(MESSAGES.QUESTION_NOT_FOUND);
  await assertEventManager(q.event, user);
  Object.assign(q, ACTION_PATCH[action]);
  await q.save();
  const payload = { questionId: q.id, eventId: String(q.event), action, isApproved: q.isApproved, isHidden: q.isHidden, isPinned: q.isPinned };
  emitToRoom(eventRoom(q.event), 'question:moderated', payload);
  if (['reject', 'hide'].includes(action)) {
    await notify({
      recipient: q.askedBy, type: NOTIFICATION_TYPE.QUESTION_MODERATED, title: 'Question moderated',
      message: 'One of your questions was removed from the public list by a moderator.', relatedEntityId: q._id,
    });
  }
  return shape(q, user._id);
}

export { isEventManager, getEventOrThrow };
