import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Modal,
  Form,
  message,
  Tag,
  Space,
  Divider,
  Typography,
  Statistic,
  Tabs,
  Alert,  
  Tooltip
} from 'antd';
import {
  LinkOutlined,
  CalculatorOutlined,
  ShoppingOutlined,
  ReconciliationOutlined,
  StarOutlined,
} from '@ant-design/icons';

// Components
import RecipeSelector from '@/components/form/RecipeSelector';
import ProductSelector from '@/components/form/ProductSelector';
import CostBreakdown from '@/components/form/CostBreakdown';

// Stores
import useProductStore from '@/store/product';
import useRecipeStore from '@/store/recipe';
import useProductRecipeStore from '@/store/productRecipe';
import useStoreApp from '@/store/app';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ProductRecipeManagement = () => {
  const { storeCode } = useParams();
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  // Store states
  const { storeActive } = useStoreApp();
  const { products, fetchProducts } = useProductStore();
  const { recipes, fetchRecipes } = useRecipeStore();
  const {
    isLoading,
    isLoadingCost,
    error,
    success,
    productWithRecipes,
    recipeWithProducts,
    costBreakdown,
    linkRecipe,
    unlinkRecipe,
    setDefaultRecipe,
    fetchProductWithRecipes,
    linkProduct,
    unlinkProduct,
    fetchRecipeWithProducts,
    getCostBreakdown,
    clearError,
    clearSuccess
  } = useProductRecipeStore();

  // Local states
  const [activeTab, setActiveTab] = useState('products');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Modal states
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [costModalVisible, setCostModalVisible] = useState(false);
  const [productDetailsModalVisible, setProductDetailsModalVisible] = useState(false);
  const [linkType, setLinkType] = useState('recipe-to-product'); // 'recipe-to-product' or 'product-to-recipe'

  // Form
  const [form] = Form.useForm();

  const ownerId = storeActive?._id || "60d5ecb8b392c8001c8e4c1a";

  // Helper function to calculate ingredient cost
  const calculateIngredientCost = (ingredient) => {
    if (!ingredient.ingredientId || typeof ingredient.ingredientId !== 'object') {
      return 0;
    }

    const standardCost = ingredient.ingredientId.standardCost;
    if (!standardCost) return 0;

    const costValue = parseFloat(standardCost.$numberDecimal || standardCost || 0);
    const ingredientUnit = ingredient.ingredientId.unit;
    const amountUsed = parseFloat(ingredient.amountUsed || 0);
    const recipeUnit = ingredient.unit;

    // Unit conversion factor
    let conversionFactor = 1;
    if (ingredientUnit === 'kg' && recipeUnit === 'g') {
      conversionFactor = 0.001; // 1g = 0.001kg
    } else if (ingredientUnit === 'g' && recipeUnit === 'kg') {
      conversionFactor = 1000; // 1kg = 1000g
    }

    return costValue * amountUsed * conversionFactor;
  };

  // Helper function to calculate total recipe cost
  const calculateTotalRecipeCost = (ingredients) => {
    if (!ingredients || !Array.isArray(ingredients)) return 0;
    
    return ingredients.reduce((total, ingredient) => {
      return total + calculateIngredientCost(ingredient);
    }, 0);
  };

  useEffect(() => {
    if (storeCode && ownerId) {
      fetchProducts(storeCode);
      fetchRecipes({ storeCode, ownerId });
    }
  }, [storeCode, ownerId]);

  useEffect(() => {
    if (success) {
      // messageApi.success(t(success));
      clearSuccess();
    }
    if (error) {
      messageApi.error(t(error));
      clearError();
    }
  }, [success, error]);

  // Product columns with recipe information
  const productColumns = [
    {
      title: t('TXT_PRODUCT_NAME'),
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" className="text-sm">
            {record.productCode}
          </Text>
        </div>
      )
    },
    {
      title: t('TXT_LINKED_RECIPES'),
      key: 'recipes',
      render: (_, record) => (
        <div>
          <Tag color="blue">
            {record.recipes?.length || 0} {t('TXT_RECIPES')}
          </Tag>
          {record.defaultRecipeId && (
            <Tag color="gold" icon={<StarOutlined />}>
              {t('TXT_HAS_DEFAULT')}
            </Tag>
          )}
        </div>
      )
    },
    {
      title: t('TXT_PRICING'),
      key: 'pricing',
      render: (_, record) => (
        <div>
          <div className="text-sm">
            <Text type="secondary">{t('TXT_RETAIL')}: </Text>
            <Text>{parseFloat(record.retailPrice || 0).toLocaleString()} VND</Text>
          </div>
          <div className="text-sm">
            <Text type="secondary">{t('TXT_CUSTOM_COST_PRICE')}: </Text>
            <Text>{parseFloat(record.costPrice || 0).toLocaleString()} VND</Text>
          </div>
        </div>
      )
    },
    {
      title: t('TXT_ACTIONS'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<LinkOutlined />}
            onClick={() => handleLinkRecipeToProduct(record)}
          >
            {t('TXT_LINK_RECIPE')}
          </Button>
          <Button
            size="small"
            icon={<CalculatorOutlined />}
            onClick={() => handleViewCostBreakdown(record)}
          >
            {t('TXT_COST_ANALYSIS')}
          </Button>
          <Button
            size="small"
            onClick={() => handleViewProductDetails(record)}
          >
            {t('TXT_VIEW_DETAILS')}
          </Button>
        </Space>
      )
    }
  ];

  // Recipe columns with product information
  const recipeColumns = [
    {
      title: t('TXT_RECIPE_NAME'),
      dataIndex: 'dishName',
      key: 'dishName',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" className="text-sm">
            {record.ingredients?.length || 0} {t('TXT_INGREDIENTS')}
          </Text>
        </div>
      )
    },
    {
      title: t('TXT_LINKED_PRODUCTS'),
      key: 'products',
      render: (_, record) => (
        <Tag color="green">
          {record.products?.length || 0} {t('TXT_PRODUCTS')}
        </Tag>
      )
    },
    {
      title: t('TXT_RECIPE_COST'),
      key: 'cost',
      render: (_, record) => (
        <div>
          {record.costPerUnit ? (
            <Text>{parseFloat(record.costPerUnit.toString()).toLocaleString()} VND</Text>
          ) : (
            <Text type="secondary">{t('TXT_NOT_CALCULATED')}</Text>
          )}
        </div>
      )
    },
    {
      title: t('TXT_ACTIONS'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<LinkOutlined />}
            onClick={() => handleLinkProductToRecipe(record)}
          >
            {t('TXT_LINK_PRODUCT')}
          </Button>
          <Button
            size="small"
            icon={<CalculatorOutlined />}
            onClick={() => handleCalculateRecipeCost(record)}
          >
            {t('TXT_CALCULATE_COST')}
          </Button>
          <Button
            size="small"
            onClick={() => handleViewRecipeDetails(record)}
          >
            {t('TXT_VIEW_DETAILS')}
          </Button>
        </Space>
      )
    }
  ];

  // Event handlers
  const handleLinkRecipeToProduct = (product) => {
    setSelectedProduct(product);
    setLinkType('recipe-to-product');
    setLinkModalVisible(true);
  };

  const handleLinkProductToRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setLinkType('product-to-recipe');
    setLinkModalVisible(true);
  };

  const handleViewCostBreakdown = async (product) => {
    try {
      await getCostBreakdown(product._id, { storeCode, ownerId });
      setCostModalVisible(true);
    } catch (error) {
      messageApi.error(t('MSG_FAILED_TO_GET_COST_BREAKDOWN'));
    }
  };

  const handleViewProductDetails = async (product) => {
    try {
      await fetchProductWithRecipes(product._id, { storeCode, ownerId });
      setSelectedProduct(product);
      setProductDetailsModalVisible(true);
    } catch (error) {
      messageApi.error(t('MSG_FAILED_TO_FETCH_PRODUCT_DETAILS'));
    }
  };

  const handleViewRecipeDetails = async (recipe) => {
    try {
      await fetchRecipeWithProducts(recipe._id, { storeCode, ownerId });
      setSelectedRecipe(recipe);
      // Show recipe details modal or navigate to details page
    } catch (error) {
      messageApi.error(t('MSG_FAILED_TO_FETCH_RECIPE_DETAILS'));
    }
  };

  const handleCalculateRecipeCost = (recipe) => {
    // Implement recipe cost calculation
    messageApi.info(t('MSG_FEATURE_COMING_SOON'));
  };

  const handleLinkSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (linkType === 'recipe-to-product') {
        // Link recipe to product
        for (const recipeId of values.recipes) {
          await linkRecipe(selectedProduct._id, recipeId, {
            setAsDefault: values.setAsDefault && values.recipes.length === 1
          });
        }
        
        // Refresh products data
        fetchProducts(storeCode);
      } else {
        // Link product to recipe
        for (const productId of values.products) {
          await linkProduct(selectedRecipe._id, productId);
        }
        
        // Refresh recipes data
        fetchRecipes({ storeCode, ownerId });
      }
      
      setLinkModalVisible(false);
      form.resetFields();
      messageApi.success(t('MSG_LINK_SUCCESS'));
      
    } catch (error) {
      console.error('Link error:', error);
    }
  };

  const handleLinkCancel = () => {
    setLinkModalVisible(false);
    form.resetFields();
    setSelectedProduct(null);
    setSelectedRecipe(null);
  };

  const handleProductDetailsCancel = () => {
    setProductDetailsModalVisible(false);
    setSelectedProduct(null);
  };

  // Transform cost breakdown data for the component
  const transformCostBreakdownData = (costBreakdownData) => {
    if (!costBreakdownData) return null;
    
    // If data has recipes array, get the first recipe
    if (costBreakdownData.recipes && costBreakdownData.recipes.length > 0) {
      const recipe = costBreakdownData.recipes[0];
      return {
        ...recipe,
        // Add product-level data
        productId: costBreakdownData.productId,
        productName: costBreakdownData.productName,
        currentPricing: costBreakdownData.currentPricing,
        // Map the recipe data to expected format
        totalCost: recipe.totalCost,
        costPerUnit: recipe.costPerUnit,
        yieldQuantity: recipe.yieldQuantity || 1,
        costBreakdown: recipe.costBreakdown || []
      };
    }
    
    // If data already has costBreakdown directly
    return costBreakdownData;
  };

  const renderSummaryStats = () => {
    const productsWithRecipes = products.filter(p => p.recipes && p.recipes.length > 0);
    const recipesWithProducts = recipes.filter(r => r.products && r.products.length > 0);
    const productsWithDefaultRecipe = products.filter(p => p.defaultRecipeId);

    return (
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Statistic
            title={t('TXT_TOTAL_PRODUCTS')}
            value={products.length}
            prefix={<ShoppingOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={t('TXT_PRODUCTS_WITH_RECIPES')}
            value={productsWithRecipes.length}
            prefix={<LinkOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={t('TXT_RECIPES_WITH_PRODUCTS')}
            value={recipesWithProducts.length}
            prefix={<ReconciliationOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={t('TXT_DEFAULT_RECIPES_SET')}
            value={productsWithDefaultRecipe.length}
            prefix={<StarOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Col>
      </Row>
    );
  };

  return (
    <div className="p-6">
      {contextHolder}
      
      <div className="mb-6">
        <Title level={2}>{t('TXT_PRODUCT_RECIPE_MANAGEMENT')}</Title>
        <Text type="secondary">
          {t('TXT_MANAGE_RELATIONSHIPS_BETWEEN_PRODUCTS_AND_RECIPES')}
        </Text>
      </div>

      {renderSummaryStats()}

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <ShoppingOutlined />
                {t('TXT_PRODUCTS_VIEW')}
              </span>
            } 
            key="products"
          >
            <Table
              columns={productColumns}
              dataSource={products}
              rowKey="_id"
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} ${t('TXT_OF')} ${total} ${t('TXT_PRODUCTS')}`
              }}
              scroll={{ x: 1000 }}
            />
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <ReconciliationOutlined />
                {t('TXT_RECIPES_VIEW')}
              </span>
            } 
            key="recipes"
          >
            <Table
              columns={recipeColumns}
              dataSource={recipes}
              rowKey="_id"
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} ${t('TXT_OF')} ${total} ${t('TXT_RECIPES')}`
              }}
              scroll={{ x: 1000 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Link Modal */}
      <Modal
        title={
          linkType === 'recipe-to-product' 
            ? t('TXT_LINK_RECIPES_TO_PRODUCT')
            : t('TXT_LINK_PRODUCTS_TO_RECIPE')
        }
        open={linkModalVisible}
        onOk={handleLinkSubmit}
        onCancel={handleLinkCancel}
        confirmLoading={isLoading}
        width={600}
      >
        <Form form={form} layout="vertical">
          {linkType === 'recipe-to-product' ? (
            <>
              <div className="mb-4">
                <Text strong>{t('TXT_SELECTED_PRODUCT')}: </Text>
                <Text>{selectedProduct?.name}</Text>
              </div>
              
              <Form.Item
                name="recipes"
                label={t('TXT_SELECT_RECIPES')}
                rules={[{ required: true, message: t('MSG_PLEASE_SELECT_RECIPES') }]}
              >
                <RecipeSelector
                  storeCode={storeCode}
                  ownerId={ownerId}
                  multiple={true}
                  excludeIds={selectedProduct?.recipes || []}
                />
              </Form.Item>

              <Form.Item
                name="setAsDefault"
                valuePropName="checked"
              >
                <Alert
                  message={t('MSG_SET_AS_DEFAULT_RECIPE_INFO')}
                  type="info"
                  showIcon
                />
              </Form.Item>
            </>
          ) : (
            <>
              <div className="mb-4">
                <Text strong>{t('TXT_SELECTED_RECIPE')}: </Text>
                <Text>{selectedRecipe?.dishName}</Text>
              </div>
              
              <Form.Item
                name="products"
                label={t('TXT_SELECT_PRODUCTS')}
                rules={[{ required: true, message: t('MSG_PLEASE_SELECT_PRODUCTS') }]}
              >
                <ProductSelector
                  storeCode={storeCode}
                  ownerId={ownerId}
                  multiple={true}
                  excludeIds={selectedRecipe?.products || []}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Cost Breakdown Modal */}
      <Modal
        title={t('TXT_COST_ANALYSIS')}
        open={costModalVisible}
        onCancel={() => setCostModalVisible(false)}
        footer={null}
        width={800}
      >
        <CostBreakdown
          costData={transformCostBreakdownData(costBreakdown)}
          loading={isLoadingCost}
          showSummary={true}
        />
      </Modal>

      {/* Product Details Modal */}
      <Modal
        title={t('TXT_PRODUCT_DETAILS')}
        open={productDetailsModalVisible}
        onCancel={handleProductDetailsCancel}
        footer={null}
        width={1000}
      >
        {selectedProduct && productWithRecipes && (
          <div>
            {/* Product Basic Info */}
            <Card className="mb-4">
              <Row gutter={24}>
                <Col span={8}>
                  {productWithRecipes.imageUrl && (
                    <img 
                      src={productWithRecipes.imageUrl} 
                      alt={productWithRecipes.name}
                      style={{ width: '100%', maxWidth: '200px', borderRadius: '8px' }}
                    />
                  )}
                </Col>
                <Col span={16}>
                  <Title level={4}>{productWithRecipes.name}</Title>
                  <Text type="secondary" className="text-lg mb-2 block">
                    {t('TXT_PRODUCT_CODE')}: {productWithRecipes.productCode}
                  </Text>
                  
                  <Row gutter={16} className="mb-3">
                    <Col span={8}>
                      <Statistic
                        title={t('TXT_RETAIL_PRICE')}
                        value={parseFloat(productWithRecipes.retailPrice?.$numberDecimal || productWithRecipes.retailPrice || 0).toLocaleString()}
                        suffix="VND"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title={t('TXT_COST_PRICE')}
                        value={parseFloat(productWithRecipes.costPrice?.$numberDecimal || productWithRecipes.costPrice || 0).toLocaleString()}
                        suffix="VND"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title={t('TXT_MIN_STOCK')}
                        value={productWithRecipes.minStock || 0}
                        suffix={productWithRecipes.unit || ''}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Col>
                  </Row>

                  <div className="mb-2">
                    <Text strong>{t('TXT_STATUS')}: </Text>
                    <Tag color={productWithRecipes.status === 'selling' ? 'green' : 'red'}>
                      {t(`TXT_${productWithRecipes.status?.toUpperCase()}`)}
                    </Tag>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Default Recipe Info */}
            {productWithRecipes.defaultRecipeId && productWithRecipes.recipes && productWithRecipes.recipes.length > 0 && (
              (() => {
                // Find the default recipe from the populated recipes array
                const defaultRecipe = productWithRecipes.recipes.find(
                  recipe => recipe._id === productWithRecipes.defaultRecipeId._id
                ) || productWithRecipes.recipes[0]; // fallback to first recipe

                return (
                  <Card 
                    title={
                      <span>
                        <StarOutlined className="mr-2" />
                        {t('TXT_DEFAULT_RECIPE')}
                      </span>
                    }
                    className="mb-4"
                  >
                    <Title level={5}>{defaultRecipe.dishName}</Title>
                    <Text type="secondary" className="block mb-3">
                      {defaultRecipe.description}
                    </Text>
                    
                    <div className="mb-3">
                      <Text strong>{t('TXT_YIELD')}: </Text>
                      <Text>
                        {defaultRecipe.yield?.quantity || 1} {
                          defaultRecipe.yield?.unit || t('TXT_PIECE')
                        }
                      </Text>
                    </div>

                    {/* Calculate and display total recipe cost */}
                    {defaultRecipe.ingredients && (
                      <div className="mb-3">
                        <Text strong>{t('TXT_TOTAL_RECIPE_COST')}: </Text>
                        <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                          {calculateTotalRecipeCost(defaultRecipe.ingredients).toLocaleString()} VND
                        </Text>
                      </div>
                    )}

                    {defaultRecipe.ingredients && (
                      <div>
                        <Text strong className="block mb-2">{t('TXT_INGREDIENTS')}:</Text>
                        <Table
                          size="small"
                          dataSource={defaultRecipe.ingredients}
                          rowKey="_id"
                          pagination={false}
                          columns={[
                            {
                              title: t('TXT_INGREDIENT_NAME'),
                              key: 'name',
                              render: (_, record) => {
                                if (record.ingredientId && typeof record.ingredientId === 'object') {
                                  return record.ingredientId.name;
                                }
                                return record.ingredientId || '-';
                              }
                            },
                            {
                              title: t('TXT_AMOUNT_USED'),
                              key: 'amount',
                              render: (_, record) => `${record.amountUsed} ${record.unit}`
                            },
                            {
                              title: t('TXT_COST_CALCULATION'),
                              key: 'cost',
                              render: (_, record) => {
                                if (record.ingredientId && typeof record.ingredientId === 'object') {
                                  const standardCost = record.ingredientId.standardCost;
                                  if (standardCost) {
                                    const costValue = standardCost.$numberDecimal || standardCost;
                                    const ingredientUnit = record.ingredientId.unit;
                                    const totalCost = calculateIngredientCost(record);
                                    
                                    return (
                                      <div>
                                        <div className="text-sm">
                                          <Text type="secondary">
                                            {parseFloat(costValue).toLocaleString()} VND/{ingredientUnit}
                                          </Text>
                                        </div>
                                        <div>
                                          <Text strong>
                                            {totalCost.toLocaleString()} VND
                                          </Text>
                                        </div>
                                      </div>
                                    );
                                  }
                                }
                                return '-';
                              }
                            }
                          ]}
                        />
                      </div>
                    )}
                  </Card>
                );
              })()
            )}

            {/* All Linked Recipes */}
            {productWithRecipes.recipes && productWithRecipes.recipes.length > 0 && (
              <Card 
                title={
                  <span>
                    <ReconciliationOutlined className="mr-2" />
                    {t('TXT_ALL_LINKED_RECIPES')} ({productWithRecipes.recipes.length})
                  </span>
                }
              >
                {productWithRecipes.recipes.map((recipe, index) => (
                  <Card
                    key={recipe._id}
                    type="inner"
                    size="small"
                    className="mb-3"
                    title={
                      <div className="flex justify-between items-center">
                        <span>{recipe.dishName}</span>
                        {productWithRecipes.defaultRecipeId?._id === recipe._id && (
                          <Tag color="gold" icon={<StarOutlined />}>
                            {t('TXT_DEFAULT')}
                          </Tag>
                        )}
                      </div>
                    }
                  >
                    {recipe.description && (
                      <Text type="secondary" className="block mb-2">
                        {recipe.description}
                      </Text>
                    )}
                    
                    <div className="mb-2">
                      <Text strong>{t('TXT_YIELD')}: </Text>
                      <Text>
                        {recipe.yield?.quantity || 1} {recipe.yield?.unit || t('TXT_PIECE')}
                      </Text>
                    </div>

                    {/* Recipe Cost */}
                    {recipe.ingredients && (
                      <div className="mb-2">
                        <Text strong>{t('TXT_TOTAL_RECIPE_COST')}: </Text>
                        <Text strong style={{ color: '#52c41a' }}>
                          {calculateTotalRecipeCost(recipe.ingredients).toLocaleString()} VND
                        </Text>
                      </div>
                    )}

                    {recipe.ingredients && (
                      <div>
                        <Text strong className="block mb-2">
                          {t('TXT_INGREDIENTS')} ({recipe.ingredients.length}):
                        </Text>
                        <div className="grid grid-cols-2 gap-2">
                          {recipe.ingredients.map((ingredient) => (
                            <div key={ingredient._id} className="text-sm">
                              <Text>
                                {(ingredient.ingredientId && typeof ingredient.ingredientId === 'object') 
                                  ? ingredient.ingredientId.name 
                                  : ingredient.ingredientId || '-'
                                } - {ingredient.amountUsed} {ingredient.unit}
                              </Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductRecipeManagement;
