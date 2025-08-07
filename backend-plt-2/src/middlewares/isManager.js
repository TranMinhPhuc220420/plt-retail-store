const User = require('../models/User');
const { MANAGER_ROLE } = require('../config/constant');

const isManager = async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ error: 'manager_access_required' });
  }

  const username = req.user.username;
  const email = req.user.email;

  const user = await User.findOne({ username, email });
  if (!user || user.role !== MANAGER_ROLE) {
    return res.status(403).json({ error: 'manager_access_required' });
  }

  req.user = {...req.user, ...user._doc};
  next();
};

module.exports = isManager;
