const Recipe = require('../models/Recipe');
const Product = require('../models/Product');
const Ingredient = require('../models/Ingredient');
const mongoose = require('mongoose');
const { convertUnit } = require('./unitConverter'); // ✅ THÊM IMPORT
const costCache = require('./costCache'); // ✅ THÊM CACHE SUPPORT

/**
 * Calculate the total cost of ingredients for a recipe
 * @param {string} recipeId - Recipe ID
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<Object>} Cost breakdown and total
 */
const calculateRecipeIngredientCost = async (recipeId, useCache = true) => {
  try {
    // ✅ CHECK CACHE FIRST
    if (useCache) {
      const cachedResult = costCache.getRecipeCost(recipeId);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const recipe = await Recipe.findById(recipeId)
      .populate('ingredients.ingredientId', 'name standardCost averageCost unit');

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    let totalCost = 0;
    const costBreakdown = [];
    const conversionErrors = []; // ✅ THÊM TRACKING LỖI CHUYỂN ĐỔI

    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = recipeIngredient.ingredientId;
      
      if (!ingredient) {
        continue; // Skip if ingredient not found
      }

      // Use averageCost if available, otherwise standardCost
      const unitCost = ingredient.averageCost || ingredient.standardCost || 0;
      const unitCostNumber = parseFloat(unitCost.toString());
      
      // ✅ FIX: CHUYỂN ĐỔI ĐƠN VỊ TRƯỚC KHI TÍNH TOÁN
      let convertedAmount = recipeIngredient.amountUsed;
      let actualUnit = recipeIngredient.unit;
      
      // Nếu đơn vị khác nhau, thực hiện chuyển đổi
      if (recipeIngredient.unit !== ingredient.unit) {
        const converted = convertUnit(
          recipeIngredient.amountUsed,
          recipeIngredient.unit,
          ingredient.unit
        );
        
        if (converted !== null) {
          convertedAmount = converted;
          actualUnit = ingredient.unit;
          console.log(`🔄 Unit conversion: ${recipeIngredient.amountUsed} ${recipeIngredient.unit} → ${converted} ${ingredient.unit} for ${ingredient.name}`);
        } else {
          // Không thể chuyển đổi - ghi log cảnh báo nhưng vẫn tiếp tục với đơn vị gốc
          const errorMsg = `❌ Cannot convert ${recipeIngredient.unit} to ${ingredient.unit} for ingredient "${ingredient.name}". Using original amount.`;
          console.warn(errorMsg);
          conversionErrors.push({
            ingredientName: ingredient.name,
            fromUnit: recipeIngredient.unit,
            toUnit: ingredient.unit,
            amount: recipeIngredient.amountUsed,
            error: errorMsg
          });
        }
      }
      
      const ingredientTotalCost = unitCostNumber * convertedAmount;
      totalCost += ingredientTotalCost;

      costBreakdown.push({
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        amountUsed: recipeIngredient.amountUsed,
        unit: recipeIngredient.unit,
        convertedAmount: convertedAmount, // ✅ THÊM THÔNG TIN CHUYỂN ĐỔI
        ingredientUnit: ingredient.unit,
        unitCost: unitCostNumber,
        totalCost: ingredientTotalCost,
        conversionApplied: recipeIngredient.unit !== ingredient.unit // ✅ FLAG CHUYỂN ĐỔI
      });
    }

    const yieldQuantity = recipe.yield?.quantity || 1;
    const costPerUnit = totalCost / yieldQuantity;

    const result = {
      recipeId,
      totalCost,
      costPerUnit,
      yieldQuantity,
      costBreakdown,
      conversionErrors: conversionErrors.length > 0 ? conversionErrors : undefined // ✅ THÊM LỖI CHUYỂN ĐỔI
    };

    // ✅ LOG CẢNH BÁO NẾU CÓ LỖI CHUYỂN ĐỔI
    if (conversionErrors.length > 0) {
      console.warn(`⚠️  Recipe ${recipeId} has ${conversionErrors.length} unit conversion errors. Cost calculation may be inaccurate.`);
    }

    // ✅ CACHE THE RESULT
    if (useCache) {
      costCache.setRecipeCost(recipeId, result);
    }

    return result;
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

/**
 * ✅ THÊM FUNCTION VALIDATE RECIPE COST
 * Validate recipe costs for unit conversion issues
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<Object>} Validation result
 */
const validateRecipeCostCalculation = async (recipeId) => {
  try {
    const recipe = await Recipe.findById(recipeId)
      .populate('ingredients.ingredientId', 'name standardCost averageCost unit');

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    const validationResult = {
      recipeId,
      recipeName: recipe.dishName,
      isValid: true,
      warnings: [],
      errors: [],
      ingredientChecks: []
    };

    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = recipeIngredient.ingredientId;
      
      if (!ingredient) {
        validationResult.errors.push(`Missing ingredient data for recipe ingredient`);
        validationResult.isValid = false;
        continue;
      }

      const check = {
        ingredientName: ingredient.name,
        recipeUnit: recipeIngredient.unit,
        ingredientUnit: ingredient.unit,
        amountUsed: recipeIngredient.amountUsed,
        unitCost: parseFloat((ingredient.averageCost || ingredient.standardCost || 0).toString()),
        canConvert: true,
        conversionFactor: 1
      };

      // Kiểm tra khả năng chuyển đổi đơn vị
      if (recipeIngredient.unit !== ingredient.unit) {
        const converted = convertUnit(1, recipeIngredient.unit, ingredient.unit);
        if (converted === null) {
          check.canConvert = false;
          validationResult.errors.push(
            `Cannot convert ${recipeIngredient.unit} to ${ingredient.unit} for "${ingredient.name}"`
          );
          validationResult.isValid = false;
        } else {
          check.conversionFactor = converted;
          if (Math.abs(converted - 1) > 100) {
            validationResult.warnings.push(
              `Large conversion factor (${converted}) for "${ingredient.name}": ${recipeIngredient.unit} → ${ingredient.unit}`
            );
          }
        }
      }

      validationResult.ingredientChecks.push(check);
    }

    return validationResult;
  } catch (error) {
    console.error('Error validating recipe cost calculation:', error);
    throw error;
  }
};

module.exports = {
  calculateRecipeIngredientCost,
  calculateProductCostFromRecipe,
  updateProductPricingBasedOnCost,
  getCostBreakdown,
  updateRecipeCostCalculation,
  validateRecipeCostCalculation // ✅ THÊM FUNCTION MỚI
};
