import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";

// Ant Design
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Modal, message, Table, Input, Select, Card, Space, Typography } from "antd";

// Zustand store
import useIngredientStore from "@/store/ingredient";
import useWarehouseStore from "@/store/warehouse";

// Components
import CreateIngredientForm from "@/components/form/CreateIngredient";
import EditIngredientForm from "@/components/form/EditIngredient";
import ConfirmDeleteIngredient from "@/components/form/ConfirmDeleteIngredient";

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
    error,
    fetchIngredients
  } = useIngredientStore();

  const {
    warehouses,
    fetchWarehouses
  } = useWarehouseStore();

  // State
  const [isShowModalCreate, setShowModalCreate] = useState(false);
  const [isShowModalEdit, setShowModalEdit] = useState(false);
  const [ingredientEditing, setIngredientEditing] = useState(null);
  const [isShowModalDelete, setShowModalDelete] = useState(false);
  const [ingredientDeleting, setIngredientDeleting] = useState(null);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [filteredIngredients, setFilteredIngredients] = useState([]);

  // Simulated ownerId (in real app, this would come from auth context)
  const ownerId = "60d5ecb8b392c8001c8e4c1a"; // Mock owner ID

  // Table columns
  const columns = [
    {
      title: t('TXT_INGREDIENT_NAME'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('TXT_UNIT'),
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
    },
    {
      title: t('TXT_STOCK_QUANTITY'),
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 180,
      sorter: (a, b) => a.stockQuantity - b.stockQuantity,
      render: (quantity, record) => (
        <span className={quantity < 10 ? 'text-red-500 font-bold' : ''}>
          {quantity} {record.unit}
        </span>
      ),
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
  const filterIngredients = () => {
    let filtered = ingredients;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchText.toLowerCase()) ||
        ingredient.unit.toLowerCase().includes(searchText.toLowerCase()) ||
        ingredient.warehouseName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by warehouse
    if (selectedWarehouse !== 'all') {
      filtered = filtered.filter(ingredient => ingredient.warehouseId === selectedWarehouse);
    }

    setFilteredIngredients(filtered);
  };

  // Effect to load data
  useEffect(() => {
    fetchIngredients({ ownerId, storeCode });
    fetchWarehouses(storeCode);
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
    filterIngredients();
  }, [ingredients, searchText, selectedWarehouse]);

  return (
    <div className="h-full mt-2 p-4 bg-gray-100 overflow-auto">
      {contextHolder}

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={3} className="m-0">
            {t('TXT_INGREDIENT_MANAGEMENT')}
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowModalCreate(true)}
          >
            {t('TXT_CREATE_INGREDIENT')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <Input
            placeholder={t('TXT_SEARCH_INGREDIENTS')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            placeholder={t('TXT_SELECT_WAREHOUSE')}
            value={selectedWarehouse}
            onChange={setSelectedWarehouse}
            style={{ width: 200 }}
          >
            <Option value="all">{t('TXT_ALL_WAREHOUSES')}</Option>
            {warehouses.map(warehouse => (
              <Option key={warehouse._id} value={warehouse._id}>
                {warehouse.name}
              </Option>
            ))}
          </Select>
        </div>

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
