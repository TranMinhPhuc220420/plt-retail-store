const User = require('../models/User');
const { ADMIN_ROLE } = require('../config/constant');

const isAdmin = async (req, res, next) => {

  if (!req.user) {
    return res.status(403).json({ error: 'admin_access_required' });
  }

  const username = req.user.username;
  const email = req.user.email;

  const user = await User.findOne({ username, email });
  if (!user || user.role != ADMIN_ROLE) {
    return res.status(403).json({ error: 'admin_access_required' });
  }

  req.user = {...req.user, ...user._doc};
  next();
};

module.exports = isAdmin;