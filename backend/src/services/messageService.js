import { Message } from '../models/Message.js';
import { Connection } from '../models/Connection.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { CONNECTION_STATUS as S, NOTIFICATION_TYPE } from '../constants/enums.js';
import { emitToUser } from '../utils/socketHub.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { notify } from './notificationService.js';

/** Returns the accepted connection between two users or throws 403. This is the single gate for all private chat access. */
export async function requireAcceptedConnection(a, b) {
  if (String(a) === String(b)) throw ApiError.badRequest('You cannot message yourself');
  const conn = await Connection.findOne({ pairKey: Connection.pairKey(a, b), status: S.ACCEPTED });
  if (!conn) throw ApiError.forbidden(MESSAGES.NOT_CONNECTED);
  return conn;
}

/** Persists a message, then delivers it in real time (`message:receive` to the receiver, `message:sent` to the sender's devices). */
export async function sendMessage(senderId, receiverId, content) {
  const connection = await requireAcceptedConnection(senderId, receiverId);
  const receiver = await User.exists({ _id: receiverId, isActive: true });
  if (!receiver) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);

  const message = await Message.create({ sender: senderId, receiver: receiverId, connection: connection._id, content });
  const payload = message.toJSON();
  emitToUser(receiverId, 'message:receive', payload);
  emitToUser(senderId, 'message:sent', payload);

  // One unread "new message" notification per conversation (avoids notification spam).
  const hasUnread = await Notification.exists({ recipient: receiverId, type: NOTIFICATION_TYPE.NEW_MESSAGE, relatedEntityId: connection._id, isRead: false });
  if (!hasUnread) {
    const sender = await User.findById(senderId).select('name');
    await notify({
      recipient: receiverId, type: NOTIFICATION_TYPE.NEW_MESSAGE, title: 'New message',
      message: `${sender.name} sent you a message`, relatedEntityId: connection._id,
    });
  }
  return message;
}

/** Newest-first page of the conversation between `userId` and `otherId`. */
export async function getConversation(userId, otherId, query) {
  const connection = await requireAcceptedConnection(userId, otherId);
  const { page, limit, skip } = getPagination(query);
  const filter = { connection: connection._id };
  const [items, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Message.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}
