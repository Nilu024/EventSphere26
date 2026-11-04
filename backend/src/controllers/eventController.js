import * as eventService from '../services/eventService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.user, req.body);
  ApiResponse.created(res, 'Event created successfully', event);
});
export const listEvents = asyncHandler(async (req, res) => {
  const { items, meta } = await eventService.listEvents(req.user, req.query);
  ApiResponse.ok(res, 'Events retrieved', items, meta);
});
export const getEvent = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Event retrieved', await eventService.getEvent(req.user, req.params.id)));
export const updateEvent = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Event updated', await eventService.updateEvent(req.user, req.params.id, req.body)));
export const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.user, req.params.id);
  ApiResponse.ok(res, 'Event deleted');
});
export const publishEvent = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Event published', await eventService.publishEvent(req.user, req.params.id)));
export const cancelEvent = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Event cancelled', await eventService.cancelEvent(req.user, req.params.id)));
export const completeEvent = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Event marked as completed', await eventService.completeEvent(req.user, req.params.id)));
export const uploadBanner = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Banner updated', await eventService.updateBanner(req.user, req.params.id, req.file)));
