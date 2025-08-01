const mongoose = require('mongoose');

// IngredientStockTransaction model for tracking all ingredient inventory movements
const ingredientStockTransactionSchema = new mongoose.Schema(
  {
    // Transaction type: "in" (stock in), "out" (stock out), "adjustment" (stock take correction), "transfer" (between warehouses)
    type: { 
      type: String, 
      enum: ['in', 'out', 'adjustment', 'transfer', 'expired', 'damaged'], 
      required: true 
    },
    
    // Reference to the ingredient being transacted
    ingredientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Ingredient', 
      required: true 
    },
    
    // Reference to the store where transaction occurs
    storeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Store', 
      required: true 
    },
    
    // Reference to the warehouse where transaction occurs
    warehouseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Warehouse', 
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
    
    // Owner of the transaction (same as ingredient owner)
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    
    // Batch/Lot number for tracking
    batchNumber: { 
      type: String,
      default: null
    },
    
    // Expiration date for this specific batch
    expirationDate: { 
      type: Date,
      default: null
    },
    
    // Supplier information for stock in transactions
    supplierId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Supplier',
      default: null
    },
    
    // Purchase/delivery reference number
    referenceNumber: { 
      type: String,
      default: null
    },
    
    // Cost per unit for this transaction
    costPerUnit: { 
      type: mongoose.Schema.Types.Decimal128,
      default: null
    },
    
    // Total cost for this transaction
    totalCost: { 
      type: mongoose.Schema.Types.Decimal128,
      default: null
    },
    
    // For transfer transactions: destination warehouse
    destinationWarehouseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Warehouse',
      default: null
    },
    
    // For recipe/production usage: reference to recipe
    recipeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Recipe',
      default: null
    },
    
    // Temperature condition when received/stored
    temperatureCondition: { 
      type: String, 
      enum: ['frozen', 'refrigerated', 'room_temp'],
      default: 'room_temp'
    },
    
    // Quality check results
    qualityCheck: {
      passed: { type: Boolean, default: true },
      notes: { type: String, default: '' },
      checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      checkDate: { type: Date, default: Date.now }
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
ingredientStockTransactionSchema.index({ ingredientId: 1, storeId: 1, warehouseId: 1 });
ingredientStockTransactionSchema.index({ type: 1 });
ingredientStockTransactionSchema.index({ date: -1 });
ingredientStockTransactionSchema.index({ ownerId: 1, storeId: 1 });
ingredientStockTransactionSchema.index({ batchNumber: 1 });
ingredientStockTransactionSchema.index({ expirationDate: 1 });
ingredientStockTransactionSchema.index({ supplierId: 1 });
ingredientStockTransactionSchema.index({ referenceNumber: 1 });
ingredientStockTransactionSchema.index({ recipeId: 1 });

// Virtual for calculating days until expiration
ingredientStockTransactionSchema.virtual('daysUntilExpiration').get(function() {
  if (!this.expirationDate) return null;
  const today = new Date();
  const timeDiff = this.expirationDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Pre-save middleware to calculate total cost
ingredientStockTransactionSchema.pre('save', function(next) {
  if (this.costPerUnit && this.quantity) {
    this.totalCost = this.costPerUnit * Math.abs(this.quantity);
  }
  next();
});

module.exports = mongoose.model('IngredientStockTransaction', ingredientStockTransactionSchema);
