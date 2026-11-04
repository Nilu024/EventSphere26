import { Router } from 'express';
import * as c from '../controllers/networkingController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { idParam } from '../validators/commonValidator.js';
import { joinQueueSchema, historyQuery } from '../validators/networkingValidator.js';

const router = Router();
router.use(authenticate, authorize(ROLES.PARTICIPANT));
router.post('/queue/join', validate({ body: joinQueueSchema }), c.joinQueue);
router.post('/queue/leave', c.leaveQueue);
router.get('/sessions/active', c.activeSession);
router.get('/sessions/history', validate({ query: historyQuery }), c.history);
router.get('/sessions/:id', validate({ params: idParam }), c.sessionRoom);
router.post('/sessions/:id/end', validate({ params: idParam }), c.endSession);
export default router;
