import { deleteApi, get, getApi, post, postApi, putApi } from "@/request";

/**
 * Get all composite products for a store
 * @param {string} [storeCode] - Store code to filter by specific store
 * @returns {Promise<Array>} Array of composite products
 */
export const getMyCompositeProducts = async (storeCode = null) => {
  try {
    const url = storeCode 
      ? `/composite-products/store/${storeCode}`
      : '/composite-products';
    
    const response = await getApi(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch composite products');
  }
};

/**
 * Get composite product details by ID
 * @param {string} id - Composite product ID
 * @param {string} [storeCode] - Store code for additional context
 * @returns {Promise<Object>} Detailed composite product information
 */
export const getCompositeProductDetails = async (id, storeCode = null) => {
  try {
    const url = `/composite-products/${id}/details`;
    const params = storeCode ? { storeCode } : {};
    
    const response = await getApi(url, params);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch composite product details');
  }
};

/**
 * Get regular products (non-composite) to use as child products
 * @param {string} [storeCode] - Store code to filter by specific store
 * @returns {Promise<Array>} Array of regular products
 */
export const getRegularProductsForComposite = async (storeCode = null) => {
  try {
    const url = storeCode 
      ? `/products/regular-products/store/${storeCode}`
      : '/products/regular-products';
    
    const response = await getApi(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch regular products');
  }
};

/**
 * Create a new composite product
 * @param {Object} compositeData - Composite product data
 * @param {string} compositeData.productCode - Unique product code
 * @param {string} compositeData.name - Product name
 * @param {string} [compositeData.description] - Product description
 * @param {string} compositeData.storeId - Store ID
 * @param {Object} compositeData.capacity - Product capacity information
 * @param {number} compositeData.capacity.quantity - Number of servings the composite can provide
 * @param {string} compositeData.capacity.unit - Unit of serving (tô, phần, suất, etc.)
 * @param {Array} compositeData.childProducts - Array of child products
 * @param {string} compositeData.childProducts[].productId - Child product ID
 * @param {number} compositeData.childProducts[].quantityPerServing - Quantity needed per serving
 * @param {string} compositeData.childProducts[].unit - Unit of measurement
 * @param {number} [compositeData.expiryHours] - Hours until expiry (default: 24)
 * @param {number} [compositeData.price] - Wholesale price
 * @param {number} [compositeData.retailPrice] - Retail price
 * @returns {Promise<Object>} Created composite product
 */
export const createCompositeProduct = async (compositeData) => {
  try {
    const response = await postApi('/composite-products', compositeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to create composite product');
  }
};

/**
 * Update an existing composite product
 * @param {string} id - Composite product ID
 * @param {Object} compositeData - Updated composite product data
 * @returns {Promise<Object>} Updated composite product
 */
export const updateCompositeProduct = async (id, compositeData) => {
  try {
    const response = await putApi(`/composite-products/${id}`, compositeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to update composite product');
  }
};

/**
 * Delete a composite product
 * @param {string} id - Composite product ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteCompositeProduct = async (id) => {
  try {
    const response = await deleteApi(`/composite-products/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to delete composite product');
  }
};

/**
 * Prepare composite product (cook a batch)
 * @param {string} id - Composite product ID
 * @param {number} [quantityToPrepare=1] - Number of batches to prepare
 * @returns {Promise<Object>} Preparation result with updated stock information
 */
export const prepareCompositeProduct = async (id, quantityToPrepare = 1) => {
  try {
    const response = await postApi(`/composite-products/${id}/prepare`, {
      quantityToPrepare
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to prepare composite product');
  }
};

/**
 * Serve composite product (sell servings)
 * @param {string} id - Composite product ID
 * @param {number} quantityToServe - Number of servings to serve
 * @returns {Promise<Object>} Service result with remaining stock information
 */
export const serveCompositeProduct = async (id, quantityToServe) => {
  try {
    const response = await postApi(`/composite-products/${id}/serve`, {
      quantityToServe
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to serve composite product');
  }
};

/**
 * Calculate price from recipe for composite product
 * @param {string} recipeId - Recipe ID to calculate price from
 * @param {Object} capacity - Capacity information
 * @param {number} capacity.quantity - Number of servings
 * @param {string} capacity.unit - Unit of serving
 * @param {Object} params - Query parameters like storeCode
 * @returns {Promise<Object>} Calculated pricing information
 */
export const calculatePriceFromRecipe = async (recipeId, capacity, params = {}) => {
  try {
    const response = await postApi('/composite-products/calculate-price-from-recipe', {
      recipeId,
      capacity
    }, params);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to calculate price from recipe');
  }
};

/**
 * Update child product prices only (selling price and retail price)
 * @param {string} id - Composite product ID
 * @param {Array} childProducts - Array of child products with updated prices
 * @returns {Promise<Object>} Updated composite product
 */
export const updateChildProductPrices = async (id, childProducts) => {
  try {
    const response = await putApi(`/composite-products/${id}/child-prices`, {
      childProducts
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to update child product prices');
  }
};
