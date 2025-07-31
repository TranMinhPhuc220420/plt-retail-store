import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Space,
  Row,
  Col,
  Tag,
  Alert,
  Descriptions
} from 'antd';
import {
  PlayCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useIngredientsForRecipe } from '@/request/ingredient';
import { getAllRecipes } from '@/request/recipe';
import { getAllStores } from '@/request/store';

const { Option } = Select;

const RecipeProduction = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [productionModal, setProductionModal] = useState({
    visible: false,
    recipe: null
  });
  const [form] = Form.useForm();

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadRecipes();
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

  const loadRecipes = async () => {
    if (!selectedStore) return;

    setLoading(true);
    try {
      const response = await getAllRecipes({ storeCode: selectedStore });
      setRecipes(response.data || []);
    } catch (error) {
      message.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const showProductionModal = (recipe) => {
    setProductionModal({
      visible: true,
      recipe
    });
    form.resetFields();
    form.setFieldsValue({
      recipeId: recipe._id,
      quantity: 1
    });
  };

  const handleProductionSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        storeCode: selectedStore,
        recipeId: values.recipeId,
        quantity: values.quantity
      };

      const response = await useIngredientsForRecipe(data);
      
      message.success(`Successfully used ingredients for ${values.quantity} ${productionModal.recipe.name}`);
      setProductionModal({ visible: false, recipe: null });
      form.resetFields();
      
    } catch (error) {
      if (error.errorFields) {
        return; // Form validation errors
      }
      
      // Handle insufficient stock error
      if (error.response?.data?.insufficientStock) {
        const insufficientItems = error.response.data.insufficientStock;
        Modal.error({
          title: 'Insufficient Stock',
          content: (
            <div>
              <p>Cannot proceed with production due to insufficient ingredient stock:</p>
              <ul>
                {insufficientItems.map((item, index) => (
                  <li key={index}>
                    <strong>{item.ingredient}</strong>: Required {item.required}, Available {item.available}
                  </li>
                ))}
              </ul>
            </div>
          ),
          width: 500
        });
        return;
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to use ingredients for recipe';
      message.error(errorMessage);
    }
  };

  const handleProductionCancel = () => {
    setProductionModal({ visible: false, recipe: null });
    form.resetFields();
  };

  const columns = [
    {
      title: 'Recipe Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => name || record.dishName // Fallback to dishName
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Ingredients',
      dataIndex: 'ingredients',
      key: 'ingredients',
      render: (ingredients) => (
        <Tag color="blue">{ingredients?.length || 0} ingredients</Tag>
      )
    },
    {
      title: 'Prep Time',
      dataIndex: 'prepTime',
      key: 'prepTime',
      render: (time) => time ? `${time} min` : '-'
    },
    {
      title: 'Cook Time',
      dataIndex: 'cookTime',
      key: 'cookTime',
      render: (time) => time ? `${time} min` : '-'
    },
    {
      title: 'Servings',
      dataIndex: 'servings',
      key: 'servings',
      render: (servings) => servings || 1
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => showProductionModal(record)}
          size="small"
        >
          Produce
        </Button>
      )
    }
  ];

  const ingredientColumns = [
    {
      title: 'Ingredient',
      dataIndex: 'ingredientId',
      key: 'ingredient',
      render: (ingredient) => ingredient?.name || 'Unknown'
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => {
        const qty = record.quantity || record.amountUsed || 0;
        return `${qty} ${record.unit}`;
      }
    }
  ];

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

      <Card title="Recipe Production">
        <Alert
          message="Production Notice"
          description="When you produce a recipe, the system will automatically deduct the required ingredients from inventory and create stock out transactions."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={recipes}
          rowKey="_id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} recipes`
          }}
        />
      </Card>

      {/* Production Modal */}
      <Modal
        title={`Produce: ${productionModal.recipe?.name || productionModal.recipe?.dishName}`}
        visible={productionModal.visible}
        onOk={handleProductionSubmit}
        onCancel={handleProductionCancel}
        width={700}
        okText="Start Production"
      >
        {productionModal.recipe && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Recipe">
                {productionModal.recipe.name || productionModal.recipe.dishName}
              </Descriptions.Item>
              <Descriptions.Item label="Servings">
                {productionModal.recipe.servings || 1}
              </Descriptions.Item>
              <Descriptions.Item label="Prep Time">
                {productionModal.recipe.prepTime ? `${productionModal.recipe.prepTime} min` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Cook Time">
                {productionModal.recipe.cookTime ? `${productionModal.recipe.cookTime} min` : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical">
              <Form.Item
                name="recipeId"
                label="Recipe"
                rules={[{ required: true, message: 'Recipe is required' }]}
              >
                <Select disabled>
                  <Option value={productionModal.recipe._id}>
                    {productionModal.recipe.name || productionModal.recipe.dishName}
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="quantity"
                label="Production Quantity"
                rules={[
                  { required: true, message: 'Please enter production quantity' },
                  { type: 'number', min: 1, message: 'Quantity must be at least 1' }
                ]}
              >
                <InputNumber
                  placeholder="Enter number of servings to produce"
                  style={{ width: '100%' }}
                  min={1}
                />
              </Form.Item>
            </Form>

            <Card title="Required Ingredients" size="small">
              <Table
                columns={ingredientColumns}
                dataSource={productionModal.recipe.ingredients || []}
                rowKey={(record) => record.ingredientId?._id || record._id}
                pagination={false}
                size="small"
              />
            </Card>

            <Alert
              message="Production will automatically deduct ingredients from inventory"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default RecipeProduction;
