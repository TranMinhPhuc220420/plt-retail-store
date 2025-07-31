import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Table, 
  Form, 
  Select, 
  DatePicker, 
  Button, 
  Space, 
  Tag, 
  Divider,
  Row,
  Col,
  Statistic,
  Empty
} from 'antd';
import { 
  BarChartOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  PlusOutlined,
  MinusOutlined,
  AuditOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useInventoryStore from '@/store/inventory';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * Transaction History Modal Component
 * Displays inventory transaction history with filtering and pagination
 */
const TransactionHistoryModal = ({ visible, onClose, storeCode, products }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const {
    transactions,
    transactionPagination,
    isLoadingTransactions,
    fetchTransactionHistory
  } = useInventoryStore();
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20
  });
  
  // Load transaction history when modal opens
  useEffect(() => {
    if (visible && storeCode) {
      loadTransactionHistory();
    }
  }, [visible, storeCode]);
  
  /**
   * Load transaction history with current filters
   */
  const loadTransactionHistory = async () => {
    try {
      await fetchTransactionHistory(storeCode, filters);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    }
  };
  
  /**
   * Handle search form submission
   */
  const handleSearch = (values) => {
    const newFilters = {
      ...filters,
      page: 1, // Reset to first page when searching
      productId: values.productId,
      type: values.type,
      startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: values.dateRange?.[1]?.format('YYYY-MM-DD')
    };
    
    setFilters(newFilters);
    fetchTransactionHistory(storeCode, newFilters);
  };
  
  /**
   * Handle pagination change
   */
  const handlePageChange = (page, pageSize) => {
    const newFilters = {
      ...filters,
      page,
      limit: pageSize
    };
    
    setFilters(newFilters);
    fetchTransactionHistory(storeCode, newFilters);
  };
  
  /**
   * Reset all filters
   */
  const handleReset = () => {
    form.resetFields();
    const newFilters = {
      page: 1,
      limit: 20
    };
    
    setFilters(newFilters);
    fetchTransactionHistory(storeCode, newFilters);
  };
  
  /**
   * Get transaction type icon
   */
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'in':
        return <PlusOutlined style={{ color: '#52c41a' }} />;
      case 'out':
        return <MinusOutlined style={{ color: '#ff4d4f' }} />;
      case 'adjustment':
        return <AuditOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };
  
  /**
   * Get transaction type color
   */
  const getTransactionColor = (type) => {
    switch (type) {
      case 'in':
        return 'green';
      case 'out':
        return 'red';
      case 'adjustment':
        return 'blue';
      default:
        return 'default';
    }
  };
  
  /**
   * Transaction table columns
   */
  const columns = [
    {
      title: t('TXT_DATE'),
      dataIndex: 'dateFormatted',
      key: 'date',
      width: 160,
      sorter: true
    },
    {
      title: t('TXT_TYPE'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type, record) => (
        <Space>
          {getTransactionIcon(type)}
          <Tag color={getTransactionColor(type)}>
            {record.typeDisplay}
          </Tag>
        </Space>
      )
    },
    {
      title: t('TXT_PRODUCT'),
      key: 'product',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.productId?.productCode}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.productId?.name}
          </div>
        </div>
      )
    },
    {
      title: t('TXT_QUANTITY'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (quantity, record) => (
        <Space>
          <span style={{ 
            color: record.type === 'in' ? '#52c41a' : 
                   record.type === 'out' ? '#ff4d4f' : '#1890ff',
            fontWeight: 'bold'
          }}>
            {record.type === 'in' ? '+' : record.type === 'out' ? '-' : ''}
            {quantity}
          </span>
          <span style={{ color: '#666' }}>{record.unit}</span>
        </Space>
      )
    },
    {
      title: t('TXT_USER'),
      key: 'user',
      width: 120,
      render: (_, record) => (
        record.userId?.displayName || record.userId?.username || t('TXT_UNKNOWN')
      )
    },
    {
      title: t('TXT_NOTE'),
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note) => note || '-'
    }
  ];
  
  /**
   * Calculate summary statistics
   */
  const getSummaryStats = () => {
    const stockInCount = transactions.filter(t => t.type === 'in').length;
    const stockOutCount = transactions.filter(t => t.type === 'out').length;
    const adjustmentCount = transactions.filter(t => t.type === 'adjustment').length;
    
    return { stockInCount, stockOutCount, adjustmentCount };
  };
  
  const summaryStats = getSummaryStats();
  
  return (
    <Modal
      title={
        <Space>
          <BarChartOutlined />
          {t('TXT_TRANSACTION_HISTORY')} - {storeCode}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      destroyOnClose
    >
      {/* Search Filters */}
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="productId" label={t('TXT_PRODUCT')}>
          <Select
            placeholder={t('TXT_ALL_PRODUCTS')}
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {products.map(product => (
              <Option key={product._id} value={product._id}>
                {product.productCode} - {product.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item name="type" label={t('TXT_TYPE')}>
          <Select placeholder={t('TXT_ALL_TYPES')} style={{ width: 120 }} allowClear>
            <Option value="in">{t('TXT_STOCK_IN')}</Option>
            <Option value="out">{t('TXT_STOCK_OUT')}</Option>
            <Option value="adjustment">{t('TXT_ADJUSTMENT')}</Option>
          </Select>
        </Form.Item>
        
        <Form.Item name="dateRange" label={t('TXT_DATE_RANGE')}>
          <RangePicker />
        </Form.Item>
        
        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SearchOutlined />}
              loading={isLoadingTransactions}
            >
              {t('TXT_SEARCH')}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              {t('TXT_RESET')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
      
      <Divider />
      
      {/* Summary Statistics */}
      {transactions.length > 0 && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic
                title={t('TXT_STOCK_IN')}
                value={summaryStats.stockInCount}
                prefix={<PlusOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t('TXT_STOCK_OUT')}
                value={summaryStats.stockOutCount}
                prefix={<MinusOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t('TXT_ADJUSTMENTS')}
                value={summaryStats.adjustmentCount}
                prefix={<AuditOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t('TXT_TOTAL_TRANSACTIONS')}
                value={transactionPagination.totalCount}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
          
          <Divider />
        </>
      )}
      
      {/* Transaction Table */}
      <Table
        columns={columns}
        dataSource={transactions}
        loading={isLoadingTransactions}
        pagination={{
          current: transactionPagination.currentPage,
          total: transactionPagination.totalCount,
          pageSize: transactionPagination.limit,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} ${t('TXT_OF')} ${total} ${t('TXT_TRANSACTIONS')}`,
          onChange: handlePageChange
        }}
        scroll={{ y: 400 }}
        locale={{
          emptyText: <Empty description={t('MSG_NO_TRANSACTIONS_FOUND')} />
        }}
      />
    </Modal>
  );
};

export default TransactionHistoryModal;
