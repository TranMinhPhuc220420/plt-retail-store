/**
 * Unit Converter Utility
 * Provides functions to convert units and standardize measurements
 * This ensures consistency between ingredient stock units and recipe requirement units
 */

// Standard base units (simplified to kg and liter only)
const BASE_UNITS = {
  WEIGHT: 'kg',  // kilograms for weight
  VOLUME: 'l'    // liters for volume
};

// Unit conversion factors (simplified to kg and liter only)
const UNIT_CONVERSIONS = {
  // Weight conversions (only kg)
  'kg': 1,
  
  // Volume conversions (only liter)
  'l': 1
};

// Unit categories (simplified)
const UNIT_CATEGORIES = {
  WEIGHT: ['kg'],
  VOLUME: ['l']
};

/**
 * Get the category of a unit
 * @param {string} unit - The unit to categorize
 * @returns {string|null} The category or null if unknown
 */
function getUnitCategory(unit) {
  for (const [category, units] of Object.entries(UNIT_CATEGORIES)) {
    if (units.includes(unit)) {
      return category;
    }
  }
  return null;
}

/**
 * Check if two units are compatible (can be converted between each other)
 * @param {string} unit1 - First unit
 * @param {string} unit2 - Second unit
 * @returns {boolean} True if units are compatible
 */
function areUnitsCompatible(unit1, unit2) {
  const category1 = getUnitCategory(unit1);
  const category2 = getUnitCategory(unit2);
  
  // Units are compatible if they're in the same category
  return category1 && category2 && category1 === category2;
}

/**
 * Convert a quantity from one unit to another
 * @param {number} quantity - The quantity to convert
 * @param {string} fromUnit - The source unit
 * @param {string} toUnit - The target unit
 * @returns {number|null} The converted quantity or null if conversion is not possible
 */
function convertUnit(quantity, fromUnit, toUnit) {
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    return null; // Cannot convert between incompatible units
  }
  
  if (fromUnit === toUnit) {
    return quantity; // Same unit, no conversion needed
  }
  
  const fromFactor = UNIT_CONVERSIONS[fromUnit];
  const toFactor = UNIT_CONVERSIONS[toUnit];
  
  if (!fromFactor || !toFactor) {
    return null; // Unknown unit
  }
  
  // Convert to base unit first, then to target unit
  const baseQuantity = quantity * fromFactor;
  const convertedQuantity = baseQuantity / toFactor;
  
  return convertedQuantity;
}

/**
 * Get the base unit for a given unit category
 * @param {string} unit - The unit to get base unit for
 * @returns {string|null} The base unit or null if unknown
 */
function getBaseUnit(unit) {
  const category = getUnitCategory(unit);
  switch (category) {
    case 'WEIGHT':
      return BASE_UNITS.WEIGHT;
    case 'VOLUME':
      return BASE_UNITS.VOLUME;
    case 'COUNT':
      return unit; // Count-based units don't have a base unit conversion
    default:
      return null;
  }
}

/**
 * Convert quantity to base unit
 * @param {number} quantity - The quantity to convert
 * @param {string} unit - The source unit
 * @returns {Object} Object with convertedQuantity and baseUnit, or null if conversion failed
 */
function convertToBaseUnit(quantity, unit) {
  const baseUnit = getBaseUnit(unit);
  if (!baseUnit) {
    return null;
  }
  
  const convertedQuantity = convertUnit(quantity, unit, baseUnit);
  if (convertedQuantity === null) {
    return null;
  }
  
  return {
    quantity: convertedQuantity,
    unit: baseUnit
  };
}

/**
 * Check if ingredient stock is sufficient for recipe requirement
 * Takes care of unit conversion automatically
 * @param {number} stockQuantity - Available stock quantity
 * @param {string} stockUnit - Unit of the stock
 * @param {number} requiredQuantity - Required quantity for recipe
 * @param {string} requiredUnit - Unit of the requirement
 * @returns {Object} Object with isAvailable, stockInRequiredUnit, message
 */
function checkIngredientAvailability(stockQuantity, stockUnit, requiredQuantity, requiredUnit) {
  // Check if units are compatible
  if (!areUnitsCompatible(stockUnit, requiredUnit)) {
    return {
      isAvailable: false,
      stockInRequiredUnit: null,
      message: `Cannot compare ${stockUnit} with ${requiredUnit} - incompatible unit types`
    };
  }
  
  // Convert stock quantity to required unit for comparison
  const stockInRequiredUnit = convertUnit(stockQuantity, stockUnit, requiredUnit);
  
  if (stockInRequiredUnit === null) {
    return {
      isAvailable: false,
      stockInRequiredUnit: null,
      message: `Failed to convert ${stockUnit} to ${requiredUnit}`
    };
  }
  
  const isAvailable = stockInRequiredUnit >= requiredQuantity;
  
  return {
    isAvailable,
    stockInRequiredUnit,
    message: isAvailable 
      ? `Sufficient stock: ${stockInRequiredUnit} ${requiredUnit} available, ${requiredQuantity} ${requiredUnit} required`
      : `Insufficient stock: ${stockInRequiredUnit} ${requiredUnit} available, ${requiredQuantity} ${requiredUnit} required`
  };
}

/**
 * Get recommended units for frontend dropdowns
 * Returns only kg and liter as requested for simplification
 * @returns {Object} Object with weight and volume unit arrays
 */
function getRecommendedUnits() {
  return {
    weight: ['kg'],  // Only kilograms
    volume: ['l']    // Only liters
  };
}

module.exports = {
  convertUnit,
  areUnitsCompatible,
  getUnitCategory,
  getBaseUnit,
  convertToBaseUnit,
  checkIngredientAvailability,
  getRecommendedUnits,
  BASE_UNITS,
  UNIT_CONVERSIONS,
  UNIT_CATEGORIES
};
