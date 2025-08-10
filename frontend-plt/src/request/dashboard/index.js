import { apiClient } from '../index';

/**
 * Dashboard API Service
 * This module handles all API calls related to the dashboard functionality
 * Updated to use actual backend endpoints
 */

// Get current user's store information
export const getCurrentStore = async () => {
  try {
    const response = await apiClient.get('/api/stores/my-stores');
    return response.data[0]; // Get the first store for the current user
  } catch (error) {
    console.error('Failed to fetch current store:', error);
    throw error;
  }
};

// Sales Overview APIs using available endpoints
export const getSalesOverview = async (storeCode) => {
  try {
    // Get inventory data to calculate basic metrics
    const [inventoryData, productData] = await Promise.all([
      apiClient.get(`/api/inventory/balances/${storeCode}`),
      apiClient.get(`/api/products/my-products-stores/${storeCode}`)
    ]);

    // Calculate basic metrics from available data
    const totalProducts = productData.data?.length || 0;
    const totalInventoryValue = inventoryData.data?.reduce((sum, item) => 
      sum + (item.currentQuantity * (item.averageCost || 0)), 0) || 0;

    return {
      todayRevenue: { value: 0, trend: 'up', percentageChange: 0 }, // Placeholder - need sales API
      weekRevenue: { value: 0, trend: 'up', percentageChange: 0 },
      monthRevenue: { value: 0, trend: 'up', percentageChange: 0 },
      todayOrders: { value: 0, percentageChange: 0 },
      weekOrders: { value: 0, percentageChange: 0 },
      monthOrders: { value: 0, percentageChange: 0 },
      todayProducts: { value: totalProducts, percentageChange: 0 },
      weekProducts: { value: totalProducts, percentageChange: 0 },
      monthProducts: { value: totalProducts, percentageChange: 0 },
      totalInventoryValue: totalInventoryValue
    };
  } catch (error) {
    console.error('Failed to fetch sales overview:', error);
    throw error;
  }
};

// Revenue Chart data - using inventory transaction history as proxy
export const getRevenueData = async (storeCode, period = '30d') => {
  try {
    const response = await apiClient.get(`/api/inventory/transactions/${storeCode}`, {
      params: { 
        type: 'out', // Stock out transactions represent sales
        limit: 100 
      }
    });

    // Transform transaction data into revenue chart format
    const transactions = response.data?.transactions || [];
    const revenueData = transactions.map(transaction => ({
      date: transaction.transactionDate,
      value: transaction.quantity * (transaction.unitCost || 0),
      category: 'Sales Revenue'
    }));

    return revenueData;
  } catch (error) {
    console.error('Failed to fetch revenue data:', error);
    return [];
  }
};

// Best Selling Products using inventory data
export const getBestSellingProducts = async (storeCode, limit = 10) => {
  try {
    const [inventoryResponse, productsResponse] = await Promise.all([
      apiClient.get(`/api/inventory/balances/${storeCode}`),
      apiClient.get(`/api/products/my-products-stores/${storeCode}`)
    ]);

    const inventory = inventoryResponse.data || [];
    const products = productsResponse.data || [];

    // Ensure we have arrays
    if (!Array.isArray(inventory) || !Array.isArray(products)) {
      console.warn('Best selling products API returned non-array data:', { inventory, products });
      return { pieData: [], barData: [] };
    }

    // Create product map for easy lookup
    const productMap = products.reduce((map, product) => {
      map[product._id] = product;
      return map;
    }, {});

    // Calculate "sales" based on inventory turnover (initial - current stock)
    const salesData = inventory
      .map(item => {
        const product = productMap[item.productId];
        if (!product) return null;

        // Estimate sales based on low stock levels (assuming initial stock was higher)
        const estimatedSales = Math.max(0, (item.reorderLevel || 50) - item.currentQuantity);
        
        return {
          productId: item.productId,
          name: product.name,
          category: product.category?.name || 'Uncategorized',
          estimatedSales: estimatedSales,
          currentStock: item.currentQuantity
        };
      })
      .filter(item => item && item.estimatedSales > 0)
      .sort((a, b) => b.estimatedSales - a.estimatedSales)
      .slice(0, limit);

    // Format for pie chart
    const pieData = salesData.map(item => ({
      type: item.name,
      value: item.estimatedSales
    }));

    // Format for bar chart
    const barData = salesData.map(item => ({
      product: item.name,
      value: item.estimatedSales
    }));

    return { pieData, barData };
  } catch (error) {
    console.error('Failed to fetch best selling products:', error);
    return { pieData: [], barData: [] };
  }
};

// Recent Orders - using inventory transactions as proxy
export const getRecentOrders = async (storeCode, limit = 10) => {
  try {
    const response = await apiClient.get(`/api/inventory/transactions/${storeCode}`, {
      params: { 
        type: 'out',
        limit: limit
      }
    });

    const transactions = response.data?.transactions || [];
    
    // Ensure we have an array
    if (!Array.isArray(transactions)) {
      console.warn('Transactions API returned non-array data:', transactions);
      return [];
    }
    
    // Transform transactions into "order" format
    const orders = transactions.map((transaction, index) => ({
      orderId: `TXN-${transaction._id?.slice(-8) || Math.random().toString(36).substr(2, 8)}`,
      customerName: transaction.remarks || `Transaction ${index + 1}`,
      itemCount: 1,
      total: transaction.quantity * (transaction.unitCost || 0),
      status: 'completed',
      createdAt: transaction.transactionDate
    }));

    return orders;
  } catch (error) {
    console.error('Failed to fetch recent orders:', error);
    return [];
  }
};

// Low Stock Products using actual inventory API
export const getLowStockProducts = async (storeCode) => {
  try {
    const response = await apiClient.get(`/api/inventory/low-stock/${storeCode}`);
    const lowStockData = response.data || [];

    // Ensure we have an array
    if (!Array.isArray(lowStockData)) {
      console.warn('Low stock API returned non-array data:', lowStockData);
      return [];
    }

    // Transform to dashboard format
    const lowStockProducts = lowStockData.map(item => ({
      id: item._id,
      name: item.product?.name || 'Unknown Product',
      sku: item.product?.sku || 'N/A',
      currentStock: item.currentQuantity || 0,
      minStock: item.reorderLevel || 10,
      image: item.product?.image || null,
      productId: item.productId
    }));

    return lowStockProducts;
  } catch (error) {
    console.error('Failed to fetch low stock products:', error);
    return [];
  }
};

// Inventory notifications based on low stock
export const getInventoryNotifications = async (storeCode) => {
  try {
    const lowStockProducts = await getLowStockProducts(storeCode);
    
    const notifications = lowStockProducts.map(product => {
      const stockPercentage = (product.currentStock / product.minStock) * 100;
      let type = 'warning';
      let title = 'Low Stock Alert';
      
      if (product.currentStock === 0) {
        type = 'error';
        title = 'Out of Stock';
      } else if (stockPercentage <= 25) {
        type = 'error';
        title = 'Critical Stock Level';
      }

      return {
        id: `stock-${product.id}`,
        type: type,
        title: title,
        message: `${product.name} has ${product.currentStock} units remaining (minimum: ${product.minStock})`,
        createdAt: new Date().toISOString(),
        read: false,
        productId: product.productId
      };
    });

    return notifications;
  } catch (error) {
    console.error('Failed to fetch inventory notifications:', error);
    return [];
  }
};

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    // Get user's stores first
    const storesResponse = await apiClient.get('/api/stores/my-stores');
    const stores = storesResponse.data || [];
    
    if (stores.length === 0) {
      throw new Error('No stores found for current user');
    }

    const storeCode = stores[0].storeCode;
    
    // Get all dashboard data
    const [salesOverview, lowStockProducts, notifications] = await Promise.all([
      getSalesOverview(storeCode),
      getLowStockProducts(storeCode),
      getInventoryNotifications(storeCode)
    ]);

    return {
      salesOverview,
      lowStockCount: lowStockProducts.length,
      unreadNotifications: notifications.filter(n => !n.read).length,
      storeCode
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    throw error;
  }
};

// Reorder product functionality
export const reorderProduct = async (productId, quantity, storeCode) => {
  try {
    // Use stock-in endpoint to reorder
    const response = await apiClient.post('/api/inventory/stock-in', {
      storeCode: storeCode,
      productId: productId,
      quantity: quantity,
      unitCost: 0, // Will be updated with actual cost
      supplierId: null,
      remarks: `Reorder request for ${quantity} units`,
      expiryDate: null
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to reorder product:', error);
    throw error;
  }
};

// Export functionality using existing data
export const exportSalesReport = async (storeCode, format, period) => {
  try {
    const [salesOverview, inventoryData, transactions] = await Promise.all([
      getSalesOverview(storeCode),
      apiClient.get(`/api/inventory/balances/${storeCode}`),
      apiClient.get(`/api/inventory/transactions/${storeCode}`, { params: { limit: 1000 } })
    ]);

    const reportData = {
      salesOverview,
      inventory: inventoryData.data,
      transactions: transactions.data?.transactions || [],
      generatedAt: new Date().toISOString(),
      storeCode,
      period
    };

    if (format === 'excel') {
      // In a real implementation, you would format this as Excel
      const jsonData = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${storeCode}-${period}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    
    return reportData;
  } catch (error) {
    console.error('Failed to export report:', error);
    throw error;
  }
};

// Real-time updates using polling (since WebSocket is not implemented yet)
export const subscribeToDashboardUpdates = (callback) => {
  let storeCode = null;
  
  const fetchUpdates = async () => {
    try {
      if (!storeCode) {
        const stores = await apiClient.get('/api/stores/my-stores');
        storeCode = stores.data?.[0]?.storeCode;
        if (!storeCode) return;
      }
      
      const stats = await getDashboardStats();
      callback(stats);
    } catch (error) {
      console.error('Failed to fetch real-time updates:', error);
    }
  };
  
  // Initial fetch
  fetchUpdates();
  
  // Poll every 30 seconds
  const interval = setInterval(fetchUpdates, 30000);
  
  return () => clearInterval(interval);
};
