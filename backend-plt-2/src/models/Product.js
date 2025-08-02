const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productCode: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    description: String,
    imageUrl: String,
    price: { type: mongoose.Schema.Types.Decimal128, required: true },
    retailPrice: { type: mongoose.Schema.Types.Decimal128, required: true },
    costPrice: { type: mongoose.Schema.Types.Decimal128, required: true },
    minStock: { type: Number, required: true },
    unit: { type: String, required: true },
    status: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },

    deleted: { type: Boolean, default: false },

    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductType' }],
    orderItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' }],
    inventoryTransactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InventoryTransaction' }],
    
    // Recipe relationships
    recipes: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Recipe' 
    }], // Multiple recipes can be used for one product
    defaultRecipeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Recipe', 
      default: null 
    }, // Primary recipe for cost calculation
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
