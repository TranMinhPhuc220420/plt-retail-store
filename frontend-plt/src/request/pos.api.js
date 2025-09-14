import { getApi, postApi, putApi, deleteApi } from './index';

// Create a request object with common methods
const request = {
  get: getApi,
  post: postApi,
  put: putApi,
  delete: deleteApi
};

export const orderAPI = {
  // Get all orders with filters
  getOrders: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request.get(`/orders?${queryString}`);
  },

  // Get order by ID
  getOrderById: (id) => {
    return request.get(`/orders/${id}`);
  },

  // Create new order
  createOrder: (orderData) => {
    return request.post(`/orders`, orderData);
  },

  // Create demo order (for testing)
  createDemoOrder: (orderData) => {
    return request.post(`/demo/orders`, orderData);
  },

  // Update order status
  updateOrderStatus: (id, statusData) => {
    return request.put(`/orders/${id}/status`, statusData);
  },

  // Cancel order
  cancelOrder: (id, reason) => {
    return request.put(`/orders/${id}/cancel`, { reason });
  },

  // Get sales statistics
  getSalesStatistics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request.get(`/orders/statistics?${queryString}`);
  }
};

export const productAPI = {
  // Get all products for POS by storeCode (including both regular and composite)
  getProductsByStore: (storeCode) => {
    return request.get(`/products/pos/${storeCode}`);
  },

  // Get product by ID
  getProductById: (id) => {
    return request.get(`/products/my-products/${id}`);
  },

  // Search products by name or code
  searchProducts: (storeCode, searchTerm) => {
    return request.get(`/products/pos/${storeCode}?search=${encodeURIComponent(searchTerm)}`);
  },

  // Get only regular products (legacy endpoint)
  getRegularProductsByStore: (storeCode) => {
    return request.get(`/products/my-products-stores/${storeCode}`);
  }
};

export const categoryAPI = {
  // Get all product categories by storeCode
  getCategoriesByStore: (storeCode) => {
    return request.get(`/product-categories/my-categories-stores/${storeCode}`);
  }
};

export const inventoryAPI = {
  // Check stock balance
  getStockBalance: (productId, storeId) => {
    return request.get(`/inventory/stock-balance?productId=${productId}&storeId=${storeId}`);
  },

  // Get inventory for store
  getInventoryByStore: (storeId) => {
    return request.get(`/inventory?storeId=${storeId}`);
  }
};

export const employeeAPI = {
  // Get current employee info
  getCurrentEmployee: () => {
    return request.get(`/employees/current`);
  },

  // Get employee by ID
  getEmployeeById: (id) => {
    return request.get(`/employees/${id}`);
  }
};

export const storeAPI = {
  // Get store info by storeCode  
  getStoreByCode: (storeCode) => {
    return request.get(`/stores/my-store/${storeCode}`);
  },

  // Get store by ID
  getStoreById: (id) => {
    return request.get(`/stores/my-store/${id}`);
  }
};

// POS specific utilities
export const posAPI = {
  // Get all data needed for POS
  getPOSData: async (storeCode) => {
    try {
      const [products, categories, store] = await Promise.all([
        productAPI.getProductsByStore(storeCode),
        categoryAPI.getCategoriesByStore(storeCode),
        storeAPI.getStoreByCode(storeCode)
      ]);

      return {
        products: products.data,
        categories: categories.data,
        store: store.data
      };
    } catch (error) {
      console.error('Error fetching POS data:', error);
      throw error;
    }
  },

  // Validate order before processing
  validateOrder: (orderData) => {
    const errors = [];

    if (!orderData) {
      errors.push('Dữ liệu đơn hàng không hợp lệ');
      return { isValid: false, errors };
    }

    if (!orderData.items || orderData.items.length === 0) {
      errors.push('Đơn hàng phải có ít nhất một sản phẩm');
    }

    if (!orderData.employeeId) {
      errors.push('Thiếu thông tin nhân viên');
    }

    if (!orderData.storeCode) {
      errors.push('Thiếu thông tin cửa hàng');
    }

    if (!orderData.paymentMethod) {
      errors.push('Vui lòng chọn phương thức thanh toán');
    }

    orderData.items?.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Sản phẩm thứ ${index + 1} không hợp lệ`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Số lượng sản phẩm thứ ${index + 1} phải lớn hơn 0`);
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors.push(`Giá sản phẩm thứ ${index + 1} không hợp lệ`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Process sale transaction
  processSale: async (orderData) => {
    try {
      // Validate order first
      const validation = posAPI.validateOrder(orderData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Use production order endpoint
      const response = await orderAPI.createOrder(orderData);
      return response;
    } catch (error) {
      console.error('Error processing sale:', error);
      throw error;
    }
  }
};

export default {
  orderAPI,
  productAPI,
  categoryAPI,
  inventoryAPI,
  employeeAPI,
  storeAPI,
  posAPI
};
