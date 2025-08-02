const Recipe = require('../models/Recipe');
const Product = require('../models/Product');
const Ingredient = require('../models/Ingredient');
const IngredientStockTransaction = require('../models/IngredientStockTransaction');
const IngredientStockBalance = require('../models/IngredientStockBalance');
const { checkIngredientAvailability } = require('./unitConverter');

/**
 * Check if enough ingredients are available for production
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to produce
 * @param {string} recipeId - Optional specific recipe ID
 * @returns {Promise<Object>} Feasibility check result
 */
const checkProductionFeasibility = async (productId, quantity, recipeId = null) => {
  try {
    const product = await Product.findById(productId)
      .populate('defaultRecipeId')
      .populate('recipes');

    if (!product) {
      throw new Error('Product not found');
    }

    const targetRecipeId = recipeId || product.defaultRecipeId?._id;
    
    if (!targetRecipeId) {
      throw new Error('No recipe specified for production');
    }

    const recipe = await Recipe.findById(targetRecipeId)
      .populate('ingredients.ingredientId', 'name unit stockQuantity');

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    const yieldQuantity = recipe.yield?.quantity || 1;
    const productionRatio = quantity / yieldQuantity;

    const feasibilityCheck = {
      productId,
      productName: product.name,
      recipeId: targetRecipeId,
      recipeName: recipe.dishName,
      requestedQuantity: quantity,
      canProduce: true,
      availableQuantity: 0,
      limitingIngredients: [],
      ingredientChecks: []
    };

    let minPossibleProduction = Infinity;

    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = recipeIngredient.ingredientId;
      
      if (!ingredient) {
        continue;
      }

      const requiredAmount = recipeIngredient.amountUsed * productionRatio;
      
      // Use unit converter to check availability
      const availabilityCheck = checkIngredientAvailability(
        ingredient.stockQuantity,
        ingredient.unit,
        requiredAmount,
        recipeIngredient.unit
      );

      const ingredientCheck = {
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        requiredAmount,
        requiredUnit: recipeIngredient.unit,
        availableAmount: ingredient.stockQuantity,
        availableUnit: ingredient.unit,
        isAvailable: availabilityCheck.isAvailable,
        availableInRequiredUnit: availabilityCheck.stockInRequiredUnit,
        message: availabilityCheck.message
      };

      feasibilityCheck.ingredientChecks.push(ingredientCheck);

      if (!availabilityCheck.isAvailable) {
        feasibilityCheck.canProduce = false;
        feasibilityCheck.limitingIngredients.push({
          name: ingredient.name,
          required: requiredAmount,
          available: availabilityCheck.stockInRequiredUnit || ingredient.stockQuantity,
          unit: recipeIngredient.unit,
          shortage: requiredAmount - (availabilityCheck.stockInRequiredUnit || 0)
        });
      } else {
        // Calculate how many units we can produce with this ingredient
        const possibleProduction = Math.floor(
          (availabilityCheck.stockInRequiredUnit || ingredient.stockQuantity) / recipeIngredient.amountUsed
        ) * yieldQuantity;
        
        minPossibleProduction = Math.min(minPossibleProduction, possibleProduction);
      }
    }

    feasibilityCheck.availableQuantity = minPossibleProduction === Infinity ? 0 : minPossibleProduction;

    return feasibilityCheck;
  } catch (error) {
    console.error('Error checking production feasibility:', error);
    throw error;
  }
};

/**
 * Deduct ingredients from inventory for production
 * @param {string} recipeId - Recipe ID
 * @param {number} quantity - Quantity being produced
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Transaction records
 */
const deductIngredientsForProduction = async (recipeId, quantity, options = {}) => {
  try {
    const recipe = await Recipe.findById(recipeId)
      .populate('ingredients.ingredientId');

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    const yieldQuantity = recipe.yield?.quantity || 1;
    const productionRatio = quantity / yieldQuantity;

    const transactions = [];
    const errors = [];

    // Start a session for transaction consistency
    const session = await require('mongoose').startSession();
    
    try {
      await session.withTransaction(async () => {
        for (const recipeIngredient of recipe.ingredients) {
          const ingredient = recipeIngredient.ingredientId;
          
          if (!ingredient) {
            continue;
          }

          const requiredAmount = recipeIngredient.amountUsed * productionRatio;

          try {
            // Create stock out transaction
            const transaction = new IngredientStockTransaction({
              ingredientId: ingredient._id,
              type: 'out',
              quantity: requiredAmount,
              unit: recipeIngredient.unit,
              date: new Date(),
              reason: 'production',
              recipeId: recipeId,
              notes: `Production: ${quantity} units of ${recipe.dishName}`,
              userId: options.userId,
              storeId: options.storeId || ingredient.storeId,
              warehouseId: ingredient.warehouseId,
              ownerId: options.ownerId || ingredient.ownerId
            });

            await transaction.save({ session });

            // Update ingredient stock quantity
            const updatedIngredient = await Ingredient.findByIdAndUpdate(
              ingredient._id,
              { $inc: { stockQuantity: -requiredAmount } },
              { new: true, session }
            );

            // Update or create stock balance record
            await IngredientStockBalance.findOneAndUpdate(
              {
                ingredientId: ingredient._id,
                warehouseId: ingredient.warehouseId
              },
              {
                $inc: { quantity: -requiredAmount },
                $set: { 
                  unit: recipeIngredient.unit,
                  lastUpdated: new Date()
                }
              },
              { 
                upsert: true, 
                new: true, 
                session 
              }
            );

            transactions.push({
              transactionId: transaction._id,
              ingredientId: ingredient._id,
              ingredientName: ingredient.name,
              quantityUsed: requiredAmount,
              unit: recipeIngredient.unit,
              newStockLevel: updatedIngredient.stockQuantity
            });

          } catch (error) {
            errors.push({
              ingredientId: ingredient._id,
              ingredientName: ingredient.name,
              error: error.message
            });
            throw error; // This will cause the transaction to rollback
          }
        }
      });

      return {
        success: true,
        recipeId,
        recipeName: recipe.dishName,
        quantityProduced: quantity,
        transactions,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        recipeId,
        recipeName: recipe.dishName,
        quantityProduced: 0,
        transactions: [],
        errors
      };
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Error deducting ingredients for production:', error);
    throw error;
  }
};

/**
 * Create production transaction record
 * @param {string} productId - Product ID
 * @param {string} recipeId - Recipe ID
 * @param {number} quantity - Quantity produced
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Production record
 */
const createProductionTransaction = async (productId, recipeId, quantity, options = {}) => {
  try {
    // First check feasibility
    const feasibilityCheck = await checkProductionFeasibility(productId, quantity, recipeId);
    
    if (!feasibilityCheck.canProduce) {
      throw new Error('Insufficient ingredients for production');
    }

    // Deduct ingredients
    const deductionResult = await deductIngredientsForProduction(recipeId, quantity, options);
    
    if (!deductionResult.success) {
      throw new Error('Failed to deduct ingredients from inventory');
    }

    // Update product stock if applicable
    if (options.updateProductStock) {
      await Product.findByIdAndUpdate(
        productId,
        { 
          $inc: { 
            // Assuming there's a stockQuantity field on Product model
            // You may need to add this field to Product schema
            stockQuantity: quantity 
          }
        }
      );
    }

    const productionRecord = {
      productId,
      recipeId,
      quantityProduced: quantity,
      productionDate: new Date(),
      ingredientTransactions: deductionResult.transactions,
      status: 'completed',
      producedBy: options.userId,
      storeId: options.storeId,
      ownerId: options.ownerId,
      notes: options.notes || `Produced ${quantity} units using recipe ${deductionResult.recipeName}`
    };

    return productionRecord;

  } catch (error) {
    console.error('Error creating production transaction:', error);
    throw error;
  }
};

module.exports = {
  checkProductionFeasibility,
  deductIngredientsForProduction,
  createProductionTransaction
};
