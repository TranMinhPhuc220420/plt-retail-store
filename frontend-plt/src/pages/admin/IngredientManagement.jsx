import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Card,
  Row,
  Col,
  Tag,
  Tooltip,
  Badge,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import {
  createIngredient,
  getIngredients,
  updateIngredient,
  deactivateIngredient
} from '@/request/ingredient';
import { getAllStores } from '@/request/store';

const { Search } = Input;
const { Option } = Select;

const IngredientManagement = () => {
  const [ingredients, setIngredients] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [form] = Form.useForm();

  // Load stores on component mount
  useEffect(() => {
    loadStores();
  }, []);

  // Load ingredients when store is selected
  useEffect(() => {
    if (selectedStore) {
      loadIngredients();
    }
  }, [selectedStore, searchText, statusFilter, pagination.current]);

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

    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      };

      const response = await getIngredients(selectedStore, params);
      
      setIngredients(response.data.ingredients || []);
      setPagination({
        ...pagination,
        total: response.data.pagination?.totalCount || 0
      });
    } catch (error) {
      message.error('Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (paginationInfo) => {
    setPagination({
      ...pagination,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize
    });
  };

  const showCreateModal = () => {
    setModalType('create');
    setEditingIngredient(null);
    form.resetFields();
    form.setFieldsValue({ storeCode: selectedStore });
    setIsModalVisible(true);
  };

  const showEditModal = (ingredient) => {
    setModalType('edit');
    setEditingIngredient(ingredient);
    form.setFieldsValue({
      ...ingredient,
      costPrice: parseFloat(ingredient.costPrice),
      supplier: ingredient.supplier || {}
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingIngredient(null);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (modalType === 'create') {
        await createIngredient(values);
        message.success('Ingredient created successfully');
      } else {
        await updateIngredient(editingIngredient._id, values);
        message.success('Ingredient updated successfully');
      }
      
      setIsModalVisible(false);
      form.resetFields();
      loadIngredients();
    } catch (error) {
      if (error.errorFields) {
        // Form validation errors
        return;
      }
      message.error(modalType === 'create' ? 'Failed to create ingredient' : 'Failed to update ingredient');
    }
  };

  const handleDeactivate = async (ingredientId) => {
    try {
      await deactivateIngredient(ingredientId);
      message.success('Ingredient deactivated successfully');
      loadIngredients();
    } catch (error) {
      message.error('Failed to deactivate ingredient');
    }
  };

  const columns = [
    {
      title: 'Product Code',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center'
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 100,
      align: 'right',
      render: (value) => `$${parseFloat(value).toFixed(2)}`
    },
    {
      title: 'Min Stock',
      dataIndex: 'minStock',
      key: 'minStock',
      width: 100,
      align: 'center'
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 120,
      align: 'center',
      render: (stock, record) => {
        const isLowStock = record.isLowStock;
        return (
          <Badge
            count={stock}
            showZero
            style={{
              backgroundColor: isLowStock ? '#ff4d4f' : stock === 0 ? '#faad14' : '#52c41a'
            }}
          />
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'name'],
      key: 'supplier',
      width: 150,
      render: (supplierName) => supplierName || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Ingredient">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to deactivate this ingredient?"
            onConfirm={() => handleDeactivate(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Deactivate Ingredient">
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                disabled={record.status === 'inactive'}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
          <Col span={6}>
            <Search
              placeholder="Search ingredients..."
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="active">{t('TXT_ACTIVE')}</Option>
              <Option value="inactive">{t('TXT_INACTIVE')}</Option>
            </Select>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
              disabled={!selectedStore}
            >
              Add Ingredient
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={ingredients}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} ingredients`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={modalType === 'create' ? 'Create Ingredient' : 'Edit Ingredient'}
        visible={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        width={600}
        okText={modalType === 'create' ? 'Create' : 'Update'}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          {modalType === 'create' && (
            <Form.Item
              name="storeCode"
              label="Store"
              rules={[{ required: true, message: 'Please select a store' }]}
            >
              <Select disabled>
                {stores.map(store => (
                  <Option key={store.storeCode} value={store.storeCode}>
                    {store.name} ({store.storeCode})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productCode"
                label="Product Code"
                rules={[
                  { required: true, message: 'Please enter product code' },
                  { min: 3, message: 'Product code must be at least 3 characters' }
                ]}
              >
                <Input placeholder="Enter product code" disabled={modalType === 'edit'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Ingredient Name"
                rules={[
                  { required: true, message: 'Please enter ingredient name' },
                  { min: 2, message: 'Name must be at least 2 characters' }
                ]}
              >
                <Input placeholder="Enter ingredient name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea
              placeholder="Enter description (optional)"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="costPrice"
                label="Cost Price"
                rules={[
                  { required: true, message: 'Please enter cost price' },
                  { type: 'number', min: 0.01, message: 'Cost price must be greater than 0' }
                ]}
              >
                <InputNumber
                  placeholder="0.00"
                  style={{ width: '100%' }}
                  precision={2}
                  min={0.01}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: 'Please enter unit' }]}
              >
                <Input placeholder="kg, liter, piece, etc." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minStock"
                label="Minimum Stock"
                rules={[
                  { required: true, message: 'Please enter minimum stock' },
                  { type: 'number', min: 0, message: 'Minimum stock cannot be negative' }
                ]}
              >
                <InputNumber
                  placeholder="0"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          {modalType === 'edit' && (
            <Form.Item
              name="status"
              label="Status"
            >
              <Select>
                <Option value="active">{t('TXT_ACTIVE')}</Option>
                <Option value="inactive">{t('TXT_INACTIVE')}</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Supplier Information">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['supplier', 'name']} noStyle>
                  <Input placeholder="Supplier name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['supplier', 'contact']} noStyle>
                  <Input placeholder="Contact number" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Form.Item name={['supplier', 'email']} noStyle>
                  <Input placeholder="Email address" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['supplier', 'address']} noStyle>
                  <Input placeholder="Address" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="Image URL"
          >
            <Input placeholder="Enter image URL (optional)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IngredientManagement;
