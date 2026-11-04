import Joi from 'joi';

export const objectId = Joi.string().hex().length(24);
export const idParam = Joi.object({ id: objectId.required() });
export const eventIdParam = Joi.object({ eventId: objectId.required() });
export const userIdParam = Joi.object({ userId: objectId.required() });
export const paginationFields = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};
export const paginationQuery = Joi.object(paginationFields);
