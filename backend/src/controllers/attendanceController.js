import * as svc from '../services/attendanceService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const checkIn = asyncHandler(async (req, res) => ApiResponse.created(res, 'Checked in', await svc.checkIn(req.user, req.params.eventId)));
export const checkOut = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Checked out', await svc.checkOut(req.user, req.params.eventId)));
export const getMine = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Attendance retrieved', await svc.getMine(req.user, req.params.eventId)));
export const markAttendance = asyncHandler(async (req, res) =>
  ApiResponse.created(res, 'Attendance recorded', await svc.markAttendance(req.user, req.params.eventId, req.body.participantId)));
export const listForEvent = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.listForEvent(req.user, req.params.eventId, req.query);
  ApiResponse.ok(res, 'Attendance report retrieved', items, meta);
});
