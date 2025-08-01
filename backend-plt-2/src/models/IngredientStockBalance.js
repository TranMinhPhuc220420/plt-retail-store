const mongoose = require('mongoose');

// IngredientStockBalance model for maintaining current ingredient inventory levels
const ingredientStockBalanceSchema = new mongoose.Schema(
  {
    // Reference to the ingredient
    ingredientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Ingredient', 
      required: true 
    },
    
    // Reference to the store
    storeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Store', 
      required: true 
    },
    
    // Reference to the warehouse where ingredient is stored
    warehouseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Warehouse', 
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
    
    // Minimum stock level for this ingredient (for reorder alerts)
    minStock: { 
      type: Number, 
      default: 0,
      min: 0
    },
    
    // Maximum stock level for this ingredient (for storage management)
    maxStock: { 
      type: Number, 
      default: null,
      min: 0
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
      ref: 'IngredientStockTransaction' 
    },
    
    // Expiration date tracking for perishable ingredients
    expirationDate: { 
      type: Date,
      default: null
    },
    
    // Batch/Lot number for tracking
    batchNumber: { 
      type: String,
      default: null
    },
    
    // Supplier information
    supplierId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Supplier',
      default: null
    },
    
    // Cost per unit for this batch
    costPerUnit: { 
      type: mongoose.Schema.Types.Decimal128,
      default: null
    },
    
    // Total cost for this batch
    totalCost: { 
      type: mongoose.Schema.Types.Decimal128,
      default: null
    },
    
    // Soft delete flag
    deleted: { 
      type: Boolean, 
      default: false 
    },
    
    // Additional metadata for ingredient management
    metadata: {
      temperature: { type: String, enum: ['frozen', 'refrigerated', 'room_temp'], default: 'room_temp' },
      allergens: [{ type: String }],
      nutritionalInfo: {
        calories: { type: Number, default: null },
        protein: { type: Number, default: null },
        carbohydrates: { type: Number, default: null },
        fat: { type: Number, default: null },
        fiber: { type: Number, default: null }
      }
    }
  },
  { timestamps: true }
);

// Create compound unique index to ensure one balance record per ingredient-store-warehouse combination
ingredientStockBalanceSchema.index({ ingredientId: 1, storeId: 1, warehouseId: 1 }, { unique: true });
ingredientStockBalanceSchema.index({ ownerId: 1, storeId: 1 });
ingredientStockBalanceSchema.index({ quantity: 1 }); // For low stock queries
ingredientStockBalanceSchema.index({ expirationDate: 1 }); // For expiration tracking
ingredientStockBalanceSchema.index({ batchNumber: 1 }); // For batch tracking
ingredientStockBalanceSchema.index({ supplierId: 1 }); // For supplier queries

// Virtual for checking if stock is low
ingredientStockBalanceSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minStock;
});

// Virtual for checking if stock is expired or expiring soon
ingredientStockBalanceSchema.virtual('isExpiring').get(function() {
  if (!this.expirationDate) return false;
  const today = new Date();
  const warningDays = 7; // 7 days warning
  const warningDate = new Date(today.getTime() + (warningDays * 24 * 60 * 60 * 1000));
  return this.expirationDate <= warningDate;
});

// Virtual for checking if stock is expired
ingredientStockBalanceSchema.virtual('isExpired').get(function() {
  if (!this.expirationDate) return false;
  return this.expirationDate <= new Date();
});

module.exports = mongoose.model('IngredientStockBalance', ingredientStockBalanceSchema);
