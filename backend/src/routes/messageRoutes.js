import { Router } from 'express';
import * as c from '../controllers/messageController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { writeLimiter } from '../middlewares/rateLimitMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { userIdParam } from '../validators/commonValidator.js';
import { sendMessageSchema, historyQuery } from '../validators/messageValidator.js';

const router = Router();
router.use(authenticate, authorize(ROLES.PARTICIPANT));
router.post('/', writeLimiter, validate({ body: sendMessageSchema }), c.send);
router.get('/:userId', validate({ params: userIdParam, query: historyQuery }), c.history);
export default router;
