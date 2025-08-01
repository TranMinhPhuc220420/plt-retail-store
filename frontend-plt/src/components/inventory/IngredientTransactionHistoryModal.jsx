import React, { useState, useEffect } from 'react';
import { Modal, Table, Space, Tag, DatePicker, Select, Input, Button, Row, Col, Card, Statistic } from 'antd';
import { HistoryOutlined, SearchOutlined, ClearOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useIngredientInventoryStore from '@/store/ingredientInventory';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * Ingredient Transaction History Modal Component
 * Displays transaction history for ingredients with filtering options
 */
const IngredientTransactionHistoryModal = ({ 
  visible, 
  onClose, 
  storeCode,
  ingredients,
  warehouses
}) => {
  const { t } = useTranslation();
  const { 
    transactions, 
    transactionPagination, 
    isLoadingTransactions,
    fetchIngredientTransactionHistory 
  } = useIngredientInventoryStore();
  
  const [filters, setFilters] = useState({
    ingredientId: null,
    warehouseId: null,
    type: null,
    batchNumber: '',
    dateRange: null
  });

  /**
   * Fetch transaction history on component mount and filter changes
   */
  useEffect(() => {
    if (visible && storeCode) {
      loadTransactionHistory();
    }
  }, [visible, storeCode, filters]);

  /**
   * Load transaction history with current filters
   */
  const loadTransactionHistory = (page = 1) => {
    const params = {
      page,
      limit: 20,
      ...(filters.ingredientId && { ingredientId: filters.ingredientId }),
      ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
      ...(filters.type && { type: filters.type }),
      ...(filters.batchNumber && { batchNumber: filters.batchNumber }),
      ...(filters.dateRange && {
        startDate: filters.dateRange[0].format('YYYY-MM-DD'),
        endDate: filters.dateRange[1].format('YYYY-MM-DD')
      })
    };

    fetchIngredientTransactionHistory(storeCode, params);
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      ingredientId: null,
      warehouseId: null,
      type: null,
      batchNumber: '',
      dateRange: null
    });
  };

  /**
   * Get transaction type tag
   */
  const getTransactionTypeTag = (type) => {
    const typeConfig = {
      'in': { color: 'green', text: t('TXT_STOCK_IN') || 'Stock In' },
      'out': { color: 'red', text: t('TXT_STOCK_OUT') || 'Stock Out' },
      'adjustment': { color: 'orange', text: t('TXT_ADJUSTMENT') || 'Adjustment' },
      'transfer': { color: 'blue', text: t('TXT_TRANSFER') || 'Transfer' },
      'expired': { color: 'volcano', text: t('TXT_EXPIRED') || 'Expired' },
      'damaged': { color: 'magenta', text: t('TXT_DAMAGED') || 'Damaged' }
    };

    const config = typeConfig[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  /**
   * Get quantity display with proper formatting
   */
  const getQuantityDisplay = (transaction) => {
    const { quantity, type } = transaction;
    let color = 'black';
    let prefix = '';

    if (type === 'in' || (type === 'adjustment' && quantity > 0)) {
      color = 'green';
      prefix = '+';
    } else if (type === 'out' || (type === 'adjustment' && quantity < 0)) {
      color = 'red';
      prefix = '';
    }

    return (
      <span style={{ color, fontWeight: 'bold' }}>
        {prefix}{Math.abs(quantity)} {transaction.unit}
      </span>
    );
  };

  /**
   * Table columns configuration
   */
  const columns = [
    {
      title: t('TXT_DATE') || 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: t('TXT_INGREDIENT') || 'Ingredient',
      dataIndex: 'ingredientId',
      key: 'ingredient',
      width: 200,
      render: (ingredient) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{ingredient?.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {ingredient?.ingredientCode}
          </div>
        </div>
      )
    },
    {
      title: t('TXT_WAREHOUSE') || 'Warehouse',
      dataIndex: 'warehouseId',
      key: 'warehouse',
      width: 150,
      render: (warehouse) => warehouse?.name
    },
    {
      title: t('TXT_TYPE') || 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: getTransactionTypeTag
    },
    {
      title: t('TXT_QUANTITY') || 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (_, record) => getQuantityDisplay(record)
    },
    {
      title: t('TXT_BATCH_NUMBER') || 'Batch',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 120,
      render: (batchNumber) => batchNumber || '-'
    },
    {
      title: t('TXT_EXPIRATION_DATE') || 'Exp. Date',
      dataIndex: 'expirationDate',
      key: 'expirationDate',
      width: 120,
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-'
    },
    {
      title: t('TXT_USER') || 'User',
      dataIndex: 'userId',
      key: 'user',
      width: 150,
      render: (user) => user?.name || '-'
    },
    {
      title: t('TXT_NOTE') || 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note) => note || '-'
    }
  ];

  /**
   * Calculate transaction summary
   */
  const getTransactionSummary = () => {
    if (!transactions.length) return null;

    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'in') {
        acc.totalIn += transaction.quantity;
      } else if (transaction.type === 'out') {
        acc.totalOut += transaction.quantity;
      }
      acc.totalTransactions += 1;
      return acc;
    }, { totalIn: 0, totalOut: 0, totalTransactions: 0 });

    return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_TOTAL_TRANSACTIONS') || 'Total Transactions'}
              value={transactionPagination.totalCount}
              valueStyle={{ fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_TOTAL_STOCK_IN') || 'Total Stock In'}
              value={summary.totalIn.toFixed(2)}
              valueStyle={{ fontSize: '18px', color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_TOTAL_STOCK_OUT') || 'Total Stock Out'}
              value={summary.totalOut.toFixed(2)}
              valueStyle={{ fontSize: '18px', color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_NET_MOVEMENT') || 'Net Movement'}
              value={(summary.totalIn - summary.totalOut).toFixed(2)}
              valueStyle={{ 
                fontSize: '18px', 
                color: summary.totalIn >= summary.totalOut ? '#52c41a' : '#ff4d4f' 
              }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          {t('TXT_INGREDIENT_TRANSACTION_HISTORY') || 'Ingredient Transaction History'}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      destroyOnClose
    >
      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              placeholder={t('TXT_SELECT_INGREDIENT') || 'Select ingredient'}
              value={filters.ingredientId}
              onChange={(value) => handleFilterChange('ingredientId', value)}
              allowClear
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
            >
              {ingredients?.map(ingredient => (
                <Option key={ingredient._id} value={ingredient._id}>
                  {ingredient.name} ({ingredient.ingredientCode})
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col span={6}>
            <Select
              placeholder={t('TXT_SELECT_WAREHOUSE') || 'Select warehouse'}
              value={filters.warehouseId}
              onChange={(value) => handleFilterChange('warehouseId', value)}
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
          
          <Col span={6}>
            <Select
              placeholder={t('TXT_SELECT_TRANSACTION_TYPE') || 'Select type'}
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="in">{t('TXT_STOCK_IN') || 'Stock In'}</Option>
              <Option value="out">{t('TXT_STOCK_OUT') || 'Stock Out'}</Option>
              <Option value="adjustment">{t('TXT_ADJUSTMENT') || 'Adjustment'}</Option>
              <Option value="transfer">{t('TXT_TRANSFER') || 'Transfer'}</Option>
              <Option value="expired">{t('TXT_EXPIRED') || 'Expired'}</Option>
              <Option value="damaged">{t('TXT_DAMAGED') || 'Damaged'}</Option>
            </Select>
          </Col>
          
          <Col span={6}>
            <Input
              placeholder={t('TXT_BATCH_NUMBER') || 'Batch number'}
              value={filters.batchNumber}
              onChange={(e) => handleFilterChange('batchNumber', e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
        </Row>
        
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <RangePicker
              placeholder={[t('TXT_START_DATE') || 'Start date', t('TXT_END_DATE') || 'End date']}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Col>
          
          <Col span={12}>
            <Space>
              <Button 
                icon={<ClearOutlined />} 
                onClick={clearFilters}
              >
                {t('TXT_CLEAR_FILTERS') || 'Clear Filters'}
              </Button>
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                onClick={() => loadTransactionHistory(1)}
              >
                {t('TXT_SEARCH') || 'Search'}
              </Button>
              <Button 
                icon={<DownloadOutlined />}
              >
                {t('TXT_EXPORT') || 'Export'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Transaction Summary */}
      {getTransactionSummary()}

      {/* Transaction Table */}
      <Table
        columns={columns}
        dataSource={transactions}
        rowKey="_id"
        loading={isLoadingTransactions}
        pagination={{
          current: transactionPagination.currentPage,
          total: transactionPagination.totalCount,
          pageSize: transactionPagination.limit,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} ${t('TXT_OF') || 'of'} ${total} ${t('TXT_TRANSACTIONS') || 'transactions'}`,
          onChange: (page, pageSize) => {
            loadTransactionHistory(page);
          }
        }}
        scroll={{ x: 1000, y: 400 }}
        size="small"
      />
    </Modal>
  );
};

export default IngredientTransactionHistoryModal;
