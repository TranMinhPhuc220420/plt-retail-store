const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    // Name of the ingredient
    name: { type: String, required: true },
    
    // Unit of measurement (e.g., kg, liter, piece, gram)
    unit: { type: String, required: true },
    
    // Current stock quantity available
    stockQuantity: { type: Number, required: true, min: 0 },

    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    
    // Reference to the warehouse where this ingredient is stored
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    
    // Soft delete flag
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ingredient', ingredientSchema);
