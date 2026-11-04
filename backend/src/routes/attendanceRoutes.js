import { Router } from 'express';
import * as c from '../controllers/attendanceController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { eventIdParam } from '../validators/commonValidator.js';
import { markAttendanceSchema, listAttendanceQuery } from '../validators/eventValidator.js';

const router = Router();
router.use(authenticate);
const participant = authorize(ROLES.PARTICIPANT);
const manager = authorize(ROLES.ORGANIZER, ROLES.ADMIN);

router.post('/events/:eventId/attendance/check-in', participant, validate({ params: eventIdParam }), c.checkIn);
router.post('/events/:eventId/attendance/check-out', participant, validate({ params: eventIdParam }), c.checkOut);
router.get('/events/:eventId/attendance/me', participant, validate({ params: eventIdParam }), c.getMine);
router.post('/events/:eventId/attendance/mark', manager, validate({ params: eventIdParam, body: markAttendanceSchema }), c.markAttendance);
router.get('/events/:eventId/attendance', manager, validate({ params: eventIdParam, query: listAttendanceQuery }), c.listForEvent);
export default router;
