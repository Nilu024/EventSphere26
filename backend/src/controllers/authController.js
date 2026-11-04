import * as authService from '../services/authService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authCookieOptions } from '../utils/generateToken.js';
import { env } from '../config/env.js';

const setCookie = (res, token) => res.cookie(env.COOKIE_NAME, token, authCookieOptions());

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  ApiResponse.created(res, 'Registration successful', { user });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token, expiresIn } = await authService.login(req.body);
  setCookie(res, token);
  ApiResponse.ok(res, 'Login successful', { user, token, expiresIn });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie(env.COOKIE_NAME, { ...authCookieOptions(), maxAge: undefined });
  ApiResponse.ok(res, 'Logged out. All active tokens for this account were revoked.');
});

export const me = asyncHandler(async (req, res) => ApiResponse.ok(res, 'Current user', { user: req.user }));

export const changePassword = asyncHandler(async (req, res) => {
  const { user, token, expiresIn } = await authService.changePassword(req.user._id, req.body);
  setCookie(res, token);
  ApiResponse.ok(res, 'Password changed. Other sessions were signed out.', { user, token, expiresIn });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  ApiResponse.ok(res, 'If an account with that email exists, a reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  ApiResponse.ok(res, 'Password has been reset. You can now log in.');
});
