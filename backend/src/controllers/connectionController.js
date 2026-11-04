import * as svc from '../services/connectionService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const sendRequest = asyncHandler(async (req, res) => ApiResponse.created(res, 'Connection request sent', await svc.sendRequest(req.user._id, req.params.userId)));
export const accept = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Connection accepted', await svc.acceptRequest(req.params.id, req.user._id)));
export const reject = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Connection rejected', await svc.rejectRequest(req.params.id, req.user._id)));
export const cancel = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Connection request cancelled', await svc.cancelRequest(req.params.id, req.user._id)));
export const remove = asyncHandler(async (req, res) => {
  await svc.removeConnection(req.params.id, req.user._id);
  ApiResponse.ok(res, 'Connection removed');
});
export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.listAccepted(req.user._id, req.query);
  ApiResponse.ok(res, 'Connections retrieved', items, meta);
});
export const requests = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Requests retrieved', await svc.listRequests(req.user._id, req.query.direction)));
export const block = asyncHandler(async (req, res) => {
  await svc.blockUser(req.user._id, req.params.userId);
  ApiResponse.ok(res, 'User blocked');
});
export const unblock = asyncHandler(async (req, res) => {
  await svc.unblockUser(req.user._id, req.params.userId);
  ApiResponse.ok(res, 'User unblocked');
});
export const listBlocked = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Blocked users retrieved', await svc.listBlocked(req.user._id)));
