import Joi from 'joi';
import { QUESTION_ACTIONS } from '../constants/enums.js';
import { objectId, paginationFields } from './commonValidator.js';

export const submitQuestionSchema = Joi.object({
  questionText: Joi.string().trim().min(5).max(500).required(),
  sessionId: objectId.allow(null),
});

export const listQuestionsQuery = Joi.object({
  ...paginationFields,
  limit: Joi.number().integer().min(1).max(100).default(50),
  sessionId: objectId,
  includeHidden: Joi.boolean(), // honoured only for the event's organizer/admin
});

export const moderateQuestionSchema = Joi.object({ action: Joi.string().valid(...QUESTION_ACTIONS).required() });
