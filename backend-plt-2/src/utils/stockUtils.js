const Product = require('../models/Product');
const StockBalance = require('../models/StockBalance');

/**
 * Check stock availability for a product (both regular and composite)
 * @param {string} productId - Product ID
 * @param {string} storeId - Store ID  
 * @param {number} requiredQuantity - Required quantity
 * @returns {Promise<{isAvailable: boolean, availableStock: number, product: Object}>}
 */
async function checkProductStock(productId, storeId, requiredQuantity) {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  let availableStock = 0;
  
  if (product.isComposite) {
    // For composite products, check compositeInfo.currentStock
    availableStock = product.compositeInfo?.currentStock || 0;
  } else {
    // For regular products, check StockBalance
    const stockBalance = await StockBalance.findOne({
      productId: productId,
      storeId: storeId
    });
    availableStock = stockBalance?.quantity || 0;
  }

  return {
    isAvailable: availableStock >= requiredQuantity,
    availableStock: availableStock,
    product: product
  };
}

/**
 * Update stock for a product (both regular and composite)
 * @param {string} productId - Product ID
 * @param {string} storeId - Store ID
 * @param {number} quantity - Quantity to reduce (positive number)
 * @param {string} reason - Reason for stock update (optional)
 * @returns {Promise<Object>}
 */
async function updateProductStock(productId, storeId, quantity, reason = 'Order sale') {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  let result = null;
  
  if (product.isComposite) {
    // For composite products, update compositeInfo.currentStock
    result = await Product.findByIdAndUpdate(
      productId,
      { 
        $inc: { 'compositeInfo.currentStock': -quantity },
        'compositeInfo.lastServedAt': new Date()
      },
      { new: true }
    );
    
    console.log(`Updated composite product ${product.name}: reduced currentStock by ${quantity} (${reason})`);
  } else {
    // For regular products, update StockBalance
    result = await StockBalance.findOneAndUpdate(
      { productId: productId, storeId: storeId },
      { $inc: { quantity: -quantity } },
      { new: true }
    );
    
    console.log(`Updated regular product ${product.name}: reduced stock balance by ${quantity} (${reason})`);
  }

  return {
    product: product,
    updatedStock: result,
    stockType: product.isComposite ? 'composite' : 'regular'
  };
}

/**
 * Get current stock for a product
 * @param {string} productId - Product ID
 * @param {string} storeId - Store ID
 * @returns {Promise<{currentStock: number, stockType: string, product: Object}>}
 */
async function getCurrentStock(productId, storeId) {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  let currentStock = 0;
  let stockType = '';
  
  if (product.isComposite) {
    currentStock = product.compositeInfo?.currentStock || 0;
    stockType = 'composite';
  } else {
    const stockBalance = await StockBalance.findOne({
      productId: productId,
      storeId: storeId
    });
    currentStock = stockBalance?.quantity || 0;
    stockType = 'regular';
  }

  return {
    currentStock: currentStock,
    stockType: stockType,
    product: product
  };
}

module.exports = {
  checkProductStock,
  updateProductStock,
  getCurrentStock
};