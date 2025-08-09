const mongoose = require('mongoose');

// import { ROLE_DEFAULT, ROLE_LIST, USER_PROVIDER_LOCAL } from '../config/constant';
const { ROLE_DEFAULT, ROLE_LIST, USER_PROVIDER_LOCAL } = require('../config/constant');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, minlength: 6 },
  googleId: { type: String, unique: true, sparse: true },

  avatar: { type: String, default: null },
  displayName: { type: String, default: null },
  provider: { type: String, default: USER_PROVIDER_LOCAL },
  role: { type: String, enum: ROLE_LIST, default: ROLE_DEFAULT },

  // Profile additional fields
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phoneNumber: { 
    type: String, 
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/.test(v);
      },
      message: 'Phone number must be a valid Vietnamese phone number'
    }
  },
  address: { type: String, trim: true },
  dateOfBirth: { type: Date },
  bio: { type: String, maxlength: 500 },

  disabled: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
}, {
  timestamps: true
});

// Add indexes for better query performance (only for non-unique fields)
userSchema.index({ role: 1 });
userSchema.index({ deleted: 1 });

module.exports = mongoose.model('User', userSchema);
