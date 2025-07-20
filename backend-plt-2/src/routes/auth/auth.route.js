// import express from 'express';
// import authController from '../../controllers/authController';

// // Middleware
// import { sessionMiddleware } from '../../config/session';
// import { verifyJWT } from '../../middlewares/verifyJWT';

const express = require('express');
const authController = require('../../controllers/authController');
const verifyJWT = require('../../middlewares/verifyJWT');

const router = express.Router();

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', verifyJWT, authController.me);

// export default router;
module.exports = router;
