const express = require('express');
const imageController = require('../../controllers/imageController');

const router = express.Router();

// group employees routes
router.get('/:filename', imageController.sendAvatarEmployee);

// export default router;
module.exports = router;