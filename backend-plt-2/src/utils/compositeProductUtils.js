const Product = require('../models/Product');

/**
 * Kiểm tra xem sản phẩm composite có hết hạn không
 */
const checkCompositeExpiry = (compositeProduct) => {
  if (!compositeProduct.compositeInfo.lastPreparedAt) {
    return { expired: false, hoursElapsed: 0 };
  }

  const hoursElapsed = (new Date() - compositeProduct.compositeInfo.lastPreparedAt) / (1000 * 60 * 60);
  const expired = hoursElapsed > compositeProduct.compositeInfo.expiryHours;

  return {
    expired,
    hoursElapsed,
    timeRemaining: Math.max(0, compositeProduct.compositeInfo.expiryHours - hoursElapsed)
  };
};

/**
 * Tính toán cost của sản phẩm composite dựa trên child products
 */
const calculateCompositeCost = async (childProducts) => {
  let totalCost = 0;

  for (const childProduct of childProducts) {
    const product = await Product.findById(childProduct.productId);
    if (product) {
      const childCost = parseFloat(product.costPrice) * childProduct.quantityPerServing;
      totalCost += childCost;
    }
  }

  return totalCost;
};

/**
 * Kiểm tra availability của child products để chuẩn bị composite
 */
const checkChildProductsAvailability = async (compositeProduct, batchesToPrepare = 1) => {
  const requirements = [];
  const unavailable = [];

  for (const childProductInfo of compositeProduct.compositeInfo.childProducts) {
    const childProduct = await Product.findById(childProductInfo.productId);
    
    if (!childProduct) {
      unavailable.push({
        productId: childProductInfo.productId,
        reason: 'product_not_found'
      });
      continue;
    }

    const totalNeeded = childProductInfo.quantityPerServing * 
                       compositeProduct.compositeInfo.capacity.quantity * 
                       batchesToPrepare;

    requirements.push({
      productId: childProduct._id,
      productName: childProduct.name,
      quantityNeeded: totalNeeded,
      unit: childProductInfo.unit,
      // TODO: Add actual stock checking from inventory
      availableStock: 0,
      sufficient: false // Will be updated when inventory checking is implemented
    });
  }

  return {
    requirements,
    unavailable,
    canPrepare: unavailable.length === 0 // Will need to check stock sufficiency too
  };
};

/**
 * Tự động làm sạch sản phẩm composite hết hạn
 * Gọi function này định kỳ hoặc khi cần thiết
 */
const cleanExpiredComposites = async (ownerId, storeId = null) => {
  try {
    let filter = {
      ownerId: ownerId,
      isComposite: true,
      deleted: false,
      'compositeInfo.currentStock': { $gt: 0 },
      'compositeInfo.lastPreparedAt': { $exists: true, $ne: null }
    };

    if (storeId) {
      filter.storeId = storeId;
    }

    const compositeProducts = await Product.find(filter);
    const expiredProducts = [];

    for (const product of compositeProducts) {
      const expiryInfo = checkCompositeExpiry(product);
      if (expiryInfo.expired) {
        // Reset stock của sản phẩm hết hạn
        product.compositeInfo.currentStock = 0;
        await product.save();
        
        expiredProducts.push({
          productId: product._id,
          productName: product.name,
          expiredStock: product.compositeInfo.currentStock,
          hoursOverdue: expiryInfo.hoursElapsed - product.compositeInfo.expiryHours
        });
      }
    }

    return {
      cleanedCount: expiredProducts.length,
      expiredProducts
    };
  } catch (error) {
    console.error('Error cleaning expired composites:', error);
    throw error;
  }
};

/**
 * Lấy thống kê về composite products
 */
const getCompositeStats = async (ownerId, storeId = null) => {
  try {
    let filter = {
      ownerId: ownerId,
      isComposite: true,
      deleted: false
    };

    if (storeId) {
      filter.storeId = storeId;
    }

    const compositeProducts = await Product.find(filter);
    
    let totalProducts = compositeProducts.length;
    let activeProducts = 0;
    let expiredProducts = 0;
    let expiringSoonProducts = 0;
    let totalStock = 0;

    for (const product of compositeProducts) {
      totalStock += product.compositeInfo.currentStock;
      
      if (product.compositeInfo.currentStock > 0) {
        const expiryInfo = checkCompositeExpiry(product);
        
        if (expiryInfo.expired) {
          expiredProducts++;
        } else if (expiryInfo.timeRemaining <= 2) { // Hết hạn trong 2 giờ
          expiringSoonProducts++;
        } else {
          activeProducts++;
        }
      }
    }

    return {
      totalProducts,
      activeProducts,
      expiredProducts,
      expiringSoonProducts,
      totalStock,
      averageStockPerProduct: totalProducts > 0 ? totalStock / totalProducts : 0
    };
  } catch (error) {
    console.error('Error getting composite stats:', error);
    throw error;
  }
};

module.exports = {
  checkCompositeExpiry,
  calculateCompositeCost,
  checkChildProductsAvailability,
  cleanExpiredComposites,
  getCompositeStats
};
