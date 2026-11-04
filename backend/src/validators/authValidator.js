import Joi from 'joi';
import { SELF_REGISTER_ROLES } from '../constants/roles.js';

const passwordRule = Joi.string()
  .min(8)
  .max(72) // bcrypt only uses the first 72 bytes
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  .messages({ 'string.pattern.base': 'Password must contain an uppercase letter, a lowercase letter and a number' });

const email = Joi.string().trim().lowercase().email().max(254);

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: email.required(),
  password: passwordRule.required(),
  role: Joi.string().valid(...SELF_REGISTER_ROLES).default('participant'),
  designation: Joi.string().trim().max(100).allow(''),
  company: Joi.string().trim().max(100).allow(''),
});

export const loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().max(72).required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().max(72).required(),
  newPassword: passwordRule.invalid(Joi.ref('currentPassword')).required().messages({ 'any.invalid': 'New password must differ from the current password' }),
});

export const forgotPasswordSchema = Joi.object({ email: email.required() });

export const resetPasswordSchema = Joi.object({
  token: Joi.string().hex().length(64).required(),
  newPassword: passwordRule.required(),
});
