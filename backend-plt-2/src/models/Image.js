const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    real_url: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    altText: { type: String, default: '' },
    
    role: {
      type: String,
      enum: ['userAvatar', 'storeAvatar', 'productImage', 'userProfile', 'employeeAvatar', 'other'],
      default: 'other'
    },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);
