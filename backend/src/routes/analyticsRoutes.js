import { Router } from 'express';
import * as c from '../controllers/analyticsController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { eventIdParam } from '../validators/commonValidator.js';

const router = Router();
router.use(authenticate);
router.get('/events/:eventId', authorize(ROLES.ORGANIZER, ROLES.ADMIN), validate({ params: eventIdParam }), c.eventAnalytics);
router.get('/platform', authorize(ROLES.ADMIN), c.platformAnalytics);
export default router;
