import express from 'express';
import authController from '../../controllers/authController.js';

// Middleware
import { sessionMiddleware } from '../../config/session.js';
import { verifyJWT } from '../../middlewares/verifyJWT.js';

const router = express.Router();

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', verifyJWT, authController.me);

export default router;
