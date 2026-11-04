import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { MESSAGES } from '../constants/messages.js';
import { ROLES } from '../constants/roles.js';
import { escapeRegex, normalizeList } from '../utils/normalize.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { isBlockedBetween } from './connectionService.js';
import { uploadImage } from './uploadService.js';

export const PUBLIC_FIELDS = 'name role profileImage bio designation company skills interests experience socialLinks';

export async function updateProfile(userId, data) {
  const user = await User.findById(userId);
  // Only whitelisted profile fields reach here (Joi strips everything else, incl. role/email/isActive).
  if (data.skills) data.skills = normalizeList(data.skills);
  if (data.interests) data.interests = normalizeList(data.interests);
  const { socialLinks, ...rest } = data;
  user.set(rest);
  if (socialLinks) Object.entries(socialLinks).forEach(([k, v]) => user.set(`socialLinks.${k}`, v));
  await user.save();
  return user;
}

export async function updateAvatar(userId, file) {
  const url = await uploadImage(file.buffer, 'avatars');
  return User.findByIdAndUpdate(userId, { profileImage: url }, { new: true });
}

/** Public profile: e-mail is never exposed. Inactive accounts and blocked pairs are indistinguishable from "not found". */
export async function getPublicProfile(viewer, id) {
  const target = await User.findById(id).select(`${PUBLIC_FIELDS} isActive`);
  if (!target) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
  const isSelf = viewer._id.equals(target._id);
  if (!isSelf && viewer.role !== ROLES.ADMIN) {
    if (!target.isActive) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    if (await isBlockedBetween(viewer._id, target._id)) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
  }
  return target;
}

export async function listUsers(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { company: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function setStatus(adminUser, id, isActive) {
  if (adminUser._id.equals(id)) throw ApiError.badRequest('You cannot change your own account status');
  const update = { isActive };
  const op = isActive ? { $set: update } : { $set: update, $inc: { tokenVersion: 1 } }; // deactivation revokes tokens
  const user = await User.findByIdAndUpdate(id, op, { new: true });
  if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
  return user;
}

export async function setRole(adminUser, id, role) {
  if (adminUser._id.equals(id)) throw ApiError.badRequest('You cannot change your own role');
  const user = await User.findByIdAndUpdate(id, { $set: { role }, $inc: { tokenVersion: 1 } }, { new: true });
  if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
  return user;
}
