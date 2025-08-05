const Product = require('../models/Product');

/**
 * Kiểm tra xem một sản phẩm có phải là child product của composite product không
 * @param {string} productId - ID của sản phẩm cần kiểm tra
 * @param {string} ownerId - ID của chủ sở hữu
 * @returns {Promise<{isChildProduct: boolean, compositeProduct?: Object}>}
 */
const checkIfChildProduct = async (productId, ownerId) => {
  try {
    // Tìm composite product chứa productId này trong childProducts
    const compositeProduct = await Product.findOne({
      ownerId: ownerId,
      isComposite: true,
      'compositeInfo.childProducts.productId': productId,
      deleted: false
    }).populate('compositeInfo.childProducts.productId');

    if (compositeProduct) {
      return {
        isChildProduct: true,
        compositeProduct: compositeProduct
      };
    }

    return {
      isChildProduct: false
    };
  } catch (error) {
    console.error('Error checking if product is child product:', error);
    return {
      isChildProduct: false
    };
  }
};

/**
 * Lấy thông tin về composite product chứa sản phẩm con
 * @param {string} productId - ID của sản phẩm cần kiểm tra
 * @param {string} ownerId - ID của chủ sở hữu
 * @returns {Promise<Object|null>}
 */
const getCompositeProductInfo = async (productId, ownerId) => {
  try {
    const result = await checkIfChildProduct(productId, ownerId);
    return result.isChildProduct ? result.compositeProduct : null;
  } catch (error) {
    console.error('Error getting composite product info:', error);
    return null;
  }
};

/**
 * Validate xem có thể cập nhật các field bị hạn chế của child product không
 * @param {string} productId - ID của sản phẩm
 * @param {string} ownerId - ID của chủ sở hữu
 * @param {Object} updateData - Dữ liệu cập nhật
 * @returns {Promise<{canUpdate: boolean, restrictedFields: string[], compositeProductName?: string}>}
 */
const validateChildProductUpdate = async (productId, ownerId, updateData) => {
  const restrictedFields = ['price', 'retailPrice', 'costPrice', 'unit'];
  const attemptedRestrictedFields = [];

  // Kiểm tra xem có field nào bị hạn chế trong dữ liệu cập nhật không
  restrictedFields.forEach(field => {
    if (updateData.hasOwnProperty(field)) {
      attemptedRestrictedFields.push(field);
    }
  });

  // Nếu không có field bị hạn chế nào được cập nhật, cho phép
  if (attemptedRestrictedFields.length === 0) {
    return {
      canUpdate: true,
      restrictedFields: []
    };
  }

  // Kiểm tra xem sản phẩm có phải child product không
  const childProductCheck = await checkIfChildProduct(productId, ownerId);
  
  if (childProductCheck.isChildProduct) {
    return {
      canUpdate: false,
      restrictedFields: attemptedRestrictedFields,
      compositeProductName: childProductCheck.compositeProduct.name
    };
  }

  return {
    canUpdate: true,
    restrictedFields: []
  };
};

module.exports = {
  checkIfChildProduct,
  getCompositeProductInfo,
  validateChildProductUpdate
};
