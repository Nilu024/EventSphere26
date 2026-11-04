import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { emitToUser } from '../utils/socketHub.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { logger } from '../config/logger.js';

/** Persists a notification and pushes it in real time (`notification:new`). Never throws: notifications must not break business flows. */
export async function notify({ recipient, type, title, message, relatedEntityId }) {
  try {
    const n = await Notification.create({ recipient, type, title, message, relatedEntityId });
    emitToUser(recipient, 'notification:new', n.toJSON());
    return n;
  } catch (err) {
    logger.error(`notify failed: ${err.message}`);
    return null;
  }
}

export async function notifyMany(recipients, payload) {
  const unique = [...new Set(recipients.map(String))];
  if (!unique.length) return [];
  try {
    const docs = await Notification.insertMany(unique.map((recipient) => ({ ...payload, recipient })));
    docs.forEach((d) => emitToUser(d.recipient, 'notification:new', d.toJSON()));
    return docs;
  } catch (err) {
    logger.error(`notifyMany failed: ${err.message}`);
    return [];
  }
}

export async function listNotifications(userId, query) {
  const { page, limit, skip } = getPagination(query);
  const filter = { recipient: userId };
  if (query.isRead !== undefined) filter.isRead = query.isRead;
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);
  return { items, meta: { ...paginationMeta(total, page, limit), unreadCount } };
}

export async function markRead(userId, id) {
  const n = await Notification.findOneAndUpdate({ _id: id, recipient: userId }, { isRead: true }, { new: true });
  if (!n) throw ApiError.notFound('Notification not found');
  return n;
}

export async function markAllRead(userId) {
  const res = await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  return { modified: res.modifiedCount };
}
