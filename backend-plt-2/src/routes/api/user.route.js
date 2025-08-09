const express = require('express');
const userController = require('../../controllers/userController');
const verifyJWT = require('../../middlewares/verifyJWT');
const { verifyFormUpdateProfile, verifyFormChangePassword } = require('../../middlewares/profileValidation');
const { uploadAvatar, handleUploadError } = require('../../middlewares/uploadAvatar');

const router = express.Router();

// Public routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

// Protected routes - require authentication
router.get('/profile/me', verifyJWT, userController.getProfile);
router.put('/profile/me', verifyJWT, verifyFormUpdateProfile, userController.updateProfile);
router.put('/profile/change-password', verifyJWT, verifyFormChangePassword, userController.changePassword);
router.post('/profile/avatar', verifyJWT, uploadAvatar, handleUploadError, userController.updateAvatar);

module.exports = router;
