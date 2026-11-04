import { Router } from 'express';
import * as c from '../controllers/eventController.js';
import { authenticate, optionalAuth } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { uploadSingleImage } from '../middlewares/uploadMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { idParam } from '../validators/commonValidator.js';
import { createEventSchema, updateEventSchema, listEventsQuery } from '../validators/eventValidator.js';

const router = Router();
const manage = [authenticate, authorize(ROLES.ORGANIZER, ROLES.ADMIN)];

router.get('/', optionalAuth, validate({ query: listEventsQuery }), c.listEvents);
router.post('/', ...manage, validate({ body: createEventSchema }), c.createEvent);
router.get('/:id', optionalAuth, validate({ params: idParam }), c.getEvent);
router.patch('/:id', ...manage, validate({ params: idParam, body: updateEventSchema }), c.updateEvent);
router.delete('/:id', ...manage, validate({ params: idParam }), c.deleteEvent);
router.patch('/:id/publish', ...manage, validate({ params: idParam }), c.publishEvent);
router.patch('/:id/cancel', ...manage, validate({ params: idParam }), c.cancelEvent);
router.patch('/:id/complete', ...manage, validate({ params: idParam }), c.completeEvent);
router.post('/:id/banner', ...manage, validate({ params: idParam }), uploadSingleImage, c.uploadBanner);
export default router;
