const mongoose = require('mongoose');

// import { ROLE_DEFAULT, ROLE_LIST, USER_PROVIDER_LOCAL } from '../config/constant';
const { ROLE_DEFAULT, ROLE_LIST, USER_PROVIDER_LOCAL } = require('../config/constant');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, minlength: 6 },
  googleId: { type: String, unique: true },

  avatar: { type: String, default: null },
  displayName: { type: String, default: null },
  provider: { type: String, default: USER_PROVIDER_LOCAL },
  role: { type: String, enum: ROLE_LIST, default: ROLE_DEFAULT },
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
