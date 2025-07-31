import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Card, 
  Tabs, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Statistic, 
  Row, 
  Col,
  Alert,
  Spin,
  Empty,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  MinusOutlined, 
  AuditOutlined,
  BarChartOutlined,
  ReloadOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import useInventoryStore from '@/store/inventory';
import useStoreProduct from '@/store/product';
import StockInModal from '@/components/inventory/StockInModal';
import StockOutModal from '@/components/inventory/StockOutModal';
import StockTakeModal from '@/components/inventory/StockTakeModal';
import TransactionHistoryModal from '@/components/inventory/TransactionHistoryModal';

const { TabPane } = Tabs;

/**
 * Main Inventory Management Page Component
 * Provides interface for Stock In, Stock Out, Stock Take operations
 * and displays current stock balances and reports
 */
const InventoryManagement = () => {
  const { t } = useTranslation();
  const { storeCode } = useParams();
  
  // State for modal visibility
  const [stockInVisible, setStockInVisible] = useState(false);
  const [stockOutVisible, setStockOutVisible] = useState(false);
  const [stockTakeVisible, setStockTakeVisible] = useState(false);
  const [transactionHistoryVisible, setTransactionHistoryVisible] = useState(false);
  
  // Inventory store
  const {
    stockBalances,
    lowStockReport,
    isLoadingBalance,
    isLoadingReport,
    error,
    success,
    fetchAllStockBalances,
    fetchLowStockReport,
    clearMessages
  } = useInventoryStore();
  
  // Product store for product list
  const {
    products,
    fetchProducts
  } = useStoreProduct();
  
  // Load data on component mount
  useEffect(() => {
    if (storeCode) {
      loadInventoryData();
      fetchProducts(storeCode);
    }
  }, [storeCode]);
  
  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error, clearMessages]);
  
  /**
   * Load all inventory data
   */
  const loadInventoryData = async () => {
    try {
      await Promise.all([
        fetchAllStockBalances(storeCode),
        fetchLowStockReport(storeCode)
      ]);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
    }
  };
  
  /**
   * Handle refresh of inventory data
   */
  const handleRefresh = () => {
    loadInventoryData();
  };
  
  /**
   * Stock balance table columns
   */
  const stockBalanceColumns = [
    {
      title: t('TXT_PRODUCT_CODE'),
      dataIndex: ['productId', 'productCode'],
      key: 'productCode',
      width: 120,
      fixed: 'left'
    },
    {
      title: t('TXT_PRODUCT_NAME'),
      dataIndex: ['productId', 'name'],
      key: 'productName',
      width: 200,
      fixed: 'left'
    },
    {
      title: t('TXT_CURRENT_STOCK'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (quantity, record) => (
        <Space>
          <span style={{ 
            color: record.isLowStock ? '#ff4d4f' : '#52c41a',
            fontWeight: 'bold'
          }}>
            {quantity}
          </span>
          <span style={{ color: '#666' }}>{record.unit}</span>
        </Space>
      )
    },
    {
      title: t('TXT_MIN_STOCK'),
      dataIndex: ['productId', 'minStock'],
      key: 'minStock',
      width: 100,
      render: (minStock, record) => (
        <span style={{ color: '#666' }}>
          {minStock} {record.unit}
        </span>
      )
    },
    {
      title: t('TXT_STATUS'),
      key: 'status',
      width: 120,
      render: (_, record) => {
        if (record.quantity <= 0) {
          return <Tag color="red">{t('TXT_OUT_OF_STOCK')}</Tag>;
        } else if (record.isLowStock) {
          return <Tag color="orange">{t('TXT_LOW_STOCK')}</Tag>;
        } else {
          return <Tag color="green">{t('TXT_IN_STOCK')}</Tag>;
        }
      }
    },
    {
      title: t('TXT_LAST_TRANSACTION'),
      dataIndex: 'lastTransactionDateFormatted',
      key: 'lastTransaction',
      width: 160
    },
    {
      title: t('LABEL_ACTIONS'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<PlusOutlined />}
            onClick={handleStockIn}
          >
            {t('TXT_STOCK_IN')}
          </Button>
          <Button 
            size="small" 
            icon={<MinusOutlined />}
            onClick={handleStockOut}
            disabled={record.quantity <= 0}
          >
            {t('TXT_STOCK_OUT')}
          </Button>
          <Button 
            size="small" 
            icon={<AuditOutlined />}
            onClick={handleStockTake}
          >
            {t('TXT_STOCK_TAKE')}
          </Button>
        </Space>
      )
    }
  ];
  
  /**
   * Low stock items table columns
   */
  const lowStockColumns = [
    {
      title: t('TXT_PRODUCT_CODE'),
      dataIndex: ['productId', 'productCode'],
      key: 'productCode',
      width: 120
    },
    {
      title: t('TXT_PRODUCT_NAME'),
      dataIndex: ['productId', 'name'],
      key: 'productName',
      width: 200
    },
    {
      title: t('TXT_CURRENT_STOCK'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (quantity, record) => (
        <Space>
          <span style={{ color: quantity <= 0 ? '#ff4d4f' : '#fa8c16', fontWeight: 'bold' }}>
            {quantity}
          </span>
          <span style={{ color: '#666' }}>{record.unit}</span>
        </Space>
      )
    },
    {
      title: t('TXT_MIN_STOCK'),
      dataIndex: ['productId', 'minStock'],
      key: 'minStock',
      width: 100,
      render: (minStock, record) => (
        <span style={{ color: '#666' }}>
          {minStock} {record.unit}
        </span>
      )
    },
    {
      title: t('TXT_STATUS'),
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={record.quantity <= 0 ? 'red' : 'orange'}>
          {record.stockLevel}
        </Tag>
      )
    },
    {
      title: t('LABEL_ACTIONS'),
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<PlusOutlined />}
          onClick={handleStockIn}
        >
          {t('TXT_RESTOCK')}
        </Button>
      )
    }
  ];
  
  /**
   * Handle stock in operation
   */
  const handleStockIn = () => {
    setStockInVisible(true);
    // You can pass productId to the modal if needed
  };
  
  /**
   * Handle stock out operation
   */
  const handleStockOut = () => {
    setStockOutVisible(true);
    // You can pass productId to the modal if needed
  };
  
  /**
   * Handle stock take operation
   */
  const handleStockTake = () => {
    setStockTakeVisible(true);
    // You can pass productId to the modal if needed
  };
  
  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h1 style={{ margin: 0 }}>{t('TXT_INVENTORY_MANAGEMENT')}</h1>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              {t('TXT_STORE')}: {storeCode}
            </p>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={isLoadingBalance || isLoadingReport}
              >
                {t('TXT_REFRESH')}
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setStockInVisible(true)}
              >
                {t('TXT_STOCK_IN')}
              </Button>
              <Button 
                icon={<MinusOutlined />}
                onClick={() => setStockOutVisible(true)}
              >
                {t('TXT_STOCK_OUT')}
              </Button>
              <Button 
                icon={<AuditOutlined />}
                onClick={() => setStockTakeVisible(true)}
              >
                {t('TXT_STOCK_TAKE')}
              </Button>
              <Button 
                icon={<BarChartOutlined />}
                onClick={() => setTransactionHistoryVisible(true)}
              >
                {t('TXT_HISTORY')}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>
      
      {/* Success/Error Messages */}
      {/* {success && (
        <Alert
          message={success}
          type="success"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
          onClose={clearMessages}
        />
      )} */}
      
      {/* {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
          onClose={clearMessages}
        />
      )} */}
      
      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('TXT_TOTAL_PRODUCTS')}
              value={stockBalances.length}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('TXT_LOW_STOCK_ITEMS')}
              value={lowStockReport.totalLowStockItems}
              prefix={<WarningOutlined />}
              valueStyle={{ color: lowStockReport.totalLowStockItems > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('TXT_OUT_OF_STOCK')}
              value={stockBalances.filter(item => item.quantity <= 0).length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('TXT_IN_STOCK')}
              value={stockBalances.filter(item => item.quantity > 0 && !item.isLowStock).length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Main Content Tabs */}
      <Card>
        <Tabs
          defaultActiveKey="stock-balances"
          items={[
            {
              label: t('TXT_STOCK_BALANCES'),
              key: 'stock-balances',
              children: (
                <Spin spinning={isLoadingBalance}>
                  {stockBalances.length > 0 ? (
                    <Table
                      columns={stockBalanceColumns}
                      dataSource={stockBalances}
                      scroll={{ x: 1200 }}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} ${t('TXT_OF')} ${total} ${t('TXT_ITEMS')}`
                      }}
                    />
                  ) : (
                    <Empty description={t('MSG_NO_STOCK_BALANCES_FOUND')} />
                  )}
                </Spin>
              )
            },
            {
              label: (
                <Badge count={lowStockReport.totalLowStockItems} offset={[10, 0]}>
                  {t('TXT_LOW_STOCK_ALERT')}
                </Badge>
              ),
              key: 'low-stock',
              children: (
                <Spin spinning={isLoadingReport}>
                  {lowStockReport.lowStockItems.length > 0 ? (
                    <Table
                      columns={lowStockColumns}
                      dataSource={lowStockReport.lowStockItems}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} ${t('TXT_OF')} ${total} ${t('TXT_ITEMS')}`
                      }}
                    />
                  ) : (
                    <Empty 
                      description={t('MSG_NO_LOW_STOCK_ITEMS_FOUND')}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </Spin>
              )
            }
          ]}
        />
      </Card>
      
      {/* Modals */}
      <StockInModal
        visible={stockInVisible}
        onClose={() => setStockInVisible(false)}
        storeCode={storeCode}
        products={products}
        onSuccess={loadInventoryData}
      />
      
      <StockOutModal
        visible={stockOutVisible}
        onClose={() => setStockOutVisible(false)}
        storeCode={storeCode}
        products={products}
        stockBalances={stockBalances}
        onSuccess={loadInventoryData}
      />
      
      <StockTakeModal
        visible={stockTakeVisible}
        onClose={() => setStockTakeVisible(false)}
        storeCode={storeCode}
        products={products}
        stockBalances={stockBalances}
        onSuccess={loadInventoryData}
      />
      
      <TransactionHistoryModal
        visible={transactionHistoryVisible}
        onClose={() => setTransactionHistoryVisible(false)}
        storeCode={storeCode}
        products={products}
      />
    </div>
  );
};

export default InventoryManagement;
