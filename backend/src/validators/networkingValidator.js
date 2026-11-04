import Joi from 'joi';
import { CONNECTION_STATUSES } from '../constants/enums.js';
import { objectId, paginationFields } from './commonValidator.js';

export const recommendationsQuery = Joi.object({ eventId: objectId });
export const recommendationDetailQuery = Joi.object({ eventId: objectId });

export const requestsQuery = Joi.object({ direction: Joi.string().valid('incoming', 'outgoing', 'all').default('all') });
export const listConnectionsQuery = Joi.object({ ...paginationFields });
export const connectionStatusEnum = CONNECTION_STATUSES;

export const joinQueueSchema = Joi.object({ eventId: objectId.required() });
export const historyQuery = Joi.object({ ...paginationFields });
