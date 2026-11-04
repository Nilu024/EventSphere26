import * as svc from '../services/registrationService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => ApiResponse.created(res, 'Registered successfully', await svc.register(req.user, req.params.eventId)));
export const cancel = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Registration cancelled', await svc.cancel(req.user, req.params.eventId)));
export const listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.listMine(req.user, req.query);
  ApiResponse.ok(res, 'Registrations retrieved', items, meta);
});
export const listForEvent = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.listForEvent(req.user, req.params.eventId, req.query);
  ApiResponse.ok(res, 'Event registrations retrieved', items, meta);
});
