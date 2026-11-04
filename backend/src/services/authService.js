import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { signAccessToken, verifyAccessToken } from '../utils/generateToken.js';
import { sendEmail } from './emailService.js';

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');
// Pre-computed hash used to equalise timing when the e-mail does not exist.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 4);

export const hashPassword = (plain) => bcrypt.hash(plain, env.BCRYPT_ROUNDS);

/** Verifies a JWT and returns the live, active user. Used by HTTP auth and Socket.IO handshake. */
export async function resolveUser(token) {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
  }
  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (!user.isActive) throw ApiError.forbidden(MESSAGES.ACCOUNT_DEACTIVATED);
  if ((user.tokenVersion || 0) !== payload.tv) throw ApiError.unauthorized('Token has been revoked');
  return { user, payload };
}

export async function register({ name, email, password, role, designation, company }) {
  const exists = await User.exists({ email });
  if (exists) throw ApiError.conflict(MESSAGES.EMAIL_EXISTS);
  const passwordHash = await hashPassword(password);
  try {
    const user = await User.create({ name, email, passwordHash, role, designation, company });
    return user;
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict(MESSAGES.EMAIL_EXISTS);
    throw err;
  }
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash +tokenVersion');
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !ok) throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
  if (!user.isActive) throw ApiError.forbidden(MESSAGES.ACCOUNT_DEACTIVATED);
  user.lastLoginAt = new Date();
  await user.save();
  return { user, token: signAccessToken(user), expiresIn: env.JWT_EXPIRES_IN };
}

/** Logout revokes every outstanding token of the user by bumping tokenVersion. */
export async function logout(userId) {
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash +tokenVersion');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Current password is incorrect');
  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion = (user.tokenVersion || 0) + 1; // invalidate old tokens
  await user.save();
  return { user, token: signAccessToken(user), expiresIn: env.JWT_EXPIRES_IN };
}

/** Always resolves quietly so callers cannot probe which e-mails are registered. */
export async function forgotPassword(email) {
  const user = await User.findOne({ email, isActive: true });
  if (!user) return;
  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = hashToken(token);
  user.passwordResetExpires = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000);
  await user.save();
  const link = `${env.CLIENT_URLS[0]}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your EventSphere password',
    text: `Hi ${user.name},\n\nUse the link below to reset your password (valid for ${env.PASSWORD_RESET_EXPIRES_MINUTES} minutes):\n${link}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Hi ${user.name},</p><p><a href="${link}">Reset your password</a> (valid for ${env.PASSWORD_RESET_EXPIRES_MINUTES} minutes).</p><p>If you did not request this, ignore this email.</p>`,
  });
}

export async function resetPassword({ token, newPassword }) {
  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires +tokenVersion');
  if (!user) throw ApiError.badRequest('Reset token is invalid or has expired');
  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
}
