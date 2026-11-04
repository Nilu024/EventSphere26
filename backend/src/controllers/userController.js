import * as userService from '../services/userService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMe = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Profile retrieved', { user: req.user }));

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  ApiResponse.ok(res, 'Profile updated', { user });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await userService.updateAvatar(req.user._id, req.file);
  ApiResponse.ok(res, 'Profile image updated', { user });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getPublicProfile(req.user, req.params.id);
  ApiResponse.ok(res, 'User retrieved', { user });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await userService.listUsers(req.query);
  ApiResponse.ok(res, 'Users retrieved', items, meta);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const user = await userService.setStatus(req.user, req.params.id, req.body.isActive);
  ApiResponse.ok(res, `Account ${user.isActive ? 'activated' : 'deactivated'}`, { user });
});

export const updateRole = asyncHandler(async (req, res) => {
  const user = await userService.setRole(req.user, req.params.id, req.body.role);
  ApiResponse.ok(res, 'Role updated', { user });
});
