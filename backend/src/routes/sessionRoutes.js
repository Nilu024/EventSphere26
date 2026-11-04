import { Router } from 'express';
import * as c from '../controllers/sessionController.js';
import { authenticate, optionalAuth } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { idParam, eventIdParam } from '../validators/commonValidator.js';
import { createSessionSchema, updateSessionSchema } from '../validators/sessionValidator.js';

const router = Router();
const manage = [authenticate, authorize(ROLES.ORGANIZER, ROLES.ADMIN)];

router.get('/events/:eventId/sessions', optionalAuth, validate({ params: eventIdParam }), c.listSessions);
router.post('/events/:eventId/sessions', ...manage, validate({ params: eventIdParam, body: createSessionSchema }), c.createSession);
router.patch('/sessions/:id', ...manage, validate({ params: idParam, body: updateSessionSchema }), c.updateSession);
router.delete('/sessions/:id', ...manage, validate({ params: idParam }), c.deleteSession);
export default router;
