/**
 * Utility functions for handling MongoDB Decimal128 format and other common operations
 */

/**
 * Parse MongoDB Decimal128 value to JavaScript number
 * @param {Object|number|string} value - Value that might be in Decimal128 format
 * @returns {number} Parsed numeric value
 */
export const parseDecimal = (value) => {
  if (!value) return 0;
  
  // Handle MongoDB Decimal128 format
  if (typeof value === 'object' && value.$numberDecimal) {
    const parsed = parseFloat(value.$numberDecimal);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  // Handle regular number or string
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Parse composite product data from API response
 * @param {Object} compositeProductData - Raw composite product data from API
 * @returns {Object} Parsed composite product data with proper numeric values
 */
export const parseCompositeProductData = (compositeProductData) => {
  if (!compositeProductData) return null;

  return {
    ...compositeProductData,
    price: parseDecimal(compositeProductData.price),
    retailPrice: parseDecimal(compositeProductData.retailPrice),
    costPrice: parseDecimal(compositeProductData.costPrice),
    compositeInfo: compositeProductData.compositeInfo ? {
      ...compositeProductData.compositeInfo,
      recipeCost: parseDecimal(compositeProductData.compositeInfo.recipeCost),
      currentStock: compositeProductData.compositeInfo.currentStock || 0,
      expiryHours: compositeProductData.compositeInfo.expiryHours || 24,
      capacity: compositeProductData.compositeInfo.capacity || { quantity: 1, unit: 'phần' },
      childProducts: compositeProductData.compositeInfo.childProducts?.map(child => ({
        ...child,
        quantityPerServing: parseFloat(child.quantityPerServing) || 1,
        unit: child.unit || 'piece',
        costPrice: parseDecimal(child.costPrice),
        sellingPrice: parseDecimal(child.sellingPrice),
        retailPrice: parseDecimal(child.retailPrice),
        productId: typeof child.productId === 'object' ? {
          ...child.productId,
          costPrice: parseDecimal(child.productId.costPrice),
          retailPrice: parseDecimal(child.productId.retailPrice)
        } : child.productId
      })) || []
    } : {},
    // Parse recipe data if exists
    compositeInfo: compositeProductData.compositeInfo ? {
      ...compositeProductData.compositeInfo,
      recipeCost: parseDecimal(compositeProductData.compositeInfo.recipeCost),
      currentStock: compositeProductData.compositeInfo.currentStock || 0,
      expiryHours: compositeProductData.compositeInfo.expiryHours || 24,
      capacity: compositeProductData.compositeInfo.capacity || { quantity: 1, unit: 'phần' },
      // Parse recipe ingredients if exists
      recipeId: compositeProductData.compositeInfo.recipeId ? {
        ...compositeProductData.compositeInfo.recipeId,
        ingredients: compositeProductData.compositeInfo.recipeId.ingredients?.map(recipeIngredient => ({
          ...recipeIngredient,
          amountUsed: parseFloat(recipeIngredient.amountUsed) || 0,
          ingredientId: recipeIngredient.ingredientId ? {
            ...recipeIngredient.ingredientId,
            standardCost: parseDecimal(recipeIngredient.ingredientId.standardCost),
            costPrice: parseDecimal(recipeIngredient.ingredientId.costPrice),
            stockQuantity: parseFloat(recipeIngredient.ingredientId.stockQuantity) || 0
          } : recipeIngredient.ingredientId
        })) || []
      } : compositeProductData.compositeInfo.recipeId,
      childProducts: compositeProductData.compositeInfo.childProducts?.map(child => ({
        ...child,
        quantityPerServing: parseFloat(child.quantityPerServing) || 1,
        unit: child.unit || 'piece',
        costPrice: parseDecimal(child.costPrice),
        sellingPrice: parseDecimal(child.sellingPrice),
        retailPrice: parseDecimal(child.retailPrice),
        productId: typeof child.productId === 'object' ? {
          ...child.productId,
          costPrice: parseDecimal(child.productId.costPrice),
          retailPrice: parseDecimal(child.productId.retailPrice)
        } : child.productId
      })) || []
    } : {}
  };
};

/**
 * Format price in Vietnamese currency format
 * @param {number|Object} price - Price value (may be Decimal128)
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  const numericPrice = parseDecimal(price);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numericPrice);
};

/**
 * Format number with thousand separators
 * @param {number|Object} value - Numeric value (may be Decimal128)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  const numericValue = parseDecimal(value);
  return new Intl.NumberFormat('vi-VN').format(numericValue);
};

/**
 * Calculate percentage
 * @param {number|Object} value - Current value
 * @param {number|Object} total - Total value
 * @returns {number} Percentage (0-100)
 */
export const calculatePercentage = (value, total) => {
  const numericValue = parseDecimal(value);
  const numericTotal = parseDecimal(total);
  
  if (numericTotal === 0) return 0;
  return Math.round((numericValue / numericTotal) * 100);
};

/**
 * Format hours elapsed to human readable format
 * @param {number} hours - Hours elapsed
 * @returns {string} Formatted time string
 */
export const formatHoursElapsed = (hours) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h`;
};

/**
 * Check if a value is a valid positive number
 * @param {any} value - Value to check
 * @returns {boolean} True if valid positive number
 */
export const isValidPositiveNumber = (value) => {
  const numeric = parseDecimal(value);
  return !isNaN(numeric) && numeric > 0;
};

/**
 * Safe division that handles zero divisor
 * @param {number|Object} dividend - Number to divide
 * @param {number|Object} divisor - Number to divide by
 * @param {number} defaultValue - Default value if divisor is zero
 * @returns {number} Result of division or default value
 */
export const safeDivide = (dividend, divisor, defaultValue = 0) => {
  const numericDividend = parseDecimal(dividend);
  const numericDivisor = parseDecimal(divisor);
  
  if (numericDivisor === 0) return defaultValue;
  return numericDividend / numericDivisor;
};
