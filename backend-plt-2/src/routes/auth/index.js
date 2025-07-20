const { Router } = require('express');
const authRouter = require('./auth.route');

const router = Router();

// API routes
router.use('/auth', authRouter);

// export default router;
module.exports = router;