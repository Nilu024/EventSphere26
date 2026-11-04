import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { Attendance } from '../models/Attendance.js';
import { Question } from '../models/Question.js';
import { NetworkingSession } from '../models/NetworkingSession.js';
import { Connection } from '../models/Connection.js';
import { Message } from '../models/Message.js';
import { ACTIVE_REGISTRATION_STATUSES, NETWORKING_STATUS } from '../constants/enums.js';
import { attendancePercentage, round2 } from '../utils/similarity.js';
import { assertEventManager } from './accessService.js';

const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));

export async function getEventAnalytics(user, eventId) {
  const event = await assertEventManager(eventId, user); // organizer ownership or admin
  const e = new mongoose.Types.ObjectId(String(event._id));

  const [regByStatus, attended, qAgg, topQuestion, nsByStatus, nsUnique] = await Promise.all([
    EventRegistration.aggregate([{ $match: { event: e } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Attendance.countDocuments({ event: e }),
    Question.aggregate([
      { $match: { event: e } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        visible: { $sum: { $cond: [{ $and: ['$isApproved', { $not: ['$isHidden'] }] }, 1, 0] } },
        pinned: { $sum: { $cond: ['$isPinned', 1, 0] } },
        upvotes: { $sum: { $size: '$upvotes' } },
        askers: { $addToSet: '$askedBy' },
        voters: { $push: '$upvotes' },
      } },
      { $project: {
        total: 1, visible: 1, pinned: 1, upvotes: 1,
        uniqueAskers: { $size: '$askers' },
        uniqueVoters: { $size: { $reduce: { input: '$voters', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } } },
      } },
    ]),
    Question.aggregate([
      { $match: { event: e, isApproved: true, isHidden: false } },
      { $addFields: { voteCount: { $size: '$upvotes' } } },
      { $sort: { voteCount: -1, createdAt: 1 } },
      { $limit: 1 },
      { $project: { questionText: 1, voteCount: 1 } },
    ]),
    NetworkingSession.aggregate([{ $match: { event: e } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    NetworkingSession.aggregate([
      { $match: { event: e, status: NETWORKING_STATUS.COMPLETED } },
      { $unwind: '$participants' },
      { $group: { _id: '$participants' } },
      { $count: 'count' },
    ]),
  ]);

  const reg = toMap(regByStatus);
  const totalRegistrations = ACTIVE_REGISTRATION_STATUSES.reduce((sum, s) => sum + (reg[s] || 0), 0);
  const q = qAgg[0] || { total: 0, visible: 0, pinned: 0, upvotes: 0, uniqueAskers: 0, uniqueVoters: 0 };
  const ns = toMap(nsByStatus);
  const completedSessions = ns[NETWORKING_STATUS.COMPLETED] || 0;

  return {
    eventId: String(event._id),
    title: event.title,
    registrations: {
      total: totalRegistrations,
      cancelled: reg.cancelled || 0,
      capacity: event.capacity,
      fillRate: event.capacity ? round2((totalRegistrations / event.capacity) * 100) : 0,
    },
    attendance: {
      totalAttendees: attended,
      attendancePercentage: attendancePercentage(attended, totalRegistrations), // 0 when nobody registered
    },
    questions: {
      total: q.total, visible: q.visible, pinned: q.pinned,
      totalUpvotes: q.upvotes,
      averageUpvotesPerQuestion: q.total ? round2(q.upvotes / q.total) : 0,
      uniqueAskers: q.uniqueAskers, uniqueVoters: q.uniqueVoters,
      topQuestion: topQuestion[0] ? { id: topQuestion[0]._id, questionText: topQuestion[0].questionText, voteCount: topQuestion[0].voteCount } : null,
    },
    networking: {
      completedSessions,
      cancelledSessions: ns[NETWORKING_STATUS.CANCELLED] || 0,
      uniqueParticipants: nsUnique[0]?.count || 0,
    },
    engagement: {
      questionsPerAttendee: attended ? round2(q.total / attended) : 0,
      networkingParticipationRate: attended ? round2(((nsUnique[0]?.count || 0) / attended) * 100) : 0,
    },
  };
}

export async function getPlatformAnalytics() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [users, activeUsers, newUsers, events, regs, attendees, qAgg, nsAgg, conns, messages, topEvents] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: since } }),
    Event.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    EventRegistration.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Attendance.countDocuments(),
    Question.aggregate([{ $group: { _id: null, total: { $sum: 1 }, upvotes: { $sum: { $size: '$upvotes' } } } }]),
    NetworkingSession.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Connection.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Message.countDocuments(),
    Event.find().sort({ registeredCount: -1 }).limit(5).select('title status registeredCount capacity startDate'),
  ]);
  const regMap = toMap(regs);
  const totalRegistrations = ACTIVE_REGISTRATION_STATUSES.reduce((s, k) => s + (regMap[k] || 0), 0);
  const q = qAgg[0] || { total: 0, upvotes: 0 };
  const nsMap = toMap(nsAgg);

  return {
    users: { byRole: toMap(users), total: Object.values(toMap(users)).reduce((a, b) => a + b, 0), active: activeUsers, newLast30Days: newUsers },
    events: { byStatus: toMap(events), total: Object.values(toMap(events)).reduce((a, b) => a + b, 0) },
    registrations: { total: totalRegistrations, cancelled: regMap.cancelled || 0 },
    attendance: { totalAttendees: attendees, attendancePercentage: attendancePercentage(attendees, totalRegistrations) },
    questions: { total: q.total, totalUpvotes: q.upvotes },
    networking: { completedSessions: nsMap.completed || 0, cancelledSessions: nsMap.cancelled || 0 },
    connections: toMap(conns),
    messages: { total: messages },
    topEventsByRegistrations: topEvents,
  };
}
