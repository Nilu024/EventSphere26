import { ApiError } from '../utils/ApiError.js';

/**
 * validate({ params, query, body }) - each value is a Joi object schema.
 * Unknown keys are stripped (mass-assignment protection) and validated values replace the originals.
 */
export const validate = (schemas) => (req, _res, next) => {
  const errors = [];
  for (const key of ['params', 'query', 'body']) {
    const schema = schemas[key];
    if (!schema) continue;
    const { value, error } = schema.validate(req[key] ?? {}, { abortEarly: false, stripUnknown: true, convert: true });
    if (error) {
      errors.push(...error.details.map((d) => ({ field: d.path.join('.') || key, location: key, message: d.message.replace(/"/g, '') })));
    } else {
      req[key] = value;
    }
  }
  if (errors.length) return next(ApiError.unprocessable('Validation failed', errors));
  return next();
};
