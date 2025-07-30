import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";

// Ant Design
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  SearchOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import { Button, Modal, message, Table, Input, Card, Space, Typography, Tag, Tooltip } from "antd";

// Zustand store
import useRecipeStore from "@/store/recipe";
import useIngredientStore from "@/store/ingredient";

// Components
import CreateRecipeForm from "@/components/form/CreateRecipe";
import EditRecipeForm from "@/components/form/EditRecipe";
import ConfirmDeleteRecipe from "@/components/form/ConfirmDeleteRecipe";
import RecipeDetailModal from "@/components/form/RecipeDetail";

const { Title } = Typography;

const RecipeManagerPage = () => {
  // Get store code from URL parameters
  const { storeCode } = useParams();

  // Translation
  const { t } = useTranslation();

  // Ant Design message
  const [messageApi, contextHolder] = message.useMessage();

  // Zustand stores
  const { 
    recipes, 
    isLoading, 
    error, 
    fetchRecipes,
    recipeAvailability,
    checkRecipeAvailability
  } = useRecipeStore();
  
  const { 
    ingredients, 
    fetchIngredients 
  } = useIngredientStore();

  // State
  const [isShowModalCreate, setShowModalCreate] = useState(false);
  const [isShowModalEdit, setShowModalEdit] = useState(false);
  const [recipeEditing, setRecipeEditing] = useState(null);
  const [isShowModalDelete, setShowModalDelete] = useState(false);
  const [recipeDeleting, setRecipeDeleting] = useState(null);
  const [isShowModalDetail, setShowModalDetail] = useState(false);
  const [recipeDetail, setRecipeDetail] = useState(null);
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  // Simulated ownerId (in real app, this would come from auth context)
  const ownerId = "60d5ecb8b392c8001c8e4c1a"; // Mock owner ID

  // Table columns
  const columns = [
    {
      title: t('TXT_DISH_NAME'),
      dataIndex: 'dishName',
      key: 'dishName',
      sorter: (a, b) => a.dishName.localeCompare(b.dishName),
    },
    {
      title: t('TXT_INGREDIENTS_COUNT'),
      dataIndex: 'ingredientCount',
      key: 'ingredientCount',
      width: 250,
      sorter: (a, b) => a.ingredientCount - b.ingredientCount,
      render: (count) => (
        <Tag color="blue">{count} {t('TXT_INGREDIENTS')}</Tag>
      ),
    },
    {
      title: t('TXT_DESCRIPTION'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description) => description || '-',
    },
    {
      title: t('TXT_CREATED_AT'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      key: 'actions',
      width: 160,
      render: (text, record) => (
        <Space size="small">
          <Tooltip title={t('TXT_VIEW_DETAILS')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlerClickViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title={t('TXT_CHECK_AVAILABILITY')}>
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handlerCheckAvailability(record)}
            />
          </Tooltip>
          <Tooltip title={t('TXT_EDIT')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handlerClickEdit(record)}
            />
          </Tooltip>
          <Tooltip title={t('TXT_DELETE')}>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handlerClickDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Handlers
  const handleCreateOk = () => {
    setShowModalCreate(false);
    fetchRecipes({ ownerId, storeCode });
  };

  const handleCancelCreate = () => {
    setShowModalCreate(false);
  };

  const handlerCreateOnFail = () => {
    message.error(t('MSG_RECIPE_CREATION_FAILED'));
  };

  const handlerClickEdit = (recipe) => {
    setRecipeEditing(recipe);
    setShowModalEdit(true);
  };

  const handleCancelEdit = () => {
    setShowModalEdit(false);
    setRecipeEditing(null);
  };

  const handleEditOk = () => {
    setShowModalEdit(false);
    fetchRecipes({ ownerId, storeCode });
  };

  const handlerEditOnFail = () => {
    message.error(t('MSG_RECIPE_UPDATE_FAILED'));
  };

  const handlerClickDelete = (recipe) => {
    setRecipeDeleting(recipe);
    setShowModalDelete(true);
  };

  const handleCancelDelete = () => {
    setShowModalDelete(false);
    setRecipeDeleting(null);
  };

  const handleDeleteOk = () => {
    setShowModalDelete(false);
    fetchRecipes({ ownerId, storeCode });
  };

  const handlerDeleteOnFail = () => {
    message.error(t('MSG_RECIPE_DELETE_FAILED'));
  };

  const handlerClickViewDetail = (recipe) => {
    setRecipeDetail(recipe);
    setShowModalDetail(true);
  };

  const handlerCheckAvailability = async (recipe) => {
    try {
      await checkRecipeAvailability(recipe._id, { ownerId, storeCode });
      message.success(t('MSG_RECIPE_AVAILABILITY_CHECKED'));
    } catch (error) {
      message.error(t('MSG_ERROR_CHECKING_RECIPE_AVAILABILITY'));
    }
  };

  // Filter recipes based on search text
  const filterRecipes = () => {
    let filtered = recipes;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(recipe =>
        recipe.dishName.toLowerCase().includes(searchText.toLowerCase()) ||
        (recipe.description && recipe.description.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredRecipes(filtered);
  };

  // Effect to load data
  useEffect(() => {
    fetchRecipes({ ownerId, storeCode });
    fetchIngredients({ ownerId, storeCode });
  }, [storeCode]);

  // Effect to show error messages
  useEffect(() => {
    if (error) {
      let msgError = t(error);
      if (msgError === error) {
        msgError = t('MSG_ERROR_FETCHING_RECIPES');
      }

      messageApi.open({
        type: 'error',
        content: msgError,
        duration: 3,
      });
    }
  }, [error, messageApi, t]);

  // Effect to filter recipes when dependencies change
  useEffect(() => {
    filterRecipes();
  }, [recipes, searchText]);

  return (
    <div className="h-full mt-2 p-4 bg-gray-100 overflow-auto">
      {contextHolder}
      
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={3} className="m-0">
            {t('TXT_RECIPE_MANAGEMENT')}
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowModalCreate(true)}
          >
            {t('TXT_CREATE_RECIPE')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <Input
            placeholder={t('TXT_SEARCH_RECIPES')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </div>

        {/* Recipes Table */}
        <Table
          columns={columns}
          dataSource={filteredRecipes}
          loading={isLoading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} ${t('TXT_OF')} ${total} ${t('TXT_RECIPES')}`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title={t('TXT_CREATE_RECIPE')}
        open={isShowModalCreate}
        onCancel={handleCancelCreate}
        footer={null}
        width={800}
      >
        <CreateRecipeForm
          storeCode={storeCode}
          ownerId={ownerId}
          ingredients={ingredients}
          onSuccess={handleCreateOk}
          onCancel={handleCancelCreate}
          onFail={handlerCreateOnFail}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={t('TXT_EDIT_RECIPE')}
        open={isShowModalEdit}
        onCancel={handleCancelEdit}
        footer={null}
        width={800}
      >
        {recipeEditing && (
          <EditRecipeForm
            recipe={recipeEditing}
            storeCode={storeCode}
            ownerId={ownerId}
            ingredients={ingredients}
            onSuccess={handleEditOk}
            onCancel={handleCancelEdit}
            onFail={handlerEditOnFail}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        title={t('TXT_DELETE_RECIPE')}
        open={isShowModalDelete}
        onCancel={handleCancelDelete}
        footer={null}
        width={500}
      >
        {recipeDeleting && (
          <ConfirmDeleteRecipe
            recipe={recipeDeleting}
            storeCode={storeCode}
            ownerId={ownerId}
            onSuccess={handleDeleteOk}
            onCancel={handleCancelDelete}
            onFail={handlerDeleteOnFail}
          />
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={t('TXT_RECIPE_DETAILS')}
        open={isShowModalDetail}
        onCancel={() => setShowModalDetail(false)}
        footer={null}
        width={700}
      >
        {recipeDetail && (
          <RecipeDetailModal
            recipe={recipeDetail}
            availability={recipeAvailability}
            onClose={() => setShowModalDetail(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default RecipeManagerPage;
