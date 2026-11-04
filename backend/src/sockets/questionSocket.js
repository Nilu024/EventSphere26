import Joi from 'joi';
import { onEvent } from './socketUtils.js';
import { objectId } from '../validators/commonValidator.js';
import { submitQuestionSchema } from '../validators/questionValidator.js';
import { User } from '../models/User.js';
import * as questionService from '../services/questionService.js';
import { assertEventMember } from '../services/accessService.js';
import { eventRoom } from '../utils/socketHub.js';

const eventOnly = Joi.object({ eventId: objectId.required() });

/**
 * Client -> `question:join` {eventId} (authorised: registered participant, owning organizer or admin), `question:leave`,
 * `question:new` {eventId, questionText, sessionId?}, `question:upvote` {questionId, remove?}.
 * Server -> room `event:<id>`: `question:new`, `question:updated`, `question:moderated`.
 */
export function registerQuestionHandlers(_io, socket) {
  const getUser = () => User.findById(socket.data.user.id); // fresh role/status on every action

  onEvent(socket, 'question:join', { schema: eventOnly }, async ({ eventId }) => {
    await assertEventMember(eventId, await getUser());
    await socket.join(eventRoom(eventId));
    return { joined: eventRoom(eventId) };
  });
  onEvent(socket, 'question:leave', { schema: eventOnly }, async ({ eventId }) => {
    await socket.leave(eventRoom(eventId));
    return { left: eventRoom(eventId) };
  });
  onEvent(socket, 'question:new', { schema: Joi.object({ eventId: objectId.required() }).concat(submitQuestionSchema), max: 10 }, async ({ eventId, ...body }) =>
    questionService.submitQuestion(await getUser(), eventId, body));
  onEvent(socket, 'question:upvote', { schema: Joi.object({ questionId: objectId.required(), remove: Joi.boolean().default(false) }), max: 30 }, async ({ questionId, remove }) => {
    const user = await getUser();
    return remove ? questionService.removeUpvote(user, questionId) : questionService.upvote(user, questionId);
  });
}
