import Joi from 'joi';
import { objectId, paginationFields } from './commonValidator.js';

export const sendMessageSchema = Joi.object({
  receiverId: objectId.required(),
  content: Joi.string().trim().min(1).max(2000).required(),
});
export const historyQuery = Joi.object({ ...paginationFields, limit: Joi.number().integer().min(1).max(100).default(30) });
export const listNotificationsQuery = Joi.object({
  ...paginationFields,
  isRead: Joi.boolean(),
});
