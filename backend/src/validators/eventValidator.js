import Joi from 'joi';
import { EVENT_CATEGORIES, EVENT_STATUSES, REGISTRATION_STATUSES, ATTENDANCE_STATUSES } from '../constants/enums.js';
import { objectId, paginationFields } from './commonValidator.js';

const timezone = Joi.string().max(64).custom((v, helpers) => {
  try { new Intl.DateTimeFormat('en-US', { timeZone: v }); return v; } catch { return helpers.error('any.invalid'); }
}).messages({ 'any.invalid': 'Invalid IANA timezone' });

export const createEventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  description: Joi.string().trim().min(10).max(5000).required(),
  category: Joi.string().valid(...EVENT_CATEGORIES).required(),
  startDate: Joi.date().iso().greater('now').required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  timezone: timezone.default('UTC'),
  mode: Joi.string().valid('virtual').default('virtual'),
  meetingLink: Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(500).allow(''),
  capacity: Joi.number().integer().min(1).max(100000).default(100),
  registrationDeadline: Joi.date().iso().max(Joi.ref('endDate')),
});

// Cross-field checks against the stored event happen in eventService.updateEvent.
export const updateEventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150),
  description: Joi.string().trim().min(10).max(5000),
  category: Joi.string().valid(...EVENT_CATEGORIES),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  timezone,
  meetingLink: Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(500).allow(''),
  capacity: Joi.number().integer().min(1).max(100000),
  registrationDeadline: Joi.date().iso().allow(null),
}).min(1);

export const listEventsQuery = Joi.object({
  ...paginationFields,
  search: Joi.string().trim().max(100),
  category: Joi.string().valid(...EVENT_CATEGORIES),
  status: Joi.string().valid(...EVENT_STATUSES),
  organizer: objectId,
  mine: Joi.boolean(),
  upcoming: Joi.boolean(),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  sortBy: Joi.string().valid('startDate', 'createdAt', 'title', 'registeredCount').default('startDate'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
});

export const listRegistrationsQuery = Joi.object({
  ...paginationFields,
  status: Joi.string().valid(...REGISTRATION_STATUSES),
});

export const markAttendanceSchema = Joi.object({ participantId: objectId.required() });
export const listAttendanceQuery = Joi.object({
  ...paginationFields,
  status: Joi.string().valid(...ATTENDANCE_STATUSES),
});
