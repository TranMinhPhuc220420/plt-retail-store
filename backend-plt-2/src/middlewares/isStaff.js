const User = require('../models/User');
const { ADMIN_ROLE, STAFF_ROLE } = require('../config/constant');

const isStaff = async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ error: 'staff_access_required' });
  }

  const username = req.user.username;
  const email = req.user.email;

  const user = await User.findOne({ username, email });
  if (!user || user.role !== STAFF_ROLE) {
    return res.status(403).json({ error: 'staff_access_required' });
  }

  req.user = {...req.user, ...user._doc};
  next();
};

module.exports = isStaff;
