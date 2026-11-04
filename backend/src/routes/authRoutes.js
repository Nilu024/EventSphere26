import { Router } from 'express';
import * as c from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { authLimiter } from '../middlewares/rateLimitMiddleware.js';
import { registerSchema, loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/authValidator.js';

const router = Router();
router.post('/register', authLimiter, validate({ body: registerSchema }), c.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), c.login);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), c.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), c.resetPassword);
router.post('/logout', authenticate, c.logout);
router.get('/me', authenticate, c.me);
router.patch('/change-password', authenticate, authLimiter, validate({ body: changePasswordSchema }), c.changePassword);
export default router;
