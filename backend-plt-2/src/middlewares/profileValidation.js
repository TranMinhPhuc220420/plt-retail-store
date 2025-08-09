const Joi = require('joi');

const updateProfile = Joi.object({
  firstName: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.min': 'First name must be at least 1 character',
      'string.max': 'First name must not exceed 50 characters'
    }),

  lastName: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.min': 'Last name must be at least 1 character',
      'string.max': 'Last name must not exceed 50 characters'
    }),

  displayName: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'Display name must be at least 1 character',
      'string.max': 'Display name must not exceed 50 characters'
    }),

  phoneNumber: Joi.string()
    .pattern(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Phone number must be a valid Vietnamese phone number'
    }),

  address: Joi.string()
    .max(200)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Address must not exceed 200 characters'
    }),

  dateOfBirth: Joi.date()
    .iso()
    .optional()
    .allow('')
    .allow(null)
    .custom((value, helpers) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 13 || age > 120) {
        return helpers.error('any.invalid');
      }

      return value;
    })
    .messages({
      'date.format': 'Date of birth must be a valid date',
      'any.invalid': 'Age must be between 13 and 120 years'
    }),

  bio: Joi.string()
    .max(500)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Bio must not exceed 500 characters'
    }),

  avatar: Joi.string()
    .uri()
    .optional()
    .allow('')
    .allow(null)
    .messages({
      'string.uri': 'Avatar must be a valid URL'
    })
});

const changePassword = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
      'string.empty': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(6)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters',
      'string.max': 'New password must not exceed 100 characters',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, and one number',
      'any.required': 'New password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match new password',
      'any.required': 'Password confirmation is required'
    })
});

const verifyFormUpdateProfile = async (req, res, next) => {
  try {
    const { error } = updateProfile.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const verifyFormChangePassword = async (req, res, next) => {
  try {
    const { error } = changePassword.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  }
  catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  verifyFormUpdateProfile,
  verifyFormChangePassword
};