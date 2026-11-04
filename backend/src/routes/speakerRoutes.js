import { Router } from 'express';
import * as c from '../controllers/speakerController.js';
import { authenticate, optionalAuth } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { uploadSingleImage } from '../middlewares/uploadMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { idParam, eventIdParam } from '../validators/commonValidator.js';
import { createSpeakerSchema, updateSpeakerSchema } from '../validators/sessionValidator.js';

const router = Router();
const manage = [authenticate, authorize(ROLES.ORGANIZER, ROLES.ADMIN)];

router.get('/events/:eventId/speakers', optionalAuth, validate({ params: eventIdParam }), c.listSpeakers);
router.post('/events/:eventId/speakers', ...manage, validate({ params: eventIdParam, body: createSpeakerSchema }), c.createSpeaker);
router.patch('/speakers/:id', ...manage, validate({ params: idParam, body: updateSpeakerSchema }), c.updateSpeaker);
router.delete('/speakers/:id', ...manage, validate({ params: idParam }), c.deleteSpeaker);
router.post('/speakers/:id/image', ...manage, validate({ params: idParam }), uploadSingleImage, c.uploadSpeakerImage);
export default router;
