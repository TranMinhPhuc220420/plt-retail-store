const mongoose = require('mongoose');

// StockTransaction model for tracking all inventory movements
const stockTransactionSchema = new mongoose.Schema(
  {
    // Transaction type: "in" (stock in), "out" (stock out), "adjustment" (stock take correction)
    type: { 
      type: String, 
      enum: ['in', 'out', 'adjustment'], 
      required: true 
    },
    
    // Reference to the product being transacted
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    
    // Reference to the store where transaction occurs
    storeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Store', 
      required: true 
    },
    
    // Quantity being moved (positive for in/adjustment up, negative for out/adjustment down)
    quantity: { 
      type: Number, 
      required: true 
    },
    
    // Unit of measurement for the transaction
    unit: { 
      type: String, 
      required: true 
    },
    
    // User who performed the transaction
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    
    // Date when transaction occurred
    date: { 
      type: Date, 
      default: Date.now, 
      required: true 
    },
    
    // Note or reason for the transaction
    note: { 
      type: String, 
      default: '' 
    },
    
    // For adjustment transactions: previous quantity before adjustment
    previousQuantity: { 
      type: Number 
    },
    
    // For adjustment transactions: new quantity after adjustment
    newQuantity: { 
      type: Number 
    },
    
    // Owner of the transaction (same as product owner)
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    
    // Soft delete flag
    deleted: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

// Create indexes for better query performance
stockTransactionSchema.index({ productId: 1, storeId: 1 });
stockTransactionSchema.index({ type: 1 });
stockTransactionSchema.index({ date: -1 });
stockTransactionSchema.index({ ownerId: 1, storeId: 1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
