import { Router } from 'express';
import * as c from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { idParam } from '../validators/commonValidator.js';
import { listNotificationsQuery } from '../validators/messageValidator.js';

const router = Router();
router.use(authenticate);
router.get('/', validate({ query: listNotificationsQuery }), c.list);
router.patch('/read-all', c.markAllRead);
router.patch('/:id/read', validate({ params: idParam }), c.markRead);
export default router;
