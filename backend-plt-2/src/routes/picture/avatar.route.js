const express = require('express');
const imageController = require('../../controllers/imageController');

const router = express.Router();

// group my-store routes
router.get('/:filename', imageController.sendUserAvatar);

// export default router;
module.exports = router;