const Recipe = require('../models/Recipe');
const Product = require('../models/Product');
const Ingredient = require('../models/Ingredient');
const mongoose = require('mongoose');

/**
 * Calculate the total cost of ingredients for a recipe
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<Object>} Cost breakdown and total
 */
const calculateRecipeIngredientCost = async (recipeId) => {
  try {
    const recipe = await Recipe.findById(recipeId)
      .populate('ingredients.ingredientId', 'name standardCost averageCost unit');

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    let totalCost = 0;
    const costBreakdown = [];

    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = recipeIngredient.ingredientId;
      
      if (!ingredient) {
        continue; // Skip if ingredient not found
      }

      // Use averageCost if available, otherwise standardCost
      const unitCost = ingredient.averageCost || ingredient.standardCost || 0;
      const unitCostNumber = parseFloat(unitCost.toString());
      
      const ingredientTotalCost = unitCostNumber * recipeIngredient.amountUsed;
      totalCost += ingredientTotalCost;

      costBreakdown.push({
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        amountUsed: recipeIngredient.amountUsed,
        unit: recipeIngredient.unit,
        unitCost: unitCostNumber,
        totalCost: ingredientTotalCost
      });
    }

    const yieldQuantity = recipe.yield?.quantity || 1;
    const costPerUnit = totalCost / yieldQuantity;

    return {
      recipeId,
      totalCost,
      costPerUnit,
      yieldQuantity,
      costBreakdown
    };
  } catch (error) {
    console.error('Error calculating recipe cost:', error);
    throw error;
  }
};

/**
 * Calculate product cost based on its default recipe
 * @param {string} productId - Product ID
 * @param {string} recipeId - Optional specific recipe ID
 * @returns {Promise<Object>} Product cost calculation
 */
const calculateProductCostFromRecipe = async (productId, recipeId = null) => {
  try {
    const product = await Product.findById(productId)
      .populate('defaultRecipeId')
      .populate('recipes');

    if (!product) {
      throw new Error('Product not found');
    }

    const targetRecipeId = recipeId || product.defaultRecipeId?._id;
    
    if (!targetRecipeId) {
      throw new Error('No recipe specified for cost calculation');
    }

    const recipeCost = await calculateRecipeIngredientCost(targetRecipeId);

    return {
      productId,
      productName: product.name,
      recipeId: targetRecipeId,
      ...recipeCost,
      currentSellingPrice: parseFloat(product.retailPrice?.toString() || 0),
      currentCostPrice: parseFloat(product.costPrice?.toString() || 0),
      suggestedCostPrice: recipeCost.costPerUnit,
      profitMargin: parseFloat(product.retailPrice?.toString() || 0) - recipeCost.costPerUnit
    };
  } catch (error) {
    console.error('Error calculating product cost:', error);
    throw error;
  }
};

/**
 * Update product pricing based on calculated recipe cost
 * @param {string} productId - Product ID
 * @param {Object} options - Update options
 * @returns {Promise<Object>} Updated product
 */
const updateProductPricingBasedOnCost = async (productId, options = {}) => {
  try {
    const costCalculation = await calculateProductCostFromRecipe(productId);
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    const updates = {};

    // Update cost price if requested
    if (options.updateCostPrice) {
      updates.costPrice = mongoose.Types.Decimal128.fromString(costCalculation.suggestedCostPrice.toString());
    }

    // Update retail price based on margin if requested
    if (options.updateRetailPrice && options.profitMarginPercent) {
      const newRetailPrice = costCalculation.suggestedCostPrice * (1 + options.profitMarginPercent / 100);
      updates.retailPrice = mongoose.Types.Decimal128.fromString(newRetailPrice.toString());
    }

    if (Object.keys(updates).length > 0) {
      await Product.findByIdAndUpdate(productId, updates);
    }

    return {
      ...costCalculation,
      updatedFields: updates
    };
  } catch (error) {
    console.error('Error updating product pricing:', error);
    throw error;
  }
};

/**
 * Get detailed cost breakdown for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Detailed cost analysis
 */
const getCostBreakdown = async (productId) => {
  try {
    const product = await Product.findById(productId)
      .populate('defaultRecipeId')
      .populate('recipes');

    if (!product) {
      throw new Error('Product not found');
    }

    const result = {
      productId,
      productName: product.name,
      currentPricing: {
        costPrice: parseFloat(product.costPrice?.toString() || 0),
        retailPrice: parseFloat(product.retailPrice?.toString() || 0),
        price: parseFloat(product.price?.toString() || 0)
      },
      recipes: []
    };

    // Calculate cost for all linked recipes
    for (const recipe of product.recipes) {
      try {
        const recipeCost = await calculateRecipeIngredientCost(recipe._id);
        result.recipes.push({
          recipeId: recipe._id,
          recipeName: recipe.dishName,
          isDefault: product.defaultRecipeId?._id?.toString() === recipe._id.toString(),
          ...recipeCost
        });
      } catch (error) {
        console.error(`Error calculating cost for recipe ${recipe._id}:`, error);
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting cost breakdown:', error);
    throw error;
  }
};

/**
 * Update recipe cost calculation and save to database
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<Object>} Updated recipe with cost
 */
const updateRecipeCostCalculation = async (recipeId) => {
  try {
    const costCalculation = await calculateRecipeIngredientCost(recipeId);
    
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      { 
        costPerUnit: mongoose.Types.Decimal128.fromString(costCalculation.costPerUnit.toString())
      },
      { new: true }
    );

    return {
      recipe: updatedRecipe,
      costCalculation
    };
  } catch (error) {
    console.error('Error updating recipe cost calculation:', error);
    throw error;
  }
};

module.exports = {
  calculateRecipeIngredientCost,
  calculateProductCostFromRecipe,
  updateProductPricingBasedOnCost,
  getCostBreakdown,
  updateRecipeCostCalculation
};
