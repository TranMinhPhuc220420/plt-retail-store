import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';

import {
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  Alert,
  Tag,
  Tooltip,
  Progress,
  Row,
  Col,
  Statistic,
  message,
  Modal,
  Badge
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  AuditOutlined,
  HistoryOutlined,
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useIngredientInventoryStore from '@/store/ingredientInventory';
import useIngredientStore from '@/store/ingredient';
import useWarehouseStore from '@/store/warehouse';
import useSupplierStore from '@/store/supplier';
import IngredientStockInModal from '@/components/inventory/IngredientStockInModal';
import IngredientStockOutModal from '@/components/inventory/IngredientStockOutModal';
import IngredientStockTakeModal from '@/components/inventory/IngredientStockTakeModal';
import IngredientTransactionHistoryModal from '@/components/inventory/IngredientTransactionHistoryModal';
import moment from 'moment';

const { Option } = Select;

/**
 * Comprehensive Ingredient Inventory Management Page
 */
const IngredientInventoryPage = () => {
  const { storeCode } = useParams()

  const { t } = useTranslation();

  // Store hooks
  const {
    stockBalances,
    lowStockReport,
    expiringReport,
    isLoadingBalance,
    isLoadingReport,
    isLoadingExpiringReport,
    fetchAllIngredientStockBalances,
    fetchIngredientLowStockReport,
    fetchExpiringIngredientsReport
  } = useIngredientInventoryStore();

  const {
    ingredients,
    fetchIngredients,
    isLoading: isLoadingIngredients
  } = useIngredientStore();

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

  // State management
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, expiring, expired
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Modal states
  const [stockInModalVisible, setStockInModalVisible] = useState(false);
  const [selectedStockInRecord, setSelectedStockInRecord] = useState(null);
  const [stockOutModalVisible, setStockOutModalVisible] = useState(false);
  const [selectedStockOutRecord, setSelectedStockOutRecord] = useState(null);
  const [stockTakeModalVisible, setStockTakeModalVisible] = useState(false);
  const [transactionHistoryModalVisible, setTransactionHistoryModalVisible] = useState(false);

  /**
   * Load initial data
   */
  useEffect(() => {
    if (storeCode) {
      loadInitialData();
    }
  }, [storeCode]);

  /**
   * Load data when filters change
   */
  useEffect(() => {
    if (storeCode) {
      loadStockBalances();
      // loadReports();
    }
  }, [storeCode, selectedWarehouse, stockFilter]);

  /**
   * Load all initial data
   */
  const loadInitialData = async () => {
    try {
      await Promise.all([
        fetchIngredients({ storeCode }),
        fetchWarehouses(storeCode),
        fetchSuppliers(storeCode),
        loadStockBalances(),
        loadReports()
      ]);
    } catch (error) {
      message.error(t('MSG_FAILED_TO_LOAD_DATA') || 'Failed to load data');
    }
  };

  /**
   * Load stock balances with current filters
   */
  const loadStockBalances = () => {
    const params = {
      ...(selectedWarehouse && { warehouseId: selectedWarehouse }),
      ...(stockFilter === 'low' && { lowStock: true }),
      ...(stockFilter === 'expiring' && { expiring: true }),
      ...(stockFilter === 'expired' && { expired: true })
    };

    fetchAllIngredientStockBalances(storeCode, params);
  };

  /**
   * Load reports
   */
  const loadReports = () => {
    if (!selectedWarehouse) return;
  }

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    loadStockBalances();
    loadReports();
    message.success(t('MSG_DATA_REFRESHED') || 'Data refreshed');
  };

  /**
   * Get stock status tag
   */
  const getStockStatusTag = (balance) => {
    const { quantity, minStock, expirationDate } = balance;

    if (expirationDate && moment(expirationDate).isBefore(moment())) {
      return <Tag color="volcano" icon={<ExclamationCircleOutlined />}>{t('TXT_EXPIRED')}</Tag>;
    }

    if (expirationDate && moment(expirationDate).diff(moment(), 'days') <= 7) {
      return <Tag color="orange" icon={<ClockCircleOutlined />}>{t('TXT_EXPIRING_SOON')}</Tag>;
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
    const { quantity, minStock, maxStock } = balance;

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
   * Table columns configuration
   */
  const columns = [
    {
      title: t('TXT_INGREDIENT') || 'Ingredient',
      dataIndex: 'ingredientId',
      key: 'ingredient',
      width: 250,
      render: (ingredient) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{ingredient?.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {ingredient?.ingredientCode} • {ingredient?.category}
          </div>
        </div>
      ),
      sorter: (a, b) => a.ingredientId?.name.localeCompare(b.ingredientId?.name)
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
      width: 130,
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
              color: moment(record.expirationDate).diff(moment(), 'days') <= 7 ? '#ff4d4f' : '#666'
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
      width: 150,
      render: (_, record) => getStockStatusTag(record)
    },
    {
      title: t('LABEL_UPDATED_AT'),
      dataIndex: 'lastTransactionDate',
      key: 'lastUpdated',
      width: 120,
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-',
      sorter: (a, b) => moment(a.lastTransactionDate).unix() - moment(b.lastTransactionDate).unix()
    },
    {
      // title: t('TXT_ACTIONS') || 'Actions',
      key: 'actions',
      width: 110,
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
   * Filter stock balances based on search term
   */
  const filteredStockBalances = stockBalances.filter(balance => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      balance.ingredientId?.name?.toLowerCase().includes(searchLower) ||
      balance.ingredientId?.ingredientCode?.toLowerCase().includes(searchLower) ||
      balance.warehouseId?.name?.toLowerCase().includes(searchLower) ||
      balance.batchNumber?.toLowerCase().includes(searchLower)
    );
  });

  /**
   * Handle stock in action
   */
  const handleStockIn = (record) => {
    setSelectedStockInRecord(record);
    setStockInModalVisible(true);
  };

  /**
   * Handle stock out action
   */
  const handleStockOut = (record) => {
    setSelectedStockOutRecord(record);
    setStockOutModalVisible(true);
  };

  /**
   * Handle stock take action
   */

  const [selectedStockTakeRecord, setSelectedStockTakeRecord] = useState(null);
  const handleStockTake = (record) => {
    setSelectedStockTakeRecord(record);
    setStockTakeModalVisible(true);
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
    const lowStockItems = lowStockReport.totalLowStockItems || 0;
    const expiringItems = expiringReport.totalExpiringItems || 0;
    const expiredItems = expiringReport.totalExpiredItems || 0;

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_TOTAL_ITEMS') || 'Total Items'}
              value={totalItems}
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_LOW_STOCK')}
              value={lowStockItems}
              valueStyle={{ fontSize: '20px', color: lowStockItems > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={lowStockItems > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_EXPIRING_ITEMS') || 'Expiring Soon'}
              value={expiringItems}
              valueStyle={{ fontSize: '20px', color: expiringItems > 0 ? '#faad14' : '#52c41a' }}
              prefix={expiringItems > 0 ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_EXPIRED_ITEMS') || 'Expired'}
              value={expiredItems}
              valueStyle={{ fontSize: '20px', color: expiredItems > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={expiredItems > 0 ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="p-2">
      {/* Summary Statistics */}
      {/* {getSummaryStats()} */}

      {/* Alerts for critical items */}
      {(lowStockReport.totalLowStockItems > 0 || expiringReport.totalExpiredItems > 0) && (
        <div style={{ marginBottom: 16 }}>
          {expiringReport.totalExpiredItems > 0 && (
            <Alert
              message={`${expiringReport.totalExpiredItems} ${t('TXT_EXPIRED_ITEMS_ALERT') || 'expired items require immediate attention'}`}
              type="error"
              icon={<ExclamationCircleOutlined />}
              showIcon
              style={{ marginBottom: 8 }}
              action={
                <Button size="small" onClick={() => setStockFilter('expired')}>
                  {t('TXT_VIEW') || 'View'}
                </Button>
              }
            />
          )}
          {lowStockReport.totalLowStockItems > 0 && (
            <Alert
              message={`${lowStockReport.totalLowStockItems} ${t('TXT_LOW_STOCK_ITEMS_ALERT') || 'items are running low on stock'}`}
              type="warning"
              icon={<WarningOutlined />}
              showIcon
              style={{ marginBottom: 8 }}
              action={
                <Button size="small" onClick={() => setStockFilter('low')}>
                  {t('TXT_VIEW') || 'View'}
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* Controls */}
      <div className='bg-white p-1 mb-1 rounded-lg shadow'>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder={t('TXT_SEARCH_INGREDIENTS') || 'Search ingredients...'}
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

          <Col span={4}>
            <Select
              value={stockFilter}
              onChange={setStockFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">{t('TXT_ALL_ITEMS') || 'All Items'}</Option>
              <Option value="low">
                <Badge count={lowStockReport.totalLowStockItems} size="small">
                  {t('TXT_LOW_STOCK')}
                </Badge>
              </Option>
              <Option value="expiring">
                <Badge count={expiringReport.totalExpiringItems} size="small">
                  {t('TXT_EXPIRING') || 'Expiring'}
                </Badge>
              </Option>
              <Option value="expired">
                <Badge count={expiringReport.totalExpiredItems} size="small">
                  {t('TXT_EXPIRED') || 'Expired'}
                </Badge>
              </Option>
            </Select>
          </Col>

          <Col span={10}>
            <Space style={{ float: 'right' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setStockInModalVisible(true)}
              >
                {t('TXT_STOCK_IN') || 'Stock In'}
              </Button>
              <Button
                icon={<MinusOutlined />}
                onClick={() => setStockOutModalVisible(true)}
                disabled={selectedRowKeys.length === 0}
              >
                {t('TXT_STOCK_OUT') || 'Stock Out'}
              </Button>
              <Button
                icon={<AuditOutlined />}
                onClick={() => setStockTakeModalVisible(true)}
              >
                {t('TXT_STOCK_TAKE') || 'Stock Take'}
              </Button>
              <Button
                icon={<HistoryOutlined />}
                onClick={() => setTransactionHistoryModalVisible(true)}
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
          columns={columns}
          dataSource={filteredStockBalances}
          rowKey="_id"
          loading={isLoadingBalance || isLoadingIngredients}
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
      </Card>

      {/* Modals */}
      <IngredientStockInModal
        visible={stockInModalVisible}
        onClose={() => {
          setStockInModalVisible(false);
          setSelectedStockInRecord(null);
        }}
        storeCode={storeCode}
        ingredients={ingredients}
        warehouses={warehouses}
        suppliers={suppliers}
        selectedRecord={selectedStockInRecord}
        onSuccess={handleModalSuccess}
      />

      <IngredientStockOutModal
        visible={stockOutModalVisible}
        onClose={() => {
          setStockOutModalVisible(false);
          setSelectedStockOutRecord(null);
        }}
        storeCode={storeCode}
        ingredients={ingredients}
        warehouses={warehouses}
        stockBalances={stockBalances}
        selectedRecord={selectedStockOutRecord}
        onSuccess={handleModalSuccess}
      />

      <IngredientStockTakeModal
        visible={stockTakeModalVisible}
        onClose={() => {
          setStockTakeModalVisible(false);
          setSelectedStockTakeRecord(null);
        }}
        storeCode={storeCode}
        ingredients={ingredients}
        warehouses={warehouses}
        stockBalances={stockBalances}
        selectedRecord={selectedStockTakeRecord}
        onSuccess={handleModalSuccess}
      />

      <IngredientTransactionHistoryModal
        visible={transactionHistoryModalVisible}
        onClose={() => setTransactionHistoryModalVisible(false)}
        storeCode={storeCode}
        ingredients={ingredients}
        warehouses={warehouses}
      />
    </div>
  );
};

export default IngredientInventoryPage;
