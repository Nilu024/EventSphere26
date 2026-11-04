import * as svc from '../services/analyticsService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const eventAnalytics = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Event analytics retrieved', await svc.getEventAnalytics(req.user, req.params.eventId)));
export const platformAnalytics = asyncHandler(async (_req, res) => ApiResponse.ok(res, 'Platform analytics retrieved', await svc.getPlatformAnalytics()));
