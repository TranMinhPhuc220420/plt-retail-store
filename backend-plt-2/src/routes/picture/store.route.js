import express from 'express';

import imageController from '../../controllers/imageController.js';

const router = express.Router();

// group my-store routes
router.get('/:filename', imageController.sendAvatarMyStore);

export default router;
