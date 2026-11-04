import Joi from 'joi';
import { onEvent } from './socketUtils.js';
import { objectId } from '../validators/commonValidator.js';
import * as notificationService from '../services/notificationService.js';

/** Server pushes `notification:new`. Client may emit `notification:read` {notificationId} or `notification:read-all`. */
export function registerNotificationHandlers(_io, socket) {
  const userId = socket.data.user.id;
  onEvent(socket, 'notification:read', { schema: Joi.object({ notificationId: objectId.required() }) }, async ({ notificationId }) => {
    const n = await notificationService.markRead(userId, notificationId);
    socket.to(`user:${userId}`).emit('notification:read', { notificationId });
    return n.toJSON();
  });
  onEvent(socket, 'notification:read-all', {}, async () => notificationService.markAllRead(userId));
}
