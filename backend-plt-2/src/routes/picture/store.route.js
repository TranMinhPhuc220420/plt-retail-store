// import express from 'express';

// import imageController from '../../controllers/imageController';

const express = require('express');
const imageController = require('../../controllers/imageController');

const router = express.Router();

// group my-store routes
router.get('/:filename', imageController.sendAvatarMyStore);

// export default router;
module.exports = router;