// Mock data for dashboard components
import moment from 'moment';

// Sales Overview Mock Data
export const mockSalesOverview = {
  todayRevenue: {
    value: 12450.75,
    trend: 'up',
    percentageChange: 8.5
  },
  weekRevenue: {
    value: 87320.50,
    trend: 'up',
    percentageChange: 12.3
  },
  monthRevenue: {
    value: 345670.25,
    trend: 'down',
    percentageChange: -2.1
  },
  todayOrders: {
    value: 45,
    percentageChange: 15.2
  },
  weekOrders: {
    value: 312,
    percentageChange: 8.7
  },
  monthOrders: {
    value: 1247,
    percentageChange: -3.2
  },
  todayProducts: {
    value: 156,
    percentageChange: 22.1
  },
  weekProducts: {
    value: 1089,
    percentageChange: 6.4
  },
  monthProducts: {
    value: 4532,
    percentageChange: -1.8
  }
};

// Revenue Chart Mock Data
export const mockRevenueChartData = [
  // Last 30 days data
  ...Array.from({ length: 30 }, (_, i) => ({
    date: moment().subtract(29 - i, 'days').format('YYYY-MM-DD'),
    value: Math.floor(Math.random() * 15000) + 5000,
    category: 'Daily Revenue'
  }))
];

// Best Selling Products Mock Data
export const mockBestSellingPieData = [
  { type: 'Coffee', value: 450 },
  { type: 'Sandwiches', value: 320 },
  { type: 'Pastries', value: 280 },
  { type: 'Beverages', value: 210 },
  { type: 'Salads', value: 180 },
  { type: 'Desserts', value: 150 }
];

export const mockBestSellingBarData = [
  { product: 'Cappuccino', value: 156 },
  { product: 'Club Sandwich', value: 143 },
  { product: 'Croissant', value: 128 },
  { product: 'Latte', value: 119 },
  { product: 'Caesar Salad', value: 98 },
  { product: 'Cheesecake', value: 87 },
  { product: 'Espresso', value: 76 },
  { product: 'Muffin', value: 65 },
  { product: 'Green Tea', value: 54 },
  { product: 'Bagel', value: 43 }
];

// Recent Orders Mock Data
export const mockRecentOrders = [
  {
    orderId: 'ORD-2025-001234',
    customerName: 'John Smith',
    itemCount: 3,
    total: 45.75,
    status: 'completed',
    createdAt: moment().subtract(1, 'hour').toISOString()
  },
  {
    orderId: 'ORD-2025-001235',
    customerName: 'Sarah Johnson',
    itemCount: 2,
    total: 28.50,
    status: 'processing',
    createdAt: moment().subtract(2, 'hours').toISOString()
  },
  {
    orderId: 'ORD-2025-001236',
    customerName: 'Mike Davis',
    itemCount: 5,
    total: 67.25,
    status: 'shipped',
    createdAt: moment().subtract(3, 'hours').toISOString()
  },
  {
    orderId: 'ORD-2025-001237',
    customerName: 'Emily Wilson',
    itemCount: 1,
    total: 15.99,
    status: 'pending',
    createdAt: moment().subtract(4, 'hours').toISOString()
  },
  {
    orderId: 'ORD-2025-001238',
    customerName: 'David Brown',
    itemCount: 4,
    total: 89.90,
    status: 'completed',
    createdAt: moment().subtract(5, 'hours').toISOString()
  },
  {
    orderId: 'ORD-2025-001239',
    customerName: 'Lisa Garcia',
    itemCount: 2,
    total: 34.75,
    status: 'cancelled',
    createdAt: moment().subtract(6, 'hours').toISOString()
  },
  {
    orderId: 'ORD-2025-001240',
    customerName: 'Robert Miller',
    itemCount: 3,
    total: 52.40,
    status: 'processing',
    createdAt: moment().subtract(7, 'hours').toISOString()
  },
  {
    orderId: 'ORD-2025-001241',
    customerName: 'Jennifer Lee',
    itemCount: 6,
    total: 125.80,
    status: 'completed',
    createdAt: moment().subtract(8, 'hours').toISOString()
  }
];

// Low Stock Products Mock Data
export const mockLowStockProducts = [
  {
    id: 1,
    name: 'Colombian Coffee Beans',
    sku: 'COF-COL-001',
    currentStock: 5,
    minStock: 50,
    image: '/images/coffee-beans.jpg'
  },
  {
    id: 2,
    name: 'Almond Milk',
    sku: 'MLK-ALM-002',
    currentStock: 0,
    minStock: 30,
    image: '/images/almond-milk.jpg'
  },
  {
    id: 3,
    name: 'Whole Wheat Bread',
    sku: 'BRD-WHT-003',
    currentStock: 8,
    minStock: 25,
    image: '/images/wheat-bread.jpg'
  },
  {
    id: 4,
    name: 'Organic Lettuce',
    sku: 'VEG-LET-004',
    currentStock: 12,
    minStock: 40,
    image: '/images/lettuce.jpg'
  },
  {
    id: 5,
    name: 'Chocolate Chips',
    sku: 'CHC-CHP-005',
    currentStock: 3,
    minStock: 20,
    image: '/images/chocolate-chips.jpg'
  },
  {
    id: 6,
    name: 'Vanilla Extract',
    sku: 'EXT-VAN-006',
    currentStock: 1,
    minStock: 15,
    image: '/images/vanilla-extract.jpg'
  }
];

// Notifications Mock Data
export const mockNotifications = [
  {
    id: 1,
    type: 'error',
    title: 'Order Processing Failed',
    message: 'Order #ORD-2025-001242 failed to process due to payment issues.',
    createdAt: moment().subtract(30, 'minutes').toISOString(),
    read: false
  },
  {
    id: 2,
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'Colombian Coffee Beans stock is critically low (5 units remaining).',
    createdAt: moment().subtract(1, 'hour').toISOString(),
    read: false
  },
  {
    id: 3,
    type: 'warning',
    title: 'Out of Stock',
    message: 'Almond Milk is now out of stock. Immediate restocking required.',
    createdAt: moment().subtract(2, 'hours').toISOString(),
    read: false
  },
  {
    id: 4,
    type: 'success',
    title: 'High Sales Performance',
    message: 'Today\'s sales exceeded target by 15%. Great job!',
    createdAt: moment().subtract(3, 'hours').toISOString(),
    read: true
  },
  {
    id: 5,
    type: 'info',
    title: 'New Product Added',
    message: 'Organic Green Tea has been successfully added to inventory.',
    createdAt: moment().subtract(4, 'hours').toISOString(),
    read: true
  },
  {
    id: 6,
    type: 'warning',
    title: 'Supplier Delivery Delayed',
    message: 'Fresh Produce delivery from GreenFarm Suppliers delayed by 2 hours.',
    createdAt: moment().subtract(5, 'hours').toISOString(),
    read: true
  }
];
