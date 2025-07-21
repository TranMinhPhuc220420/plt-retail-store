const mongoose = require('mongoose');

const productCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,

    deleted: { type: Boolean, default: false },
    
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductCategory', productCategorySchema);
