import * as svc from '../services/questionService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.listQuestions(req.user, req.params.eventId, req.query);
  ApiResponse.ok(res, 'Questions retrieved', items, meta);
});
export const submit = asyncHandler(async (req, res) => ApiResponse.created(res, 'Question submitted', await svc.submitQuestion(req.user, req.params.eventId, req.body)));
export const upvote = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Question upvoted', await svc.upvote(req.user, req.params.id)));
export const removeUpvote = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Upvote removed', await svc.removeUpvote(req.user, req.params.id)));
export const moderate = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Question moderated', await svc.moderate(req.user, req.params.id, req.body.action)));
