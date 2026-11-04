import { Server } from 'socket.io';
import { isOriginAllowed } from '../config/cors.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { resolveUser } from '../services/authService.js';
import { setIO, userRoom } from '../utils/socketHub.js';
import * as networkingService from '../services/networkingService.js';
import { registerChatHandlers } from './chatSocket.js';
import { registerNotificationHandlers } from './notificationSocket.js';
import { registerQuestionHandlers } from './questionSocket.js';
import { registerNetworkingHandlers } from './networkingSocket.js';

function tokenFromHandshake(socket) {
  const auth = socket.handshake.auth?.token;
  if (auth) return String(auth).replace(/^Bearer\s+/i, '');
  const header = socket.handshake.headers?.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const cookies = socket.handshake.headers?.cookie || '';
  const match = cookies.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${env.COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: (origin, cb) => cb(null, isOriginAllowed(origin)), credentials: true },
    maxHttpBufferSize: 1e5,
  });
  setIO(io);

  // Every connection must carry a valid, non-revoked JWT for an active account.
  io.use(async (socket, next) => {
    try {
      const token = tokenFromHandshake(socket);
      if (!token) return next(new Error('AUTH_REQUIRED'));
      const { user, payload } = await resolveUser(token);
      socket.data.user = { id: user._id.toString(), role: user.role, name: user.name };
      socket.data.expiresAt = payload.exp * 1000;
      return next();
    } catch (err) {
      return next(new Error(err.statusCode ? err.message : 'AUTH_FAILED'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId } = socket.data.user;
    socket.join(userRoom(userId)); // private room: only this user's sockets
    networkingService.handleUserConnect(userId);

    registerChatHandlers(io, socket);
    registerNotificationHandlers(io, socket);
    registerQuestionHandlers(io, socket);
    registerNetworkingHandlers(io, socket);

    socket.emit('connected', { userId, serverTime: new Date() });

    socket.on('disconnect', async () => {
      try {
        const remaining = await io.in(userRoom(userId)).fetchSockets();
        if (remaining.length === 0) networkingService.handleUserDisconnect(userId);
      } catch (err) {
        logger.error(`disconnect handler failed: ${err.message}`);
      }
    });
  });
  return io;
}
