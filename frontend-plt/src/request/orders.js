import { apiClient } from './index';
import axios from 'axios';

// Create a raw API client without transformation interceptors for complex responses
const rawApiClient = axios.create({
  baseURL: import.meta.env.VITE_VERCEL_SERVER_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor but no response transformation
rawApiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Get all orders with pagination and filters
export const getOrders = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/orders', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get order by ID
export const getOrderById = async (id) => {
  try {
    const response = await apiClient.get(`/api/orders/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get employee sales history for admin
export const getEmployeeSalesHistory = async (params = {}) => {
  try {
    const response = await rawApiClient.get('/api/orders/employee-sales-history', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all employees sales summary for admin
export const getEmployeesSalesSummary = async (params = {}) => {
  try {
    const response = await rawApiClient.get('/api/orders/employees-sales-summary', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get sales statistics
export const getSalesStatistics = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/orders/statistics', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create new order
export const createOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/api/orders', orderData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update order status
export const updateOrderStatus = async (id, status) => {
  try {
    const response = await apiClient.put(`/api/orders/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Cancel order
export const cancelOrder = async (id, reason) => {
  try {
    const response = await apiClient.put(`/api/orders/${id}/cancel`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};