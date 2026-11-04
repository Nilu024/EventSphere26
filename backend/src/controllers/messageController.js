import * as svc from '../services/messageService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const history = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.getConversation(req.user._id, req.params.userId, req.query);
  ApiResponse.ok(res, 'Conversation retrieved', items, meta);
});
export const send = asyncHandler(async (req, res) =>
  ApiResponse.created(res, 'Message sent', await svc.sendMessage(req.user._id, req.body.receiverId, req.body.content)));
