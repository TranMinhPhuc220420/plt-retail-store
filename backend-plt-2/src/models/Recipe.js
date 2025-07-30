const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    // Name of the dish/recipe
    dishName: { type: String, required: true },
    
    // List of ingredients used in this recipe
    ingredients: [{
      // Reference to the ingredient
      ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
      
      // Amount of this ingredient needed for the recipe
      amountUsed: { type: Number, required: true, min: 0 },
      
      // Unit of measurement for this ingredient in the recipe
      unit: { type: String, required: true }
    }],
    
    // Optional recipe description or cooking instructions
    description: String,

    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    
    // Soft delete flag
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recipe', recipeSchema);
