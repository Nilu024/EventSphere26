import * as svc from '../services/networkingService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const joinQueue = asyncHandler(async (req, res) => {
  const result = await svc.joinQueue(req.user, req.body.eventId);
  ApiResponse.ok(res, result.status === 'matched' ? 'Matched! Open the Jitsi room.' : 'You are in the queue', result);
});
export const leaveQueue = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Left the queue', await svc.leaveQueue(req.user._id)));
export const activeSession = asyncHandler(async (req, res) => {
  const session = await svc.getActiveSession(req.user);
  ApiResponse.ok(res, session ? 'Active session retrieved' : 'No active session', session);
});
export const sessionRoom = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Session retrieved', await svc.getSessionForParticipant(req.user, req.params.id)));
export const endSession = asyncHandler(async (req, res) => {
  const s = await svc.endSession(req.user, req.params.id);
  ApiResponse.ok(res, 'Session ended', { id: s.id, status: s.status, endReason: s.endReason });
});
export const history = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.getHistory(req.user, req.query);
  ApiResponse.ok(res, 'Session history retrieved', items, meta);
});
