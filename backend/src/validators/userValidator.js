import Joi from 'joi';
import { ALL_ROLES } from '../constants/roles.js';
import { normalizeList } from '../utils/normalize.js';
import { paginationFields } from './commonValidator.js';

const termList = Joi.array().items(Joi.string().trim().min(1).max(50)).max(30).custom((v) => normalizeList(v));
const url = Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(300).allow('');

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  bio: Joi.string().trim().max(1000).allow(''),
  designation: Joi.string().trim().max(100).allow(''),
  company: Joi.string().trim().max(100).allow(''),
  experience: Joi.string().trim().max(1000).allow(''),
  skills: termList,
  interests: termList,
  socialLinks: Joi.object({ linkedin: url, github: url, twitter: url, website: url }),
}).min(1);

export const listUsersQuery = Joi.object({
  ...paginationFields,
  role: Joi.string().valid(...ALL_ROLES),
  isActive: Joi.boolean(),
  search: Joi.string().trim().max(100),
});

export const updateStatusSchema = Joi.object({ isActive: Joi.boolean().required() });
export const updateRoleSchema = Joi.object({ role: Joi.string().valid(...ALL_ROLES).required() });
