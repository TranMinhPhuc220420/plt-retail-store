const express = require('express');
const userController = require('../../controllers/userController');

const router = express.Router();

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

// export default router;
module.exports = router;
