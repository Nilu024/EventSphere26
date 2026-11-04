import * as svc from '../services/sessionService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listSessions = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Sessions retrieved', await svc.listSessions(req.user, req.params.eventId)));
export const createSession = asyncHandler(async (req, res) => ApiResponse.created(res, 'Session created', await svc.createSession(req.user, req.params.eventId, req.body)));
export const updateSession = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Session updated', await svc.updateSession(req.user, req.params.id, req.body)));
export const deleteSession = asyncHandler(async (req, res) => {
  await svc.deleteSession(req.user, req.params.id);
  ApiResponse.ok(res, 'Session deleted');
});
