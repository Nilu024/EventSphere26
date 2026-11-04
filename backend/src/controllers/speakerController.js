import * as svc from '../services/sessionService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listSpeakers = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Speakers retrieved', await svc.listSpeakers(req.user, req.params.eventId)));
export const createSpeaker = asyncHandler(async (req, res) => ApiResponse.created(res, 'Speaker added', await svc.createSpeaker(req.user, req.params.eventId, req.body)));
export const updateSpeaker = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Speaker updated', await svc.updateSpeaker(req.user, req.params.id, req.body)));
export const deleteSpeaker = asyncHandler(async (req, res) => {
  await svc.deleteSpeaker(req.user, req.params.id);
  ApiResponse.ok(res, 'Speaker removed');
});
export const uploadSpeakerImage = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Speaker image updated', await svc.updateSpeakerImage(req.user, req.params.id, req.file)));
