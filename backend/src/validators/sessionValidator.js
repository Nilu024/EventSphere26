import Joi from 'joi';
import { SESSION_STATUSES } from '../constants/enums.js';
import { objectId } from './commonValidator.js';
import { normalizeList } from '../utils/normalize.js';

const url = Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(500).allow('');

export const createSessionSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  description: Joi.string().trim().max(3000).allow(''),
  speaker: objectId.allow(null),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
  meetingLink: url,
  status: Joi.string().valid(...SESSION_STATUSES),
});

export const updateSessionSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150),
  description: Joi.string().trim().max(3000).allow(''),
  speaker: objectId.allow(null),
  startTime: Joi.date().iso(),
  endTime: Joi.date().iso(),
  meetingLink: url,
  status: Joi.string().valid(...SESSION_STATUSES),
}).min(1);

const socialUrl = Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(300).allow('');
const speakerFields = {
  user: objectId.allow(null),
  name: Joi.string().trim().min(2).max(100),
  designation: Joi.string().trim().max(100).allow(''),
  organization: Joi.string().trim().max(100).allow(''),
  biography: Joi.string().trim().max(3000).allow(''),
  expertise: Joi.array().items(Joi.string().trim().max(50)).max(30).custom((v) => normalizeList(v)),
  socialLinks: Joi.object({ linkedin: socialUrl, github: socialUrl, twitter: socialUrl, website: socialUrl }),
};
export const createSpeakerSchema = Joi.object({ ...speakerFields, name: speakerFields.name.required() });
export const updateSpeakerSchema = Joi.object(speakerFields).min(1);
