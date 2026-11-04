import { Router } from 'express';
import * as c from '../controllers/matchController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { idParam } from '../validators/commonValidator.js';
import { recommendationsQuery, recommendationDetailQuery } from '../validators/networkingValidator.js';

const router = Router();
router.use(authenticate, authorize(ROLES.PARTICIPANT));
router.get('/recommendations', validate({ query: recommendationsQuery }), c.recommendations);
router.get('/recommendations/:id', validate({ params: idParam, query: recommendationDetailQuery }), c.recommendationDetail);
export default router;
