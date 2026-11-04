import * as svc from '../services/notificationService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.listNotifications(req.user._id, req.query);
  ApiResponse.ok(res, 'Notifications retrieved', items, meta);
});
export const markRead = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Notification marked as read', await svc.markRead(req.user._id, req.params.id)));
export const markAllRead = asyncHandler(async (req, res) => ApiResponse.ok(res, 'All notifications marked as read', await svc.markAllRead(req.user._id)));
