import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";

// Ant Design
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  EyeOutlined,
  DatabaseOutlined
} from "@ant-design/icons";
import {
  Button,
  Modal,
  message,
  Table,
  Input,
  Select,
  Card,
  Space,
  Typography,
  Tag,
  Badge,
  Row,
  Col,
  Statistic,
  Alert,
  Tooltip,
  Divider
} from "antd";

// Zustand store
import useIngredientStore from "@/store/ingredient";
import useWarehouseStore from "@/store/warehouse";
import useSupplierStore from "@/store/supplier";

// Components
import CreateIngredientForm from "@/components/form/CreateIngredient";
import EditIngredientForm from "@/components/form/EditIngredient";
import ConfirmDeleteIngredient from "@/components/form/ConfirmDeleteIngredient";
import { formatMoney, parseNumberDecimal } from "@/utils";

const { Title } = Typography;
const { Option } = Select;

const IngredientManagerPage = () => {
  // Get store code from URL parameters
  const { storeCode } = useParams();

  // Translation
  const { t } = useTranslation();

  // Ant Design message
  const [messageApi, contextHolder] = message.useMessage();

  // Zustand stores
  const {
    ingredients,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    success,
    fetchIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    clearMessages
  } = useIngredientStore();

  const {
    warehouses,
    fetchWarehouses
  } = useWarehouseStore();

  const {
    suppliers,
    fetchSuppliers
  } = useSupplierStore();

  // State
  const [isShowModalCreate, setShowModalCreate] = useState(false);
  const [isShowModalEdit, setShowModalEdit] = useState(false);
  const [ingredientEditing, setIngredientEditing] = useState(null);
  const [isShowModalDelete, setShowModalDelete] = useState(false);
  const [ingredientDeleting, setIngredientDeleting] = useState(null);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [filteredIngredients, setFilteredIngredients] = useState([]);

  // Simulated ownerId (in real app, this would come from auth context)
  const ownerId = "60d5ecb8b392c8001c8e4c1a"; // Mock owner ID

  /**
   * Load initial data
   */
  useEffect(() => {
    if (storeCode) {
      loadData();
    }
  }, [storeCode]);

  /**
   * Filter ingredients when search or filter criteria change
   */
  useEffect(() => {
    performFiltering();
  }, [ingredients, searchText, selectedWarehouse, selectedCategory, selectedStatus]);

  /**
   * Handle success/error messages
   */
  useEffect(() => {
    if (success) {
      // messageApi.success(success);
      // clearMessages();
    }
    if (error) {
      messageApi.error(error);
      clearMessages();
    }
  }, [success, error]);

  /**
   * Load all required data
   */
  const loadData = async () => {
    try {
      await Promise.all([
        fetchIngredients({ ownerId, storeCode }),
        fetchWarehouses(storeCode),
        fetchSuppliers(storeCode)
      ]);
    } catch (error) {
      messageApi.error(t('MSG_FAILED_TO_LOAD_DATA') || 'Failed to load data');
    }
  };

  /**
   * Filter ingredients based on current criteria
   */
  useEffect(() => {
    performFiltering();
  }, [ingredients, searchText, selectedWarehouse, selectedCategory, selectedStatus]);

  /**
   * Get unique categories from ingredients
   */
  const getCategories = () => {
    const categories = [...new Set(ingredients.map(i => i.category).filter(Boolean))];
    return categories.sort();
  };

  const getNameCategory = (category) => {
    switch (category) {
      case 'frozen':
        return t('TXT_FROZEN') || 'Frozen';
      case 'general':
        return t('TXT_GENERAL') || 'General';
      case 'refrigerated':
        return t('TXT_REFRIGERATED') || 'Refrigerated';
      case 'room_temp':
        return t('TXT_ROOM_TEMPERATURE') || 'Room Temperature';
      default:
        return category;
    }
  }

  /**
   * Get ingredient status color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'orange';
      case 'discontinued': return 'red';
      default: return 'default';
    }
  };

  /**
   * Get stock level indicator
   */
  const getStockIndicator = (ingredient) => {
    const { currentStock = 0, minStock = 0 } = ingredient;

    if (currentStock === 0) {
      return <Tag color="volcano" icon={<ExclamationCircleOutlined />}>{t('TXT_OUT_OF_STOCK')}</Tag>;
    } else if (currentStock <= minStock) {
      return <Tag color="warning" icon={<WarningOutlined />}>{t('TXT_LOW_STOCK')}</Tag>;
    } else if (currentStock <= minStock * 2) {
      return <Tag color="processing" icon={<ClockCircleOutlined />}>{t('TXT_MODERATE_STOCK')}</Tag>;
    } else {
      return <Tag color="success">{t('TXT_GOOD_STOCK')}</Tag>;
    }
  };

  /**
   * Handle create ingredient
   */
  const handleCreate = async (formData) => {
    try {
      await createIngredient({
        ...formData,
        storeCode,
        ownerId
      });
      setShowModalCreate(false);
    } catch (error) {
      console.error('Create ingredient error:', error);
    }
  };

  /**
   * Handle edit ingredient
   */
  const handleEdit = async (formData) => {
    try {
      await updateIngredient(ingredientEditing._id, formData, { storeCode });
      setShowModalEdit(false);
      setIngredientEditing(null);
    } catch (error) {
      console.error('Update ingredient error:', error);
    }
  };

  /**
   * Handle delete ingredient
   */
  const handleDelete = async () => {
    try {
      await deleteIngredient(ingredientDeleting._id, { storeCode });
      setShowModalDelete(false);
      setIngredientDeleting(null);
    } catch (error) {
      console.error('Delete ingredient error:', error);
    }
  };

  /**
   * Handle refresh data
   */
  const handleRefresh = () => {
    loadData();
  };

  /**
   * Get summary statistics
   */
  const getSummaryStats = () => {
    const totalIngredients = ingredients.length;
    const activeIngredients = ingredients.filter(i => i.status === 'active').length;
    const lowStockIngredients = ingredients.filter(i => i.currentStock <= i.minStock).length;
    const outOfStockIngredients = ingredients.filter(i => i.currentStock === 0).length;

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_TOTAL_INGREDIENTS') || 'Total Ingredients'}
              value={totalIngredients}
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_ACTIVE_INGREDIENTS') || 'Active'}
              value={activeIngredients}
              valueStyle={{ fontSize: '20px', color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_LOW_STOCK')}
              value={lowStockIngredients}
              valueStyle={{ fontSize: '20px', color: lowStockIngredients > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('TXT_OUT_OF_STOCK') || 'Out of Stock'}
              value={outOfStockIngredients}
              valueStyle={{ fontSize: '20px', color: outOfStockIngredients > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // Enhanced Table columns
  const columns = [
    {
      title: t('TXT_INGREDIENT_CODE'),
      dataIndex: 'ingredientCode',
      key: 'ingredientCode',
      width: 120,
      sorter: (a, b) => a.ingredientCode?.localeCompare(b.ingredientCode),
      render: (code) => <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{code}</span>
    },
    {
      title: t('TXT_INGREDIENT_NAME'),
      dataIndex: 'name',
      key: 'name',
      width: 250,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.category || 'No Category'} • {record.unit}
          </div>
        </div>
      ),
    },
    {
      title: t('TXT_STATUS'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: t('TXT_ACTIVE') || 'Active', value: 'active' },
        { text: t('TXT_INACTIVE') || 'Inactive', value: 'inactive' },
        { text: t('TXT_DISCONTINUED') || 'Discontinued', value: 'discontinued' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        let message = '';
        if (status === 'active') {
          message = t('TXT_ACTIVE');
        } else if (status === 'inactive') {
          message = t('TXT_INACTIVE');
        } else if (status === 'discontinued') {
          message = t('TXT_DISCONTINUED');
        } else {
          message = t('TXT_UNKNOWN_STATUS');
        }
        return (
          <Tag color={getStatusColor(status)}>
            {message}
          </Tag>
        )
      },
    },
    {
      title: t('TXT_STOCK_INFO'),
      key: 'stockInfo',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {record.currentStock || 0} {record.unit}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Min: {record.minStock || 0} • Max: {record.maxStock || 'N/A'}
          </div>
          {getStockIndicator(record)}
        </div>
      ),
    },
    {
      title: t('TXT_COST'),
      dataIndex: 'standardCost',
      key: 'standardCost',
      width: 100,
      align: 'right',
      sorter: (a, b) => (a.standardCost || 0) - (b.standardCost || 0),
      render: (cost) => {
        if (!cost) return;
        const formattedCost = parseNumberDecimal(cost);
        return formatMoney(formattedCost);
      },
    },
    {
      title: t('TXT_WAREHOUSE'),
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 150,
      render: (name) => name || 'N/A',
      filters: warehouses?.map(w => ({ text: w.name, value: w._id })) || [],
      onFilter: (value, record) => record.warehouseId === value,
    },
    {
      title: t('TXT_SUPPLIER'),
      key: 'defaultSupplierId',
      width: 120,
      render: (_, record) => {
        let supplierName = record.defaultSupplierId?.name || '-';
        return supplierName;
      },
    },
    {
      title: t('TXT_WAREHOUSE'),
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      render: (name) => name || 'N/A',
    },
    {
      title: t('LABEL_CREATED_AT'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      key: 'actions',
      width: 120,
      render: (text, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handlerClickEdit(record)}
            title={t('TXT_EDIT')}
          />
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handlerClickDelete(record)}
            title={t('TXT_DELETE')}
          />
        </Space>
      ),
    },
  ];

  // Handlers
  const handleCreateOk = () => {
    setShowModalCreate(false);
    fetchIngredients({ ownerId, storeCode });
  };

  const handleCancelCreate = () => {
    setShowModalCreate(false);
  };

  const handlerCreateOnFail = () => {
    message.error(t('MSG_INGREDIENT_CREATION_FAILED'));
  };

  const handlerClickEdit = (ingredient) => {
    setIngredientEditing(ingredient);
    setShowModalEdit(true);
  };

  const handleCancelEdit = () => {
    setShowModalEdit(false);
    setIngredientEditing(null);
  };

  const handleEditOk = () => {
    setShowModalEdit(false);
    fetchIngredients({ ownerId, storeCode });
  };

  const handlerEditOnFail = () => {
    message.error(t('MSG_INGREDIENT_UPDATE_FAILED'));
  };

  const handlerClickDelete = (ingredient) => {
    setIngredientDeleting(ingredient);
    setShowModalDelete(true);
  };

  const handleCancelDelete = () => {
    setShowModalDelete(false);
    setIngredientDeleting(null);
  };

  const handleDeleteOk = () => {
    setShowModalDelete(false);
    fetchIngredients({ ownerId, storeCode });
  };

  const handlerDeleteOnFail = () => {
    message.error(t('MSG_INGREDIENT_DELETE_FAILED'));
  };

  // Filter ingredients based on search text and warehouse selection
  const performFiltering = () => {
    let filtered = ingredients;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchText.toLowerCase()) ||
        ingredient.ingredientCode?.toLowerCase().includes(searchText.toLowerCase()) ||
        ingredient.unit.toLowerCase().includes(searchText.toLowerCase()) ||
        ingredient.warehouseName?.toLowerCase().includes(searchText.toLowerCase()) ||
        ingredient.category?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by warehouse
    if (selectedWarehouse !== 'all') {
      filtered = filtered.filter(ingredient => ingredient.warehouseId === selectedWarehouse);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ingredient => ingredient.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(ingredient => ingredient.status === selectedStatus);
    }

    setFilteredIngredients(filtered);
  };

  // Effect to load data
  useEffect(() => {
    fetchIngredients({ ownerId, storeCode });
    fetchWarehouses(storeCode);
    fetchSuppliers(storeCode);
  }, [storeCode]);

  // Effect to show error messages
  useEffect(() => {
    if (error) {
      let msgError = t(error);
      if (msgError === error) {
        msgError = t('MSG_ERROR_FETCHING_INGREDIENTS');
      }

      messageApi.open({
        type: 'error',
        content: msgError,
        duration: 3,
      });
    }
  }, [error, messageApi, t]);

  // Effect to filter ingredients when dependencies change
  useEffect(() => {
    // filterIngredients();
  }, [ingredients, searchText, selectedWarehouse]);

  return (
    <div className="h-full mt-2 p-4 bg-gray-100">
      {contextHolder}

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="m-0">
              {t('TXT_INGREDIENT_MANAGEMENT')}
            </Title>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              {t('TXT_MANAGE_INGREDIENTS_DESCRIPTION') || 'Manage ingredient master data, categories, and basic information'}
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={isLoading}
            >
              {t('TXT_REFRESH')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowModalCreate(true)}
            >
              {t('TXT_CREATE_INGREDIENT')}
            </Button>
            <Link to={`/store/${storeCode}/admin/nguyen-lieu/ton-kho`}>
              <Button icon={<DatabaseOutlined />}>
                {t('TXT_INVENTORY_MANAGEMENT')}
              </Button>
            </Link>
          </Space>
        </div>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input
              placeholder={t('TXT_SEARCH_INGREDIENTS')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('TXT_SELECT_WAREHOUSE')}
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="all">{t('TXT_ALL_WAREHOUSES')}</Option>
              {warehouses.map(warehouse => (
                <Option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('TXT_SELECT_CATEGORY')}
              value={selectedCategory}
              onChange={setSelectedCategory}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="all">{t('TXT_ALL_CATEGORIES')}</Option>
              {getCategories().map(category => (
                <Option key={category} value={category}>
                  {getNameCategory(category) || category}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('TXT_SELECT_STATUS')}
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="all">{t('TXT_ALL_STATUS')}</Option>
              <Option value="active">{t('TXT_ACTIVE')}</Option>
              <Option value="inactive">{t('TXT_INACTIVE')}</Option>
              <Option value="discontinued">{t('TXT_DISCONTINUED')}</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Space>
              <Button icon={<FilterOutlined />} onClick={() => {
                setSearchText('');
                setSelectedWarehouse('all');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}>
                {t('TXT_CLEAR_FILTERS')}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Ingredients Table */}
        <Table
          columns={columns}
          dataSource={filteredIngredients}
          loading={isLoading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} ${t('TXT_OF')} ${total} ${t('TXT_INGREDIENTS')}`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title={t('TXT_CREATE_INGREDIENT')}
        open={isShowModalCreate}
        onCancel={handleCancelCreate}
        footer={null}
        width={600}
      >
        <CreateIngredientForm
          storeCode={storeCode}
          ownerId={ownerId}
          warehouses={warehouses}
          suppliers={suppliers}
          onSuccess={handleCreateOk}
          onCancel={handleCancelCreate}
          onFail={handlerCreateOnFail}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={t('TXT_EDIT_INGREDIENT')}
        open={isShowModalEdit}
        onCancel={handleCancelEdit}
        footer={null}
        width={600}
      >
        {ingredientEditing && (
          <EditIngredientForm
            ingredient={ingredientEditing}
            storeCode={storeCode}
            ownerId={ownerId}
            warehouses={warehouses}
            suppliers={suppliers}
            onSuccess={handleEditOk}
            onCancel={handleCancelEdit}
            onFail={handlerEditOnFail}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        title={t('TXT_DELETE_INGREDIENT')}
        open={isShowModalDelete}
        onCancel={handleCancelDelete}
        footer={null}
        width={500}
      >
        {ingredientDeleting && (
          <ConfirmDeleteIngredient
            ingredient={ingredientDeleting}
            storeCode={storeCode}
            ownerId={ownerId}
            onSuccess={handleDeleteOk}
            onCancel={handleCancelDelete}
            onFail={handlerDeleteOnFail}
          />
        )}
      </Modal>
    </div>
  );
};

export default IngredientManagerPage;
