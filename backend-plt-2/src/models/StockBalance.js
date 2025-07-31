const mongoose = require('mongoose');

// StockBalance model for maintaining current inventory levels
const stockBalanceSchema = new mongoose.Schema(
  {
    // Reference to the product
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    
    // Reference to the store
    storeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Store', 
      required: true 
    },
    
    // Current quantity in stock
    quantity: { 
      type: Number, 
      required: true,
      min: 0,
      default: 0
    },
    
    // Unit of measurement
    unit: { 
      type: String, 
      required: true 
    },
    
    // Owner of the stock balance
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    
    // Date of last transaction that affected this balance
    lastTransactionDate: { 
      type: Date, 
      default: Date.now 
    },
    
    // Reference to the last transaction that updated this balance
    lastTransactionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'StockTransaction' 
    },
    
    // Soft delete flag
    deleted: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

// Create compound unique index to ensure one balance record per product-store combination
stockBalanceSchema.index({ productId: 1, storeId: 1 }, { unique: true });
stockBalanceSchema.index({ ownerId: 1, storeId: 1 });
stockBalanceSchema.index({ quantity: 1 }); // For low stock queries

module.exports = mongoose.model('StockBalance', stockBalanceSchema);
