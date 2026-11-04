import mongoose from 'mongoose';
import { ALL_ROLES, ROLES } from '../constants/roles.js';
import { applyJSON } from '../utils/modelHelpers.js';

const link = { type: String, trim: true, maxlength: 300 };
const socialLinksSchema = new mongoose.Schema({ linkedin: link, github: link, twitter: link, website: link }, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ALL_ROLES, default: ROLES.PARTICIPANT },
    profileImage: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 1000 },
    designation: { type: String, trim: true, maxlength: 100 },
    company: { type: String, trim: true, maxlength: 100 },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    experience: { type: String, trim: true, maxlength: 1000 },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    // Incrementing this invalidates every previously issued JWT (logout, password change, deactivation).
    tokenVersion: { type: Number, default: 0, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ interests: 1 });

applyJSON(userSchema, ['passwordHash', 'tokenVersion', 'passwordResetToken', 'passwordResetExpires']);

export const User = mongoose.model('User', userSchema);
