import { useState, useEffect } from 'react';
import { message, Spin, Alert, Row, Col, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';

import { useTranslation } from 'react-i18next';

// Dashboard Components
import SalesOverview from '../../components/dashboard/SalesOverview';
import RevenueChart from '../../components/dashboard/RevenueChart';
import BestSellingProducts from '../../components/dashboard/BestSellingProducts';
import RecentOrders from '../../components/dashboard/RecentOrders';
import LowStockProducts from '../../components/dashboard/LowStockProducts';
import NotificationsAlerts from '../../components/dashboard/NotificationsAlerts';
import QuickActions from '../../components/dashboard/QuickActions';
import MobileDashboard from '../../components/dashboard/MobileDashboard';
import DashboardSettings from '../../components/dashboard/DashboardSettings';

// Real API Services
import {
  getDashboardStats,
  getSalesOverview,
  getRevenueData,
  getBestSellingProducts,
  getRecentOrders,
  getLowStockProducts,
  getInventoryNotifications,
  reorderProduct,
  exportSalesReport
} from '../../request/dashboard';

const DashboardPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeCode, setStoreCode] = useState(null);

  // Dashboard Data States
  const [salesOverview, setSalesOverview] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [bestSellingData, setBestSellingData] = useState({ pieData: [], barData: [] });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // UI States
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [dashboardSettings, setDashboardSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30,
    showNotifications: true,
    showLowStock: true,
    showRecentOrders: true,
    compactMode: false
  });

  // Load initial dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get dashboard stats first to get store code
      const stats = await getDashboardStats();
      const currentStoreCode = stats.storeCode;
      setStoreCode(currentStoreCode);

      // Load all dashboard data
      const [
        salesData,
        revenueChartData,
        bestSellingProductsData,
        ordersData,
        lowStockData,
        notificationsData
      ] = await Promise.all([
        getSalesOverview(currentStoreCode),
        getRevenueData(currentStoreCode),
        getBestSellingProducts(currentStoreCode),
        getRecentOrders(currentStoreCode),
        getLowStockProducts(currentStoreCode),
        getInventoryNotifications(currentStoreCode)
      ]);

      // Update states
      setSalesOverview(salesData);
      setRevenueData(revenueChartData);
      setBestSellingData(bestSellingProductsData);
      setRecentOrders(ordersData);
      setLowStockProducts(lowStockData);
      setNotifications(notificationsData);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      message.error('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!dashboardSettings.autoRefresh || !storeCode) return;

    const interval = setInterval(async () => {
      try {
        // Refresh data silently
        const [
          salesData,
          revenueChartData,
          lowStockData,
          notificationsData
        ] = await Promise.all([
          getSalesOverview(storeCode),
          getRevenueData(storeCode),
          getLowStockProducts(storeCode),
          getInventoryNotifications(storeCode)
        ]);

        setSalesOverview(salesData);
        setRevenueData(revenueChartData);
        setLowStockProducts(lowStockData);
        setNotifications(notificationsData);

        message.success('Dashboard data refreshed', 1);
      } catch (error) {
        console.error('Failed to refresh dashboard data:', error);
      }
    }, dashboardSettings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [dashboardSettings.autoRefresh, dashboardSettings.refreshInterval, storeCode]);

  // Event Handlers
  const handleViewOrder = (order) => {
    message.info(`Viewing transaction: ${order.orderId}`);
  };

  const handleEditOrder = (order) => {
    message.info(`Transaction details: ${order.orderId}`);
  };

  const handleReorderProduct = async (product) => {
    try {
      const quantity = product.minStock - product.currentStock + 10;
      await reorderProduct(product.productId, quantity, storeCode);
      message.success(`Reorder request submitted for ${product.name} (${quantity} units)`);

      // Refresh low stock data
      const updatedLowStock = await getLowStockProducts(storeCode);
      setLowStockProducts(updatedLowStock);
    } catch (error) {
      console.error('Failed to reorder product:', error);
      message.error(`Failed to reorder ${product.name}. Please try again.`);
    }
  };

  const handleViewProduct = (product) => {
    message.info(`Viewing product: ${product.name}`);
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    message.success('Notification marked as read');
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    message.success('All notifications marked as read');
  };

  const handleDismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    message.success('Notification dismissed');
  };

  // Quick Actions Handlers
  const handleCreateOrder = () => {
    message.info('Create order functionality - navigate to inventory stock-out');
  };

  const handleAddProduct = () => {
    message.info('Add product functionality - navigate to product creation');
  };

  const handleExportReport = async (format) => {
    try {
      message.loading(`Generating ${format.toUpperCase()} report...`, 2);
      await exportSalesReport(storeCode, format, '30d');
      message.success(`${format.toUpperCase()} report generated successfully!`);
    } catch (error) {
      console.error('Failed to export report:', error);
      message.error('Failed to generate report. Please try again.');
    }
  };

  const handleAddCustomer = () => {
    message.info('Add customer functionality not implemented yet');
  };

  const handleSettings = () => {
    setSettingsVisible(true);
  };

  const handleSaveSettings = (newSettings) => {
    setDashboardSettings(newSettings);
    localStorage.setItem('dashboardSettings', JSON.stringify(newSettings));
  };

  const handleRefreshData = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <Spin size="large" tip={t('TXT_LOADING_DASHBOARD')}>
          <div className="text-center p-8">
            <div className="mt-4 text-gray-600">{t('TXT_PLEASE_WAIT_FETCH_DATA')}</div>
          </div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <Alert
          message={t('TXT_FAILED_LOAD_DASHBOARD')}
          description={error}
          type="error"
          showIcon
          className="max-w-md"
          action={
            <button 
              onClick={handleRefreshData}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              {t('TXT_RETRY')}
            </button>
          }
        />
      </div>
    );
  }  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className={`${dashboardSettings.compactMode ? 'space-y-4' : 'space-y-8'}`}>
          {/* Page Header */}
          <div id="overview" className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {t('TXT_SALES_DASHBOARD')} {storeCode && <span className="text-lg text-gray-600">({storeCode})</span>}
                </h1>
                <p className="text-gray-600">{t('TXT_WELCOME_BACK')}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">{t('TXT_LAST_UPDATED')}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {moment().format('MMM DD, YYYY HH:mm')}
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleRefreshData}
                  loading={loading}
                  className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                >
                  {t('TXT_REFRESH')}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <QuickActions
              onCreateOrder={handleCreateOrder}
              onAddProduct={handleAddProduct}
              onExportReport={handleExportReport}
              onAddCustomer={handleAddCustomer}
              onSettings={handleSettings}
            />
          </div>

          {/* Sales Overview */}
          {salesOverview && <SalesOverview data={salesOverview} />}

          {/* Revenue Chart */}
          {revenueData.length > 0 && (
            <div id="revenue">
              <RevenueChart data={revenueData} />
            </div>
          )}

          {/* Best Selling Products */}
          {(bestSellingData.pieData.length > 0 || bestSellingData.barData.length > 0) && (
            <div id="products">
              <BestSellingProducts
                pieData={bestSellingData.pieData}
                barData={bestSellingData.barData}
              />
            </div>
          )}

          {/* Recent Orders and Low Stock Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {dashboardSettings.showRecentOrders && recentOrders.length > 0 && (
              <div className="xl:col-span-2">
                <RecentOrders
                  data={recentOrders}
                  onViewOrder={handleViewOrder}
                  onViewCustomer={handleEditOrder}
                />
              </div>
            )}
            {dashboardSettings.showLowStock && lowStockProducts.length > 0 && (
              <div className="xl:col-span-1">
                <LowStockProducts
                  data={lowStockProducts}
                  onReorder={handleReorderProduct}
                  onViewProduct={handleViewProduct}
                />
              </div>
            )}
          </div>

          {/* Notifications */}
          {dashboardSettings.showNotifications && (
            <div id="alerts">
              <NotificationsAlerts
                data={notifications}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismissNotification}
                onViewDetails={handleDismissNotification}
              />
            </div>
          )}

          {/* No Data Messages */}
          {revenueData.length === 0 && (
            <Alert
              message={t('TXT_NO_REVENUE_DATA')}
              description={t('TXT_NO_TRANSACTION_DATA')}
              type="info"
              showIcon
              className="mb-4"
            />
          )}
        </div>

        {/* Dashboard Settings Modal */}
        <DashboardSettings
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          onSave={handleSaveSettings}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
