/**
 * Unit Validation Middleware
 * Validates and standardizes units before saving to database
 */

const { getRecommendedUnits, areUnitsCompatible } = require('../utils/unitConverter');

/**
 * Get allowed units for the system (simplified to kg, liter, and piece)
 * @returns {Array} Array of allowed unit strings
 */
function getAllowedUnits() {
  return ['kg', 'l', 'pice']; // Simplified to only kg, liter, and piece
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
 * Suggest better units for frontend based on quantity (simplified)
 * @param {number} quantity - Quantity value
 * @param {string} currentUnit - Current unit
 * @returns {Object} Suggestion object
 */
function suggestBetterUnit(quantity, currentUnit) {
  if (!isUnitAllowed(currentUnit)) {
    // For old units, suggest kg for weight-like items, l for volume-like items
    if (['g', 'mg', 'kg', 'lb', 'oz'].includes(currentUnit)) {
      return {
        shouldChange: true,
        suggestedUnit: 'kg',
        reason: `Converting ${currentUnit} to kg for consistency`
      };
    }
    if (['ml', 'l', 'cup', 'tbsp', 'tsp'].includes(currentUnit)) {
      return {
        shouldChange: true,
        suggestedUnit: 'l',
        reason: `Converting ${currentUnit} to liter for consistency`
      };
    }
    return {
      shouldChange: true,
      suggestedUnit: 'kg',
      reason: `Unit '${currentUnit}' is not allowed, defaulting to kg`
    };
  }
  
  return {
    shouldChange: false,
    reason: 'Unit is appropriate'
  };
}

module.exports = {
  getAllowedUnits,
  isUnitAllowed,
  validateIngredientUnit,
  validateRecipeUnits,
  suggestBetterUnit
};
