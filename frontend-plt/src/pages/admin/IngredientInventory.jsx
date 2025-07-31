import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  message,
  Space,
  Tabs,
  Tag,
  Badge,
  DatePicker,
  Statistic
} from 'antd';
import {
  InboxOutlined,
  SendOutlined,
  AuditOutlined,
  WarningOutlined,
  PlusOutlined,
  MinusOutlined,
  CheckOutlined
} from '@ant-design/icons';
import {
  stockIn,
  stockOut,
  stockTake,
  getAllStockBalances,
  getTransactionHistory
} from '@/request/inventory';
import { getIngredients } from '@/request/ingredient';
import { getAllStores } from '@/request/store';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const IngredientInventory = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [stockBalances, setStockBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState({
    balances: false,
    transactions: false,
    ingredients: false
  });

  // Modal states
  const [operationModal, setOperationModal] = useState({
    visible: false,
    type: null, // 'in', 'out', 'take'
    ingredient: null
  });
  const [form] = Form.useForm();

  // Filters
  const [transactionFilters, setTransactionFilters] = useState({
    productType: 'ingredient',
    type: null,
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadIngredients();
      loadStockBalances();
      loadTransactionHistory();
    }
  }, [selectedStore]);

  const loadStores = async () => {
    try {
      const response = await getAllStores();
      setStores(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedStore(response.data[0].storeCode);
      }
    } catch (error) {
      message.error('Failed to load stores');
    }
  };

  const loadIngredients = async () => {
    if (!selectedStore) return;

    setLoading(prev => ({ ...prev, ingredients: true }));
    try {
      const response = await getIngredients(selectedStore, { status: 'active' });
      setIngredients(response.data.ingredients || []);
    } catch (error) {
      message.error('Failed to load ingredients');
    } finally {
      setLoading(prev => ({ ...prev, ingredients: false }));
    }
  };

  const loadStockBalances = async () => {
    if (!selectedStore) return;

    setLoading(prev => ({ ...prev, balances: true }));
    try {
      const response = await getAllStockBalances(selectedStore, { productType: 'ingredient' });
      setStockBalances(response.data || []);
    } catch (error) {
      message.error('Failed to load stock balances');
    } finally {
      setLoading(prev => ({ ...prev, balances: false }));
    }
  };

  const loadTransactionHistory = async () => {
    if (!selectedStore) return;

    setLoading(prev => ({ ...prev, transactions: true }));
    try {
      const params = {
        productType: 'ingredient',
        ...transactionFilters,
        startDate: transactionFilters.startDate?.format('YYYY-MM-DD'),
        endDate: transactionFilters.endDate?.format('YYYY-MM-DD')
      };
      
      const response = await getTransactionHistory(selectedStore, params);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      message.error('Failed to load transaction history');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  const showOperationModal = (type, ingredient = null) => {
    setOperationModal({
      visible: true,
      type,
      ingredient
    });
    form.resetFields();
    
    if (ingredient) {
      form.setFieldsValue({
        productId: ingredient._id,
        unit: ingredient.unit
      });
    }
  };

  const handleOperationSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        storeCode: selectedStore,
        ...values
      };

      let response;
      let successMessage;

      switch (operationModal.type) {
        case 'in':
          response = await stockIn(data);
          successMessage = 'Stock in completed successfully';
          break;
        case 'out':
          response = await stockOut(data);
          successMessage = 'Stock out completed successfully';
          break;
        case 'take':
          response = await stockTake(data);
          successMessage = response.data.adjustmentMade 
            ? 'Stock take completed with adjustments' 
            : 'Stock take completed - no adjustments needed';
          break;
        default:
          throw new Error('Invalid operation type');
      }

      message.success(successMessage);
      setOperationModal({ visible: false, type: null, ingredient: null });
      form.resetFields();
      
      // Reload data
      loadStockBalances();
      loadTransactionHistory();
      
    } catch (error) {
      if (error.errorFields) {
        return; // Form validation errors
      }
      
      const errorMessage = error.response?.data?.message || 
        `Failed to complete ${operationModal.type} operation`;
      message.error(errorMessage);
    }
  };

  const handleOperationCancel = () => {
    setOperationModal({ visible: false, type: null, ingredient: null });
    form.resetFields();
  };

  const stockBalanceColumns = [
    {
      title: 'Product Code',
      dataIndex: ['product', 'productCode'],
      key: 'productCode',
      width: 120
    },
    {
      title: 'Ingredient Name',
      dataIndex: ['product', 'name'],
      key: 'name',
      width: 200
    },
    {
      title: 'Unit',
      dataIndex: ['product', 'unit'],
      key: 'unit',
      width: 80,
      align: 'center'
    },
    {
      title: 'Current Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (quantity, record) => {
        const minStock = record.product?.minStock || 0;
        const isLowStock = quantity <= minStock;
        const isEmpty = quantity === 0;
        
        return (
          <Space>
            <Badge
              count={quantity}
              showZero
              style={{
                backgroundColor: isEmpty ? '#ff4d4f' : isLowStock ? '#faad14' : '#52c41a'
              }}
            />
            {isLowStock && <WarningOutlined style={{ color: '#faad14' }} />}
          </Space>
        );
      }
    },
    {
      title: 'Min Stock',
      dataIndex: ['product', 'minStock'],
      key: 'minStock',
      width: 100,
      align: 'center'
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastTransactionDate',
      key: 'lastTransactionDate',
      width: 150,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => showOperationModal('in', record.product)}
          >
            Stock In
          </Button>
          <Button
            size="small"
            icon={<MinusOutlined />}
            onClick={() => showOperationModal('out', record.product)}
            disabled={record.quantity <= 0}
          >
            Stock Out
          </Button>
          <Button
            size="small"
            icon={<CheckOutlined />}
            onClick={() => showOperationModal('take', record.product)}
          >
            Stock Take
          </Button>
        </Space>
      )
    }
  ];

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const config = {
          in: { color: 'green', icon: <PlusOutlined /> },
          out: { color: 'red', icon: <MinusOutlined /> },
          adjustment: { color: 'orange', icon: <AuditOutlined /> }
        };
        
        return (
          <Tag color={config[type]?.color} icon={config[type]?.icon}>
            {type.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Ingredient',
      dataIndex: ['product', 'name'],
      key: 'productName',
      width: 200
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (quantity, record) => {
        const isNegative = quantity < 0;
        return (
          <span style={{ color: isNegative ? '#ff4d4f' : '#52c41a' }}>
            {isNegative ? '' : '+'}{quantity} {record.unit}
          </span>
        );
      }
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true
    },
    {
      title: 'User',
      dataIndex: ['user', 'username'],
      key: 'user',
      width: 120
    }
  ];

  // Calculate statistics
  const totalIngredients = stockBalances.length;
  const lowStockCount = stockBalances.filter(balance => 
    balance.quantity <= (balance.product?.minStock || 0)
  ).length;
  const outOfStockCount = stockBalances.filter(balance => balance.quantity === 0).length;

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Select
            placeholder="Select Store"
            value={selectedStore}
            onChange={setSelectedStore}
            style={{ width: '100%' }}
          >
            {stores.map(store => (
              <Option key={store.storeCode} value={store.storeCode}>
                {store.name} ({store.storeCode})
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Ingredients"
              value={totalIngredients}
              valueStyle={{ color: '#1890ff' }}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Low Stock"
              value={lowStockCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={outOfStockCount}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<MinusOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Stock"
              value={totalIngredients - outOfStockCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="balances">
        <TabPane tab="Stock Balances" key="balances">
          <Card>
            <Table
              columns={stockBalanceColumns}
              dataSource={stockBalances}
              rowKey="_id"
              loading={loading.balances}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} ingredients`
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Transaction History" key="transactions">
          <Card>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={4}>
                <Select
                  placeholder="Transaction Type"
                  value={transactionFilters.type}
                  onChange={(value) => setTransactionFilters(prev => ({ ...prev, type: value }))}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="in">Stock In</Option>
                  <Option value="out">Stock Out</Option>
                  <Option value="adjustment">Adjustment</Option>
                </Select>
              </Col>
              <Col span={4}>
                <DatePicker
                  placeholder="Start Date"
                  value={transactionFilters.startDate}
                  onChange={(date) => setTransactionFilters(prev => ({ ...prev, startDate: date }))}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <DatePicker
                  placeholder="End Date"
                  value={transactionFilters.endDate}
                  onChange={(date) => setTransactionFilters(prev => ({ ...prev, endDate: date }))}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <Button onClick={loadTransactionHistory}>Filter</Button>
              </Col>
            </Row>

            <Table
              columns={transactionColumns}
              dataSource={transactions}
              rowKey="_id"
              loading={loading.transactions}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} transactions`
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Operation Modal */}
      <Modal
        title={
          operationModal.type === 'in' ? 'Stock In' :
          operationModal.type === 'out' ? 'Stock Out' : 'Stock Take'
        }
        visible={operationModal.visible}
        onOk={handleOperationSubmit}
        onCancel={handleOperationCancel}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="productId"
            label="Ingredient"
            rules={[{ required: true, message: 'Please select an ingredient' }]}
          >
            <Select
              placeholder="Select ingredient"
              disabled={!!operationModal.ingredient}
              showSearch
              optionFilterProp="children"
            >
              {ingredients.map(ingredient => (
                <Option key={ingredient._id} value={ingredient._id}>
                  {ingredient.name} ({ingredient.productCode})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {operationModal.type === 'take' ? (
            <Form.Item
              name="physicalCount"
              label="Physical Count"
              rules={[
                { required: true, message: 'Please enter physical count' },
                { type: 'number', min: 0, message: 'Physical count cannot be negative' }
              ]}
            >
              <InputNumber
                placeholder="Enter actual quantity counted"
                style={{ width: '100%' }}
                min={0}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[
                { required: true, message: 'Please enter quantity' },
                { type: 'number', min: 0.01, message: 'Quantity must be greater than 0' }
              ]}
            >
              <InputNumber
                placeholder="Enter quantity"
                style={{ width: '100%' }}
                min={0.01}
              />
            </Form.Item>
          )}

          <Form.Item
            name="unit"
            label="Unit"
            rules={[{ required: true, message: 'Please enter unit' }]}
          >
            <Input placeholder="Enter unit" disabled={!!operationModal.ingredient} />
          </Form.Item>

          <Form.Item
            name="note"
            label="Note"
          >
            <TextArea
              placeholder="Enter note (optional)"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IngredientInventory;
