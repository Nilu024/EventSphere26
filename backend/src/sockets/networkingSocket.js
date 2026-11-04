import Joi from 'joi';
import { onEvent } from './socketUtils.js';
import { objectId } from '../validators/commonValidator.js';
import { User } from '../models/User.js';
import * as networkingService from '../services/networkingService.js';
import { networkingRoom } from '../utils/socketHub.js';

/**
 * Client -> `networking:queue:join` {eventId}, `networking:queue:leave`, `networking:session:join` {sessionId} (re-join room after
 * reconnect), `networking:session:end` {sessionId}.
 * Server -> `networking:matched`, `networking:session:start`, `networking:session:timer`, `networking:session:end`, `networking:queue:expired`.
 */
export function registerNetworkingHandlers(_io, socket) {
  const getUser = () => User.findById(socket.data.user.id);

  onEvent(socket, 'networking:queue:join', { schema: Joi.object({ eventId: objectId.required() }), max: 6, windowMs: 10000 }, async ({ eventId }) =>
    networkingService.joinQueue(await getUser(), eventId));
  onEvent(socket, 'networking:queue:leave', { max: 6 }, async () => networkingService.leaveQueue(socket.data.user.id));
  onEvent(socket, 'networking:session:join', { schema: Joi.object({ sessionId: objectId.required() }) }, async ({ sessionId }) => {
    const session = await networkingService.getSessionForParticipant(await getUser(), sessionId); // pair-only authorisation
    await socket.join(networkingRoom(sessionId));
    return session;
  });
  onEvent(socket, 'networking:session:end', { schema: Joi.object({ sessionId: objectId.required() }) }, async ({ sessionId }) => {
    const s = await networkingService.endSession(await getUser(), sessionId);
    return { sessionId: s.id, status: s.status, endReason: s.endReason };
  });
}
