import { Router } from 'express';
import * as c from '../controllers/questionController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { writeLimiter } from '../middlewares/rateLimitMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { idParam, eventIdParam } from '../validators/commonValidator.js';
import { submitQuestionSchema, listQuestionsQuery, moderateQuestionSchema } from '../validators/questionValidator.js';

const router = Router();
router.use(authenticate);
router.get('/events/:eventId/questions', validate({ params: eventIdParam, query: listQuestionsQuery }), c.list);
router.post('/events/:eventId/questions', writeLimiter, validate({ params: eventIdParam, body: submitQuestionSchema }), c.submit);
router.post('/questions/:id/upvote', writeLimiter, validate({ params: idParam }), c.upvote);
router.delete('/questions/:id/upvote', writeLimiter, validate({ params: idParam }), c.removeUpvote);
router.patch('/questions/:id/moderate', authorize(ROLES.ORGANIZER, ROLES.ADMIN), validate({ params: idParam, body: moderateQuestionSchema }), c.moderate);
export default router;
