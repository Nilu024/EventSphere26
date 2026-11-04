import { Router } from 'express';
import * as c from '../controllers/registrationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { eventIdParam } from '../validators/commonValidator.js';
import { listRegistrationsQuery } from '../validators/eventValidator.js';

const router = Router();
router.use(authenticate);
router.post('/events/:eventId/register', authorize(ROLES.PARTICIPANT), validate({ params: eventIdParam }), c.register);
router.delete('/events/:eventId/register', authorize(ROLES.PARTICIPANT), validate({ params: eventIdParam }), c.cancel);
router.get('/registrations/me', authorize(ROLES.PARTICIPANT), validate({ query: listRegistrationsQuery }), c.listMine);
router.get('/events/:eventId/registrations', authorize(ROLES.ORGANIZER, ROLES.ADMIN), validate({ params: eventIdParam, query: listRegistrationsQuery }), c.listForEvent);
export default router;
