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
  Badge,
  Input,
  Select,
  Progress,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  AuditOutlined,
  BarChartOutlined,
  ReloadOutlined,
  WarningOutlined,
  SearchOutlined,
  HistoryOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import useInventoryStore from '@/store/inventory';
import useStoreProduct from '@/store/product';
import useWarehouseStore from '@/store/warehouse';
import useSupplierStore from '@/store/supplier';
import StockInModal from '@/components/inventory/StockInModal';
import StockOutModal from '@/components/inventory/StockOutModal';
import StockTakeModal from '@/components/inventory/StockTakeModal';
import TransactionHistoryModal from '@/components/inventory/TransactionHistoryModal';
import moment from 'moment';

const { TabPane } = Tabs;
const { Option } = Select;

/**
 * Enhanced Product Inventory Management Page Component
 * Provides comprehensive interface for Stock In, Stock Out, Stock Take operations
 * with advanced filtering, warehouse support, and detailed reporting
 */
const InventoryManagement = () => {
  const { t } = useTranslation();
  const { storeCode } = useParams();

  // State for modal visibility and selections
  const [stockInVisible, setStockInVisible] = useState(false);
  const [stockOutVisible, setStockOutVisible] = useState(false);
  const [stockTakeVisible, setStockTakeVisible] = useState(false);
  const [transactionHistoryVisible, setTransactionHistoryVisible] = useState(false);

  const [selectedStockInRecord, setSelectedStockInRecord] = useState(null);
  const [selectedStockOutRecord, setSelectedStockOutRecord] = useState(null);
  const [selectedStockTakeRecord, setSelectedStockTakeRecord] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [stockFilter, setStockFilter] = useState('all');

  // Store hooks
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

  const {
    products,
    fetchProducts
  } = useStoreProduct();

  const {
    warehouses,
    fetchWarehouses,
    isLoading: isLoadingWarehouses
  } = useWarehouseStore();

  const {
    suppliers,
    fetchSuppliers,
    isLoading: isLoadingSuppliers
  } = useSupplierStore();

  // Load data on component mount
  useEffect(() => {
    if (storeCode) {
      loadInventoryData();
      fetchProducts(storeCode);
      fetchWarehouses(storeCode);
      fetchSuppliers(storeCode);
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
   * Get stock level tag
   */
  const getStockLevelTag = (balance) => {
    const { quantity } = balance;
    const minStock = balance.productId?.minStock || 0;
    console.log('getStockLevelTag', { quantity, minStock });

    if (quantity <= 0) {
      return <Tag color="error" icon={<WarningOutlined />}>{t('TXT_OUT_OF_STOCK')}</Tag>;
    }

    if (quantity <= minStock) {
      return <Tag color="error" icon={<WarningOutlined />}>{t('TXT_LOW_STOCK')}</Tag>;
    }

    return <Tag color="success" icon={<CheckCircleOutlined />}>{t('TXT_GOOD_STOCK')}</Tag>;
  };

  /**
   * Get stock level progress
   */
  const getStockProgress = (balance) => {
    const { quantity, maxStock } = balance;
    const minStock = balance.productId?.minStock || 0;

    if (!maxStock || maxStock <= minStock) {
      return null;
    }

    const percentage = Math.min((quantity / maxStock) * 100, 100);
    let status = 'normal';

    if (quantity <= minStock) {
      status = 'exception';
    } else if (quantity <= minStock * 2) {
      status = 'active';
    }

    return (
      <Progress
        percent={percentage}
        size="small"
        status={status}
        showInfo={false}
      />
    );
  };

  /**
   * Enhanced stock balance table columns
   */
  const stockBalanceColumns = [
    {
      title: t('TXT_PRODUCT_CODE'),
      dataIndex: ['productId', 'productCode'],
      key: 'productCode',
      width: 120,
      // fixed: 'left',
      render: (productCode) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          {productCode}
        </span>
      )
    },
    {
      title: t('TXT_PRODUCT') || 'Product',
      dataIndex: 'productId',
      key: 'product',
      width: 250,
      render: (product) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{product?.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {product?.productCode} • {product?.category}
          </div>
        </div>
      ),
      sorter: (a, b) => a.productId?.name.localeCompare(b.productId?.name)
    },
    {
      title: t('TXT_WAREHOUSE') || 'Warehouse',
      dataIndex: 'warehouseId',
      key: 'warehouse',
      width: 150,
      render: (warehouse) => warehouse?.name,
      sorter: (a, b) => a.warehouseId?.name.localeCompare(b.warehouseId?.name)
    },
    {
      title: t('TXT_CURRENT_STOCK') || 'Current Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 150,
      render: (quantity, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {quantity} {record.unit}
          </div>
          {getStockProgress(record)}
        </div>
      ),
      sorter: (a, b) => a.quantity - b.quantity
    },
    {
      title: t('TXT_MIN_MAX_STOCK') || 'Min/Max Stock',
      key: 'minMaxStock',
      width: 120,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div>Min: {record.minStock} {record.unit}</div>
          {record.maxStock && <div>Max: {record.maxStock} {record.unit}</div>}
        </div>
      )
    },
    {
      title: t('TXT_BATCH_EXPIRY') || 'Batch/Expiry',
      key: 'batchExpiry',
      width: 150,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          {record.batchNumber && <div>Batch: {record.batchNumber}</div>}
          {record.expirationDate && (
            <div style={{
              color: moment(record.expirationDate).isBefore(moment().add(7, 'days')) ? '#ff4d4f' : '#666'
            }}>
              Exp: {moment(record.expirationDate).format('DD/MM/YYYY')}
            </div>
          )}
        </div>
      )
    },
    {
      title: t('TXT_STATUS') || 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => getStockLevelTag(record)
    },
    {
      title: t('TXT_LAST_TRANSACTION') || 'Last Transaction',
      dataIndex: 'lastTransactionDate',
      key: 'lastTransaction',
      width: 160,
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : '-',
      sorter: (a, b) => moment(a.lastTransactionDate).unix() - moment(b.lastTransactionDate).unix()
    },
    {
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('TXT_STOCK_IN') || 'Stock In'}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={() => handleStockIn(record)}
            />
          </Tooltip>
          <Tooltip title={t('TXT_STOCK_OUT') || 'Stock Out'}>
            <Button
              danger
              icon={<MinusOutlined />}
              size="small"
              disabled={record.quantity <= 0}
              onClick={() => handleStockOut(record)}
            />
          </Tooltip>
          <Tooltip title={t('TXT_STOCK_TAKE') || 'Stock Take'}>
            <Button
              icon={<AuditOutlined />}
              size="small"
              onClick={() => handleStockTake(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  /**
   * Filter stock balances based on search term and filters
   */
  const filteredStockBalances = stockBalances.filter(balance => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        balance.productId?.name?.toLowerCase().includes(searchLower) ||
        balance.productId?.productCode?.toLowerCase().includes(searchLower) ||
        balance.warehouseId?.name?.toLowerCase().includes(searchLower) ||
        balance.batchNumber?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // Warehouse filter
    if (selectedWarehouse && balance.warehouseId?._id !== selectedWarehouse) {
      return false;
    }

    // Stock status filter
    if (stockFilter !== 'all') {
      const { quantity } = balance;
      const minStock = balance.productId?.minStock || 0;
      switch (stockFilter) {
        case 'low':
          return quantity > 0 && quantity <= minStock;
        case 'out':
          return quantity <= 0;
        case 'good':
          return quantity > minStock;
        default:
          return true;
      }
    }

    return true;
  });

  /**
   * Handle stock in action
   */
  const handleStockIn = (record) => {
    setSelectedStockInRecord(record);
    setStockInVisible(true);
  };

  /**
   * Handle stock out action
   */
  const handleStockOut = (record) => {
    setSelectedStockOutRecord(record);
    setStockOutVisible(true);
  };

  /**
   * Handle stock take action
   */
  const handleStockTake = (record) => {
    setSelectedStockTakeRecord(record);
    setStockTakeVisible(true);
  };

  /**
   * Handle modal success (refresh data)
   */
  const handleModalSuccess = () => {
    setSelectedStockInRecord(null);
    setSelectedStockOutRecord(null);
    setSelectedStockTakeRecord(null);
    handleRefresh();
  };

  /**
   * Get summary statistics
   */
  const getSummaryStats = () => {
    const totalItems = stockBalances.length;
    const lowStockItems = stockBalances.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length;
    const outOfStockItems = stockBalances.filter(item => item.quantity <= 0).length;
    const goodStockItems = stockBalances.filter(item => item.quantity > item.minStock).length;

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_TOTAL_ITEMS') || 'Total Items'}
              value={totalItems}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_LOW_STOCK')}
              value={lowStockItems}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_OUT_OF_STOCK') || 'Out of Stock'}
              value={outOfStockItems}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_IN_STOCK') || 'In Stock'}
              value={goodStockItems}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

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
      title: t('TXT_WARNING'),
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={record.quantity <= 0 ? 'red' : 'orange'}>
          {t('MSG_CURRENTLY_LOW_STOCK_THAN_MINIMUM')}
        </Tag>
      )
    },
    {
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleStockIn(record)}
        >
          {t('TXT_RESTOCK')}
        </Button>
      )
    }
  ];

  return (
    <div className="p-2">
      {/* Summary Statistics */}
      {/* {getSummaryStats()} */}

      {/* Enhanced Controls */}
      <div className='bg-white p-1 mb-1 rounded-lg shadow'>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder={t('TXT_SEARCH_PRODUCTS') || 'Search products...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>

          <Col span={4}>
            <Select
              placeholder={t('TXT_SELECT_WAREHOUSE') || 'All Warehouses'}
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
              allowClear
              style={{ width: '100%' }}
            >
              {warehouses?.map(warehouse => (
                <Option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={3}>
            <Select
              value={stockFilter}
              onChange={setStockFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">{t('TXT_ALL_STOCK')}</Option>
              <Option value="good">{t('TXT_GOOD_STOCK')}</Option>
              <Option value="low">{t('TXT_LOW_STOCK')}</Option>
              <Option value="out">{t('TXT_OUT_OF_STOCK')}</Option>
            </Select>
          </Col>

          <Col span={10} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<PlusOutlined />}
                onClick={() => setStockInVisible(true)}
                // disabled={selectedRowKeys.length === 0}
              >
                {t('TXT_STOCK_IN') || 'Stock In'}
              </Button>
              <Button
                icon={<MinusOutlined />}
                onClick={() => setStockOutVisible(true)}
                // disabled={selectedRowKeys.length === 0}
              >
                {t('TXT_STOCK_OUT') || 'Stock Out'}
              </Button>
              <Button
                icon={<AuditOutlined />}
                onClick={() => setStockTakeVisible(true)}
              >
                {t('TXT_STOCK_TAKE') || 'Stock Take'}
              </Button>
              <Button
                icon={<HistoryOutlined />}
                onClick={() => setTransactionHistoryVisible(true)}
              >
                {t('TXT_HISTORY') || 'History'}
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={isLoadingBalance || isLoadingReport}
              >
                {t('TXT_REFRESH') || 'Refresh'}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Main Table */}
      <Card>
        <Table
          columns={stockBalanceColumns}
          dataSource={filteredStockBalances}
          rowKey="_id"
          loading={isLoadingBalance || isLoadingWarehouses}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} ${t('TXT_OF') || 'of'} ${total} ${t('TXT_ITEMS') || 'items'}`,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.quantity <= 0,
            }),
          }}
        />

        {/* Low Stock Alert Tab */}
        <Tabs
          style={{ marginTop: 16 }}
          items={[
            {
              label: (
                <Badge count={lowStockReport?.totalLowStockItems || 0} offset={[10, 0]}>
                  {t('TXT_LOW_STOCK_ALERT')}
                </Badge>
              ),
              key: 'low-stock',
              children: (
                <Spin spinning={isLoadingReport}>
                  {lowStockReport?.lowStockItems?.length > 0 ? (
                    <Table
                      columns={lowStockColumns}
                      dataSource={lowStockReport.lowStockItems}
                      pagination={{
                        pageSize: 10,
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

      {/* Stock In Modal */}
      <StockInModal
        visible={stockInVisible}
        onClose={() => {
          setStockInVisible(false);
          setSelectedStockInRecord(null);
          setSelectedRowKeys([]);
        }}
        onSuccess={handleRefresh}
        selectedRecord={selectedStockInRecord}
        warehouses={warehouses}
        suppliers={suppliers}
        storeCode={storeCode}
        products={products}
        stockBalances={stockBalances}
      />

      {/* Stock Out Modal */}
      <StockOutModal
        visible={stockOutVisible}
        onClose={() => {
          setStockOutVisible(false);
          setSelectedStockOutRecord(null);
          setSelectedRowKeys([]);
        }}
        onSuccess={handleRefresh}
        selectedRecord={selectedStockOutRecord}
        warehouses={warehouses}
        storeCode={storeCode}
        products={products}
        stockBalances={stockBalances}
      />

      {/* Stock Take Modal */}
      <StockTakeModal
        visible={stockTakeVisible}
        onClose={() => setStockTakeVisible(false)}
        onSuccess={handleRefresh}
        warehouses={warehouses}
        storeCode={storeCode}
        products={products}
        stockBalances={stockBalances}
        selectedRecord={selectedStockTakeRecord}
      />

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        visible={transactionHistoryVisible}
        onClose={() => setTransactionHistoryVisible(false)}
        selectedProducts={stockBalances.filter(item => selectedRowKeys.includes(item._id))}
        storeCode={storeCode}
        products={products}
        stockBalances={stockBalances}
      />
    </div>
  );
};

export default InventoryManagement;
