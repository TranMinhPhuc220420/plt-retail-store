/**
 * Unit Validation Middleware
 * Validates and standardizes units before saving to database
 */

const { getRecommendedUnits, areUnitsCompatible } = require('../utils/unitConverter');

/**
 * Get allowed units for the system
 * @returns {Array} Array of allowed unit strings
 */
function getAllowedUnits() {
  const recommended = getRecommendedUnits();
  return [
    ...recommended.weight,
    ...recommended.volume,
    ...recommended.count
  ];
}

/**
 * Validate if a unit is allowed in the system
 * @param {string} unit - Unit to validate
 * @returns {boolean} True if unit is allowed
 */
function isUnitAllowed(unit) {
  const allowedUnits = getAllowedUnits();
  return allowedUnits.includes(unit);
}

/**
 * Middleware to validate ingredient units before save
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateIngredientUnit(req, res, next) {
  const { unit } = req.body;
  
  if (!unit) {
    return res.status(400).json({ 
      error: 'unit_required',
      message: 'Unit is required for ingredient'
    });
  }
  
  if (!isUnitAllowed(unit)) {
    return res.status(400).json({ 
      error: 'invalid_unit',
      message: `Unit '${unit}' is not allowed. Allowed units are: ${getAllowedUnits().join(', ')}`,
      allowedUnits: getAllowedUnits()
    });
  }
  
  next();
}

/**
 * Middleware to validate recipe ingredient units before save
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validateRecipeUnits(req, res, next) {
  const { ingredients } = req.body;
  
  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ 
      error: 'ingredients_required',
      message: 'Ingredients array is required for recipe'
    });
  }
  
  // Validate each ingredient's unit
  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    
    if (!ingredient.unit) {
      return res.status(400).json({ 
        error: 'ingredient_unit_required',
        message: `Unit is required for ingredient at index ${i}`
      });
    }
    
    if (!isUnitAllowed(ingredient.unit)) {
      return res.status(400).json({ 
        error: 'invalid_ingredient_unit',
        message: `Unit '${ingredient.unit}' for ingredient at index ${i} is not allowed. Allowed units are: ${getAllowedUnits().join(', ')}`,
        allowedUnits: getAllowedUnits()
      });
    }
  }
  
  next();
}

/**
 * Suggest better units for frontend based on quantity
 * @param {number} quantity - Quantity value
 * @param {string} currentUnit - Current unit
 * @returns {Object} Suggestion object
 */
function suggestBetterUnit(quantity, currentUnit) {
  if (!isUnitAllowed(currentUnit)) {
    return {
      shouldChange: true,
      suggestedUnit: 'piece',
      reason: `Unit '${currentUnit}' is not allowed`
    };
  }
  
  // Suggest kg for large gram quantities
  if (currentUnit === 'g' && quantity >= 1000) {
    return {
      shouldChange: true,
      suggestedUnit: 'kg',
      suggestedQuantity: quantity / 1000,
      reason: 'Large quantities are better expressed in kg'
    };
  }
  
  // Suggest g for small kg quantities
  if (currentUnit === 'kg' && quantity < 1) {
    return {
      shouldChange: true,
      suggestedUnit: 'g',
      suggestedQuantity: quantity * 1000,
      reason: 'Small quantities are better expressed in g'
    };
  }
  
  // Suggest l for large ml quantities
  if (currentUnit === 'ml' && quantity >= 1000) {
    return {
      shouldChange: true,
      suggestedUnit: 'l',
      suggestedQuantity: quantity / 1000,
      reason: 'Large quantities are better expressed in l'
    };
  }
  
  // Suggest ml for small l quantities
  if (currentUnit === 'l' && quantity < 1) {
    return {
      shouldChange: true,
      suggestedUnit: 'ml',
      suggestedQuantity: quantity * 1000,
      reason: 'Small quantities are better expressed in ml'
    };
  }
  
  return {
    shouldChange: false,
    reason: 'Unit is appropriate for the quantity'
  };
}

module.exports = {
  getAllowedUnits,
  isUnitAllowed,
  validateIngredientUnit,
  validateRecipeUnits,
  suggestBetterUnit
};
