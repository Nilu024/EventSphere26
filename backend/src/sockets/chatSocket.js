import { onEvent } from './socketUtils.js';
import { sendMessageSchema } from '../validators/messageValidator.js';
import * as messageService from '../services/messageService.js';

/** Events: client -> `message:send` {receiverId, content}; server -> `message:receive`, `message:sent`, `message:error`. */
export function registerChatHandlers(_io, socket) {
  const userId = socket.data.user.id; // always from the verified token, never from the payload
  onEvent(socket, 'message:send', { schema: sendMessageSchema, max: 20, windowMs: 10000, errorEvent: 'message:error' }, async ({ receiverId, content }) => {
    const message = await messageService.sendMessage(userId, receiverId, content);
    return message.toJSON();
  });
}
