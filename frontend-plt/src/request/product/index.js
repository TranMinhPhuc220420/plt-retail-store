import { deleteApi, get, getApi, post, postApi, putApi } from "@/request";

// Fetch all products
export const getAllProducts = async () => {
  try {
    const response = await get('/products/all');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all products:', error);
    throw error;
  }
};

// Fetch product details by ID
export const getProductDetail = async (id) => {
  try {
    const response = await get(`/products/detail/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch product details for ID ${id}:`, error);
    throw error;
  }
};

// Delete a product by ID
export const deleteProduct = async (id) => {
  try {
    const response = await post(`/products/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete product with ID ${id}:`, error);
    throw error;
  }
};

// Fetch all products owned by the user
export const getMyProducts = async (storeCode) => {
  try {
    const response = await getApi(`/products/my-products-stores/${storeCode}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch my products:', error);
    throw error;
  }
};

// Create a new product for the user
export const createMyProduct = async (productData) => {
  try {
    const response = await postApi('/products/my-products-stores', productData);
    return response.data;
  } catch (error) {
    // Handle child product restriction error specially
    if (error.response?.status === 400 && error.response?.data?.error === 'child_product_restricted_fields') {
      throw error.response.data;
    }
    
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_PRODUCT_CREATION_FAILED';
  }
};

// Create multiple products from an Excel file
export const createMyProductTypeBulk = async (storeCode, products) => {
  try {
    const response = await post('/products/my-product-bulk', { storeCode, products }, {
    });
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_PRODUCT_CREATION_BULK_FAILED';
  }
};

// Fetch details of a specific product owned by the user
export const getMyProductDetail = async (id) => {
  try {
    const response = await get(`/products/my-product/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch my product details for ID ${id}:`, error);
    throw error;
  }
};

// Update a specific product owned by the user
export const updateMyProduct = async (id, productData) => {
  try {
    const response = await putApi(`/products/my-products-stores/${id}`, productData);
    return response.data;
  } catch (error) {
    // Handle child product restriction error specially
    if (error.response?.status === 400 && error.response?.data?.error === 'child_product_restricted_fields') {
      throw error.response.data;
    }
    
    let msgError = error.response?.data?.error;
    throw msgError || 'TXT_PRODUCT_UPDATE_FAILED';
  }
};

// Delete a specific product owned by the user
export const deleteMyProduct = async (id, storeCode) => {
  try {
    const response = await deleteApi(`/products/my-products-stores/${id}`, { storeCode });
    return response.data;
  } catch (error) {
    console.error(`Failed to delete my product with ID ${id}:`, error);
    throw error;
  }
};

// Fetch products of a specific store owned by the user
export const getMyProductsByStore = async (storeId) => {
  try {
    const response = await get(`/products/my-products/store/${storeId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch my products for store ID ${storeId}:`, error);
    throw error;
  }
};

// Fetch products of a specific store (public)
export const getProductsByStore = async (storeId) => {
  try {
    const response = await get(`/products/store/${storeId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch products for store ID ${storeId}:`, error);
    throw error;
  }
};

export const uploadAvatarProduct = async (file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await post('/upload/products', formData, {
      'Content-Type': 'multipart/form-data',
    });

    let imageUrl;
    if (response.data && response.data.url) {
      imageUrl = response.data.url;
    } else {
      throw 'TXT_AVATAR_UPLOAD_FAILED';
    }

    return imageUrl;
  } catch (error) {
    console.error('Failed to upload store avatar:', error);
    throw error;
  }
};

export const downloadFileTemplateProduct = async () => {
  window.open(PRODUCT_TYPE_TEMP_FILE, '_blank');
}

// Check if product is a child product of composite product
export const checkChildProductStatus = async (productId) => {
  try {
    const response = await getApi(`/products/check-child-status/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to check child product status for ID ${productId}:`, error);
    throw error;
  }
};