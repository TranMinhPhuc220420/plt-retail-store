const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    // Unique ingredient code for identification
    ingredientCode: { type: String, unique: true, required: true },
    
    // Name of the ingredient
    name: { type: String, required: true },
    
    // Description of the ingredient
    description: { type: String, default: '' },
    
    // Category of ingredient (e.g., dairy, meat, vegetables, spices)
    category: { type: String, default: 'general' },
    
    // Unit of measurement - simplified to kg (weight) or l (volume) only
    unit: { type: String, required: true, enum: ['kg', 'l'] },
    
    // Current stock quantity available (deprecated - use IngredientStockBalance instead)
    stockQuantity: { type: Number, default: 0, min: 0 },
    
    // Minimum stock level for reorder alerts
    minStock: { type: Number, default: 0, min: 0 },
    
    // Maximum stock level for storage management
    maxStock: { type: Number, default: null, min: 0 },
    
    // Standard cost per unit
    standardCost: { type: mongoose.Schema.Types.Decimal128, default: null },
    
    // Average cost per unit (calculated from transactions)
    averageCost: { type: mongoose.Schema.Types.Decimal128, default: null },

    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    
    // Reference to the primary warehouse where this ingredient is stored
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    
    // Ingredient-specific properties
    properties: {
      // Storage requirements
      storageTemp: { type: String, enum: ['frozen', 'refrigerated', 'room_temp'], default: 'room_temp' },
      
      // Shelf life in days
      shelfLifeDays: { type: Number, default: null },
      
      // Common allergens
      allergens: [{ type: String }],
      
      // Nutritional information per unit
      nutritionalInfo: {
        calories: { type: Number, default: null },
        protein: { type: Number, default: null },
        carbohydrates: { type: Number, default: null },
        fat: { type: Number, default: null },
        fiber: { type: Number, default: null },
        sodium: { type: Number, default: null }
      },
      
      // Special handling requirements
      specialHandling: { type: String, default: '' }
    },
    
    // Default supplier information
    defaultSupplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
    
    // Status of the ingredient
    status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' },
    
    // Image URL for the ingredient
    imageUrl: { type: String, default: null },
    
    // Soft delete flag
    deleted: { type: Boolean, default: false },
    
    // References to related documents
    stockBalances: [{ type: mongoose.Schema.Types.ObjectId, ref: 'IngredientStockBalance' }],
    stockTransactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'IngredientStockTransaction' }],
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }]
  },
  { timestamps: true }
);

// Create indexes for better performance (only for non-unique fields)
ingredientSchema.index({ name: 1 });
ingredientSchema.index({ category: 1 });
ingredientSchema.index({ ownerId: 1, storeId: 1 });
ingredientSchema.index({ warehouseId: 1 });
ingredientSchema.index({ status: 1 });
ingredientSchema.index({ defaultSupplierId: 1 });

// Virtual for checking if ingredient is low in stock (across all balances)
ingredientSchema.virtual('isLowStock').get(function() {
  // This would need to be populated with actual stock balance data
  return this.stockQuantity <= this.minStock;
});

module.exports = mongoose.model('Ingredient', ingredientSchema);
