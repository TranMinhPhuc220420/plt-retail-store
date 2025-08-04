import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Card,
  Space,
  Divider,
  Table,
  message,
  Row,
  Col,
  Typography,
  Tooltip,
  Alert
} from "antd";
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined, CalculatorOutlined } from "@ant-design/icons";

// Requests
import { createCompositeProduct, calculatePriceFromRecipe } from "@/request/compositeProduct";
import useCompositeProductStore from "@/store/compositeProduct";
import useRecipeStore from "@/store/recipe";
import { parseDecimal, formatPrice } from "@/utils/numberUtils";
import RecipeSelector from "@/components/form/RecipeSelector";
import useAuth from "@/hooks/useAuth";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const CreateCompositeProductForm = ({ storeId, storeCode, onCancel, onOK }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { user } = useAuth();

  const { regularProducts, fetchRegularProducts, addCompositeProduct } = useCompositeProductStore();
  const { recipes, fetchRecipes } = useRecipeStore();

  // State
  const [loading, setLoading] = useState(false);
  const [childProducts, setChildProducts] = useState([]);
  const [totalCost, setTotalCost] = useState({ sellingPrice: 0, retailPrice: 0 });
  const [forceUpdate, setForceUpdate] = useState(0); // To trigger Financial Summary re-render

  // Recipe-related state
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [recipeCalculating, setRecipeCalculating] = useState(false);
  const [recipeCost, setRecipeCost] = useState(null);
  const [showRecipeBasedPricing, setShowRecipeBasedPricing] = useState(false);

  // Load regular products on mount
  useEffect(() => {
    fetchRegularProducts(storeCode);
    fetchRecipes({ storeCode });
  }, [storeCode]);

  // Recalculate child products costs when recipe cost changes
  useEffect(() => {
    if (recipeCost && childProducts.length > 0) {
      const recalculatedProducts = recalculateChildProductCosts(childProducts, recipeCost);
      setChildProducts(recalculatedProducts);
      calculateTotalRevenue(recalculatedProducts);
    }
  }, [recipeCost]);

  // Add child product row
  const addChildProduct = () => {
    // Calculate cost price from recipe divided among child products
    const recipeCostPerChild = recipeCost && recipeCost.costPerServing
      ? recipeCost.costPerServing / (childProducts.length + 1) // +1 for the new product being added
      : 0;

    const newChildProduct = {
      id: Date.now(), // temporary ID
      productId: null,
      costPrice: recipeCostPerChild, // Cost from recipe divided among child products
      sellingPrice: Math.round(recipeCostPerChild * 1.3), // 30% markup suggestion
      retailPrice: Math.round(recipeCostPerChild * 1.5), // 50% markup suggestion
      productData: null
    };
    const updatedChildProducts = [...childProducts, newChildProduct];
    setChildProducts(updatedChildProducts);

    // Update form pricing
    updateFormPricing(updatedChildProducts);
  };

  // Remove child product row
  const removeChildProduct = (id) => {
    const updatedChildProducts = childProducts.filter(item => item.id !== id);
    // Recalculate cost prices for remaining child products
    const recalculatedProducts = recalculateChildProductCosts(updatedChildProducts, recipeCost);
    setChildProducts(recalculatedProducts);
    calculateTotalRevenue(recalculatedProducts);

    // Update form pricing
    updateFormPricing(recalculatedProducts);
  };

  // Update child product
  const updateChildProduct = (id, field, value) => {
    const updatedChildProducts = childProducts.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };

        // If productId changed, update product data and calculate cost from recipe
        if (field === 'productId') {
          const productData = regularProducts.find(p => p._id === value);
          updatedItem.productData = productData;

          // Calculate cost price from recipe divided among child products
          const recipeCostPerChild = recipeCost && recipeCost.costPerServing
            ? recipeCost.costPerServing / childProducts.length
            : 0;

          updatedItem.costPrice = recipeCostPerChild;
          // Auto-suggest selling price (30% markup on cost from recipe)
          updatedItem.sellingPrice = Math.round(recipeCostPerChild * 1.3);
          // Auto-suggest retail price (50% markup on cost from recipe)  
          updatedItem.retailPrice = Math.round(recipeCostPerChild * 1.5);
        }

        return updatedItem;
      }
      return item;
    });

    setChildProducts(updatedChildProducts);

    // Recalculate cost prices for all child products if productId was changed
    if (field === 'productId') {
      const recalculatedProducts = recalculateChildProductCosts(updatedChildProducts, recipeCost);
      setChildProducts(recalculatedProducts);
      calculateTotalRevenue(recalculatedProducts);
    } else {
      calculateTotalRevenue(updatedChildProducts);
    }

    // Update form pricing based on recipe cost + child products revenue
    updateFormPricing(updatedChildProducts);

    // Force Financial Summary to re-render
    setForceUpdate(prev => prev + 1);
  };

  // Calculate total revenue from child products
  const calculateTotalRevenue = (childProductsList = childProducts) => {
    let totalSellingPrice = 0;
    let totalRetailPrice = 0;
    childProductsList.forEach(child => {
      if (child.sellingPrice) {
        totalSellingPrice += child.sellingPrice;
      }
      if (child.retailPrice) {
        totalRetailPrice += child.retailPrice;
      }
    });
    setTotalCost({ sellingPrice: totalSellingPrice, retailPrice: totalRetailPrice });
  };

  // Recalculate cost prices for all child products when recipe cost or count changes
  const recalculateChildProductCosts = (childProductsList, recipeCostData) => {
    if (!recipeCostData || !recipeCostData.costPerServing || childProductsList.length === 0) {
      return childProductsList;
    }

    const costPerChild = recipeCostData.costPerServing / childProductsList.length;

    return childProductsList.map(child => ({
      ...child,
      costPrice: costPerChild,
      // Only update suggested prices if they are currently 0 or equal to previous auto-calculated values
      sellingPrice: child.sellingPrice === 0 || child.sellingPrice === Math.round(child.costPrice * 1.3)
        ? Math.round(costPerChild * 1.3)
        : child.sellingPrice,
      retailPrice: child.retailPrice === 0 || child.retailPrice === Math.round(child.costPrice * 1.5)
        ? Math.round(costPerChild * 1.5)
        : child.retailPrice
    }));
  };

  // Update form pricing based on recipe cost + child products revenue
  const updateFormPricing = (childProductsList = childProducts) => {
    if (!recipeCost) return;

    // Calculate total revenue from child products
    const childProductsRevenue = childProductsList.reduce((total, child) => ({
      sellingPrice: total.sellingPrice + (child.sellingPrice || 0),
      retailPrice: total.retailPrice + (child.retailPrice || 0)
    }), { sellingPrice: 0, retailPrice: 0 });

    let newSellingPrice = 0;
    let newRetailPrice = 0;

    if (childProductsList.length > 0) {
      // If we have child products, use only their revenue
      newSellingPrice = childProductsRevenue.sellingPrice;
      newRetailPrice = childProductsRevenue.retailPrice;
    } else {
      // If no child products, use recipe suggested pricing
      newSellingPrice = recipeCost.suggestedPrice;
      newRetailPrice = recipeCost.suggestedRetailPrice;
    }

    // Note: We still set form values even though form fields don't exist
    // This is for consistency with other parts of the code that might reference form values
    form.setFieldsValue({
      price: newSellingPrice,
      retailPrice: newRetailPrice
    });
  };

  // Calculate financial summary
  const calculateFinancialSummary = () => {
    // Recipe cost is the total cost base
    const recipeCostValue = recipeCost?.costPerServing || 0;
    let totalCostPrice = recipeCostValue;

    // Calculate current selling and retail prices from child products only
    // When we have child products, they replace the recipe suggested pricing
    const childProductsRevenue = childProducts.reduce((total, child) => ({
      sellingPrice: total.sellingPrice + (child.sellingPrice || 0),
      retailPrice: total.retailPrice + (child.retailPrice || 0)
    }), { sellingPrice: 0, retailPrice: 0 });

    let currentSellingPrice = 0;
    let currentRetailPrice = 0;

    if (childProducts.length > 0) {
      // If we have child products, use only their revenue (they already include recipe cost markup)
      currentSellingPrice = childProductsRevenue.sellingPrice;
      currentRetailPrice = childProductsRevenue.retailPrice;
    } else {
      // If no child products, use recipe suggested pricing
      currentSellingPrice = recipeCost?.suggestedPrice || 0;
      currentRetailPrice = recipeCost?.suggestedRetailPrice || 0;
    }

    const sellingProfit = currentSellingPrice - totalCostPrice;
    const retailProfit = currentRetailPrice - totalCostPrice;

    return {
      totalCostPrice,
      sellingPrice: currentSellingPrice,
      retailPrice: currentRetailPrice,
      sellingProfit,
      retailProfit
    };
  };

  // Handle recipe selection
  const handleRecipeChange = (recipeId) => {
    console.log('Recipe selected:', recipeId);
    setSelectedRecipeId(recipeId);
    setRecipeCost(null);
    setShowRecipeBasedPricing(false);

    // Note: Keep existing child products when selecting a recipe
    // Child products can be used as additional components alongside the recipe
  };

  // Calculate price from selected recipe
  const calculateRecipePrice = async () => {
    if (!selectedRecipeId) {
      messageApi.warning(t('MSG_PLEASE_SELECT_RECIPE_FIRST'));
      return;
    }

    // Get selected recipe information
    const selectedRecipe = recipes.find(recipe => recipe._id === selectedRecipeId);
    if (!selectedRecipe || !selectedRecipe.yield) {
      messageApi.warning(t('MSG_RECIPE_YIELD_NOT_SET'));
      return;
    }

    console.log('Calculating price with:', {
      selectedRecipeId,
      capacity: selectedRecipe.yield,
      storeCode
    });

    try {
      setRecipeCalculating(true);
      const result = await calculatePriceFromRecipe(
        selectedRecipeId,
        selectedRecipe.yield,
        { storeCode }
      );

      console.log('Price calculation result:', result);
      setRecipeCost(result);
      setShowRecipeBasedPricing(true);

      // Auto-fill pricing fields based on current state
      const childProductsRevenue = childProducts.reduce((total, child) => ({
        sellingPrice: total.sellingPrice + (child.sellingPrice || 0),
        retailPrice: total.retailPrice + (child.retailPrice || 0)
      }), { sellingPrice: 0, retailPrice: 0 });

      let finalSellingPrice = 0;
      let finalRetailPrice = 0;

      if (childProducts.length > 0) {
        // If we have child products, use only their revenue
        finalSellingPrice = childProductsRevenue.sellingPrice;
        finalRetailPrice = childProductsRevenue.retailPrice;
      } else {
        // If no child products, use recipe suggested pricing
        finalSellingPrice = result.suggestedPrice;
        finalRetailPrice = result.suggestedRetailPrice;
      }

      form.setFieldsValue({
        price: finalSellingPrice,
        retailPrice: finalRetailPrice
      });

      messageApi.success(t('MSG_RECIPE_PRICE_CALCULATED_SUCCESS'));
    } catch (error) {
      console.error('Recipe price calculation error:', error);
      messageApi.error(t('MSG_RECIPE_PRICE_CALCULATION_FAILED'));
    } finally {
      setRecipeCalculating(false);
    }
  };

  // Child products table columns
  const childProductColumns = [
    {
      title: t('TXT_PRODUCT'),
      dataIndex: 'productId',
      key: 'productId',
      width: 200,
      render: (value, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder={t('TXT_SELECT_PRODUCT')}
          value={value}
          onChange={(val) => updateChildProduct(record.id, 'productId', val)}
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {regularProducts.map(product => (
            <Option key={product._id} value={product._id}>
              {product.name}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: t('TXT_COST_PRICE'),
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 120,
      render: (value) => (
        <Text type="secondary">{formatPrice(value || 0)}</Text>
      )
    },
    {
      title: t('TXT_SELLING_PRICE'),
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 140,
      render: (value, record) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={1000}
          value={value}
          onChange={(val) => updateChildProduct(record.id, 'sellingPrice', val || 0)}
          placeholder="0"
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
        />
      )
    },
    {
      title: t('TXT_RETAIL_PRICE'),
      dataIndex: 'retailPrice',
      key: 'retailPrice',
      width: 140,
      render: (value, record) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={1000}
          value={value}
          onChange={(val) => updateChildProduct(record.id, 'retailPrice', val || 0)}
          placeholder="0"
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
        />
      )
    },
    {
      title: t('TXT_ACTIONS'),
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeChildProduct(record.id)}
        />
      )
    }
  ];

  // Form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Validate: require recipe for composite products
      if (!selectedRecipeId) {
        messageApi.error(t('MSG_RECIPE_REQUIRED_FOR_COMPOSITE'));
        return;
      }

      // Validate child products if provided (optional)
      if (childProducts.length > 0) {
        const invalidProducts = childProducts.filter(
          child => !child.productId ||
            child.costPrice === undefined || child.costPrice < 0 ||
            child.sellingPrice === undefined || child.sellingPrice < 0 ||
            child.retailPrice === undefined || child.retailPrice < 0
        );

        if (invalidProducts.length > 0) {
          messageApi.error(t('MSG_ERROR_INVALID_CHILD_PRODUCTS'));
          return;
        }
      }

      // Prepare capacity information from recipe or require recipe
      let capacityInfo = null;
      let expiryHours = null;

      if (selectedRecipeId) {
        const selectedRecipe = recipes.find(recipe => recipe._id === selectedRecipeId);
        if (selectedRecipe && selectedRecipe.yield) {
          capacityInfo = selectedRecipe.yield;
          expiryHours = selectedRecipe.expiryHours;
        } else {
          messageApi.error(t('MSG_RECIPE_YIELD_NOT_SET'));
          return;
        }
      } else {
        messageApi.error(t('MSG_RECIPE_REQUIRED_FOR_COMPOSITE'));
        return;
      }

      // Calculate final prices for submission
      const childProductsRevenue = childProducts.reduce((total, child) => ({
        sellingPrice: total.sellingPrice + (child.sellingPrice || 0),
        retailPrice: total.retailPrice + (child.retailPrice || 0)
      }), { sellingPrice: 0, retailPrice: 0 });

      let finalSellingPrice = 0;
      let finalRetailPrice = 0;

      if (childProducts.length > 0) {
        // If we have child products, use only their revenue
        finalSellingPrice = childProductsRevenue.sellingPrice;
        finalRetailPrice = childProductsRevenue.retailPrice;
      } else {
        // If no child products, use recipe suggested pricing
        finalSellingPrice = recipeCost?.suggestedPrice || 0;
        finalRetailPrice = recipeCost?.suggestedRetailPrice || 0;
      }

      // Prepare data
      const compositeData = {
        ...values,
        storeId,
        capacity: capacityInfo,
        expiryHours: expiryHours,
        // Include recipe information
        recipeId: selectedRecipeId,
        // Include child products if any
        ...(childProducts.length > 0 && {
          childProducts: childProducts.map(child => ({
            productId: child.productId,
            costPrice: child.costPrice,
            sellingPrice: child.sellingPrice,
            retailPrice: child.retailPrice
          }))
        }),
        // Use calculated pricing
        price: finalSellingPrice,
        retailPrice: finalRetailPrice,
      };

      const result = await createCompositeProduct(compositeData);

      messageApi.success(t('MSG_SUCCESS_CREATE_COMPOSITE_PRODUCT'));
      addCompositeProduct(result);
      onOK();
    } catch (error) {
      console.error('Error creating composite product:', error);
      messageApi.error(t('MSG_ERROR_CREATE_COMPOSITE_PRODUCT'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="productCode"
              label={t('TXT_PRODUCT_CODE')}
              rules={[
                { required: true, message: t('MSG_PRODUCT_CODE_REQUIRED') },
                { min: 3, max: 50, message: t('MSG_PRODUCT_CODE_LENGTH') }
              ]}
            >
              <Input placeholder={t('TXT_ENTER_PRODUCT_CODE')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label={t('TXT_PRODUCT_NAME')}
              rules={[
                { required: true, message: t('MSG_PRODUCT_NAME_REQUIRED') },
                { min: 3, max: 100, message: t('MSG_PRODUCT_NAME_LENGTH') }
              ]}
            >
              <Input placeholder={t('TXT_ENTER_PRODUCT_NAME')} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label={t('TXT_DESCRIPTION')}
        >
          <TextArea
            rows={2}
            placeholder={t('TXT_ENTER_DESCRIPTION')}
          />
        </Form.Item>

        <Divider>{t('TXT_RECIPE_SELECTION')}</Divider>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="recipeId"
              label={t('TXT_SELECT_RECIPE')}
              extra={t('TXT_RECIPE_SELECTION_HELP')}
            >
              <RecipeSelector
                value={selectedRecipeId ? [selectedRecipeId] : []}
                onChange={(values) => handleRecipeChange(values)}
                storeCode={storeCode}
                ownerId={user?._id}
                multiple={false}
                placeholder={t('TXT_SELECT_RECIPE_FOR_COMPOSITE')}
                showCost={true}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label=" " className="mb-0">
              <Button
                type="primary"
                ghost
                icon={<CalculatorOutlined />}
                onClick={calculateRecipePrice}
                loading={recipeCalculating}
                disabled={!selectedRecipeId}
                size="large"
                block
                className="h-10 flex items-center justify-center"
              >
                {recipeCalculating ? t('TXT_CALCULATING') : t('TXT_CALCULATE_PRICE')}
              </Button>
            </Form.Item>
          </Col>
        </Row>

        {/* Display selected recipe information */}
        {selectedRecipeId && (
          <div className="my-4">
            {(() => {
              const selectedRecipe = recipes.find(r => r._id === selectedRecipeId);
              if (!selectedRecipe) return null;

              return (
                <Card
                  size="small"
                  className="bg-blue-50 border-blue-200"
                  title={
                    <div className="flex items-center">
                      <InfoCircleOutlined className="text-blue-500 mr-2" />
                      <span className="text-blue-700 font-medium">{t('TXT_SELECTED_RECIPE_INFO')}</span>
                    </div>
                  }
                >
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <div className="flex flex-col">
                        <Text type="secondary" className="text-xs">{t('TXT_RECIPE_NAME')}</Text>
                        <Text strong className="text-sm">{selectedRecipe.dishName}</Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="flex flex-col">
                        <Text type="secondary" className="text-xs">{t('TXT_INGREDIENTS')}</Text>
                        <Text className="text-sm">{selectedRecipe.ingredients?.length || 0} {t('TXT_INGREDIENTS_COUNT')}</Text>
                      </div>
                    </Col>
                    {selectedRecipe.yield && (
                      <Col span={8}>
                        <div className="flex flex-col">
                          <Text type="secondary" className="text-xs">{t('TXT_RECIPE_YIELD')}</Text>
                          <Text className="text-sm font-medium text-green-600">
                            {selectedRecipe.yield.quantity} {selectedRecipe.yield.unit}
                          </Text>
                        </div>
                      </Col>
                    )}
                    {selectedRecipe.expiryHours && (
                      <Col span={8}>
                        <div className="flex flex-col">
                          <Text type="secondary" className="text-xs">{t('TXT_EXPIRY_HOURS')}</Text>
                          <Text className="text-sm font-medium text-purple-600">
                            {selectedRecipe.expiryHours} {t('TXT_HOURS')}
                          </Text>
                        </div>
                      </Col>
                    )}
                    {selectedRecipe.description && (
                      <Col span={24}>
                        <div className="flex flex-col">
                          <Text type="secondary" className="text-xs">{t('TXT_DESCRIPTION')}</Text>
                          <Text className="text-sm text-gray-600">{selectedRecipe.description}</Text>
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card>
              );
            })()}
          </div>
        )}

        {showRecipeBasedPricing && recipeCost && (
          <Card
            size="small"
            className="mb-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-sm"
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalculatorOutlined className="text-green-500 mr-2" />
                  <span className="text-green-700 font-semibold">{t('TXT_RECIPE_PRICING_CALCULATED')}</span>
                </div>
                <Text type="secondary" className="text-xs">
                  {t('TXT_TOTAL_RECIPE_COST')}: <Text strong className="text-gray-700">{formatPrice(recipeCost.totalRecipeCost)}</Text>
                </Text>
              </div>
            }
          >
            {/* Main Recipe Pricing */}
            <div className="mb-4">
              <Text type="secondary" className="text-sm font-medium mb-3 block">📋 {t('TXT_RECIPE')} - {t('TXT_SUGGESTED_PRICE')}</Text>
              <Row gutter={[12, 12]}>
                <Col span={8}>
                  <div className="h-25 text-center p-4 bg-white rounded-lg border-l-4 border-l-red-400 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-red-500 text-xs font-medium mb-1">{t('TXT_RECIPE_COST_PER_SERVING')}</div>
                    <div className="text-xl font-bold text-red-600">{formatPrice(recipeCost.costPerServing)}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="h-25 text-center p-4 bg-white rounded-lg border-l-4 border-l-blue-400 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-blue-500 text-xs font-medium mb-1">{t('TXT_SUGGESTED_PRICE')}</div>
                    <div className="text-xl font-bold text-blue-600">{formatPrice(recipeCost.suggestedPrice)}</div>
                    <div className="text-xs text-gray-500">+30% markup</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="h-25 text-center p-4 bg-white rounded-lg border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-orange-500 text-xs font-medium mb-1">{t('TXT_SUGGESTED_RETAIL')}</div>
                    <div className="text-xl font-bold text-orange-600">{formatPrice(recipeCost.suggestedRetailPrice)}</div>
                    <div className="text-xs text-gray-500">+50% markup</div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Child Products Pricing Suggestions */}
            {childProducts.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <Text type="secondary" className="text-sm font-medium mb-3 block flex items-center">
                  👥 {t('TXT_CHILD_PRODUCTS_PRICING_SUGGESTIONS')}
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {childProducts.length} {t('TXT_PRODUCT').toLowerCase()}
                  </span>
                </Text>
                <Row gutter={[12, 12]}>
                  <Col span={8}>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
                      <div className="text-blue-600 text-xs font-medium mb-1">{t('TXT_COST_PER_CHILD_PRODUCT')}</div>
                      <div className="text-lg font-bold text-blue-700">
                        {formatPrice(recipeCost.costPerServing / childProducts.length)}
                      </div>
                      <div className="text-xs text-blue-500 mt-1">
                        {formatPrice(recipeCost.costPerServing)} ÷ {childProducts.length}
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 shadow-sm">
                      <div className="text-purple-600 text-xs font-medium mb-1">{t('TXT_SUGGESTED_CHILD_SELLING_PRICE')}</div>
                      <div className="text-lg font-bold text-purple-700">
                        {formatPrice(Math.round((recipeCost.costPerServing / childProducts.length) * 1.3))}
                      </div>
                      <div className="text-xs text-purple-500 mt-1">+30% markup</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200 shadow-sm">
                      <div className="text-pink-600 text-xs font-medium mb-1">{t('TXT_SUGGESTED_CHILD_RETAIL_PRICE')}</div>
                      <div className="text-lg font-bold text-pink-700">
                        {formatPrice(Math.round((recipeCost.costPerServing / childProducts.length) * 1.5))}
                      </div>
                      <div className="text-xs text-pink-500 mt-1">+50% markup</div>
                    </div>
                  </Col>
                </Row>

                {/* Quick explanation */}
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Text className="text-xs text-yellow-700 flex items-center">
                    💡 <span className="ml-1">{t('TXT_CHILD_PRODUCTS_EXPLANATION')}</span>
                  </Text>
                </div>
              </div>
            )}
          </Card>
        )}

        <Divider>
          <div className="flex items-center">
            <span className="text-gray-600">
              {selectedRecipeId
                ? `👥 ${t('TXT_CHILD_PRODUCTS_OPTIONAL_WITH_RECIPE')}`
                : `👥 ${t('TXT_CHILD_PRODUCTS')}`
              }
            </span>
          </div>
        </Divider>

        {/* {selectedRecipeId && (
          <Alert
            message={
              <div className="flex items-center">
                <InfoCircleOutlined className="mr-2" />
                <span className="font-medium">{t('TXT_CHILD_PRODUCTS_INFO')}</span>
              </div>
            }
            description={t('TXT_CHILD_PRODUCTS_ADDITIONAL_INFO')}
            type="info"
            showIcon={false}
            className="mb-4 border-l-4 border-l-blue-400"
          />
        )} */}

        <div className="mb-4">
          <Button
            type="dashed"
            onClick={addChildProduct}
            icon={<PlusOutlined />}
            className="w-full h-12 flex items-center justify-center text-blue-600 border-blue-300 hover:border-blue-500 hover:text-blue-700"
            size="large"
          >
            <span className="font-medium">{t('TXT_ADD_CHILD_PRODUCT')}</span>
          </Button>
        </div>

        {childProducts.length > 0 && (
          <Card
            size="small"
            className="mb-4 shadow-sm"
            title={
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">📋 {t('TXT_CHILD_PRODUCTS')} ({childProducts.length})</span>
                <Text type="secondary" className="text-xs">
                  {t('TXT_TOTAL_REVENUE')}:
                  <Text strong className="ml-1 text-blue-600">{formatPrice(totalCost.sellingPrice)}</Text> |
                  <Text strong className="ml-1 text-green-600">{formatPrice(totalCost.retailPrice)}</Text>
                </Text>
              </div>
            }
          >
            <Table
              columns={childProductColumns.map(col => ({
                ...col,
                title: <span className="font-medium text-gray-700">{col.title}</span>
              }))}
              dataSource={childProducts}
              pagination={false}
              size="small"
              rowKey="id"
              locale={{
                emptyText: (
                  <div className="py-8 text-center">
                    <div className="text-gray-400 text-4xl mb-2">📦</div>
                    <Text type="secondary">{t('MSG_NO_CHILD_PRODUCTS_YET')}</Text>
                  </div>
                )
              }}
              className="child-products-table"
            />
          </Card>
        )}

        {childProducts.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-400 text-4xl mb-2">📦</div>
            <Text type="secondary">{t('MSG_NO_CHILD_PRODUCTS_YET')}</Text>
            <div className="mt-2">
              <Text type="secondary" className="text-xs">{t('TXT_CLICK_ADD_BUTTON_TO_START')}</Text>
            </div>
          </div>
        )}



        {/* Financial Summary */}

        {childProducts.length > 0 && (
          <div className="mt-6">
            <Card
              className="shadow-md border-t-4 border-t-indigo-400"
              size="small"
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CalculatorOutlined className="mr-2 text-indigo-500" />
                    <span className="text-indigo-700 font-semibold">💰 {t('TXT_FINANCIAL_SUMMARY')}</span>
                  </div>
                  <Text type="secondary" className="text-xs">
                    {t('TXT_REAL_TIME_CALCULATION')}
                  </Text>
                </div>
              }
              key={forceUpdate} // Force re-render when forceUpdate changes
            >
              {(() => {
                const summary = calculateFinancialSummary();

                // Calculate per-unit prices and profits for child products
                const childProductCount = childProducts.length;
                const hasChildProducts = childProductCount > 0;

                // Average prices per child product
                const avgSellingPricePerUnit = hasChildProducts ? summary.sellingPrice / childProductCount : 0;
                const avgRetailPricePerUnit = hasChildProducts ? summary.retailPrice / childProductCount : 0;
                const costPricePerUnit = hasChildProducts ? summary.totalCostPrice / childProductCount : summary.totalCostPrice;

                // Profit per unit
                const sellingProfitPerUnit = avgSellingPricePerUnit - costPricePerUnit;
                const retailProfitPerUnit = avgRetailPricePerUnit - costPricePerUnit;

                if (!hasChildProducts) {
                  return (
                    <></>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Main Summary Row */}
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <div className="h-40 text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-l-4 border-l-red-400 shadow-sm">
                          <div className="text-red-600 text-sm font-medium mb-2">💸 {t('TXT_TOTAL_COST_PRICE')}</div>
                          <div className="text-2xl font-bold text-red-700 mb-2">{formatPrice(summary.totalCostPrice)}</div>
                          <div className="text-xs text-red-500 space-y-1">
                            {recipeCost && (
                              <div className="flex justify-between">
                                <span>{t('TXT_RECIPE')}:</span>
                                <span className="font-medium">{formatPrice(recipeCost.costPerServing)}</span>
                              </div>
                            )}
                            {hasChildProducts && (
                              <div className="pt-1 border-t border-red-200">
                                <div className="text-xs">
                                  {t('TXT_CHILD_PRODUCTS')} ({childProductCount}): {formatPrice(recipeCost?.costPerServing || 0)} ÷ {childProductCount}
                                </div>
                                <div className="font-medium">= {formatPrice(costPricePerUnit)} / sp</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="h-40 text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-l-4 border-l-blue-400 shadow-sm">
                          <div className="text-blue-600 text-sm font-medium mb-2">🏷️ {t('TXT_SELLING_PRICE')}</div>
                          <div className="text-2xl font-bold text-blue-700 mb-1">{formatPrice(summary.sellingPrice)}</div>
                          {hasChildProducts && (
                            <div className="text-xs text-blue-500 mb-2">
                              {formatPrice(avgSellingPricePerUnit)} × {childProductCount} sp
                            </div>
                          )}
                          <div className={`text-sm font-medium px-3 py-1 rounded-full ${summary.sellingProfit >= 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {t('TXT_PROFIT')}: {formatPrice(summary.sellingProfit)}
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="h-40 text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-l-4 border-l-green-400 shadow-sm">
                          <div className="text-green-600 text-sm font-medium mb-2">🛒 {t('TXT_RETAIL_PRICE')}</div>
                          <div className="text-2xl font-bold text-green-700 mb-1">{formatPrice(summary.retailPrice)}</div>
                          {hasChildProducts && (
                            <div className="text-xs text-green-500 mb-2">
                              {formatPrice(avgRetailPricePerUnit)} × {childProductCount} sp
                            </div>
                          )}
                          <div className={`text-sm font-medium px-3 py-1 rounded-full ${summary.retailProfit >= 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {t('TXT_PROFIT')}: {formatPrice(summary.retailProfit)}
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {/* Per-Unit Profit Analysis */}
                    {/* {hasChildProducts && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-center mb-3">
                          <Text className="text-purple-700 font-semibold">📊 {t('TXT_PER_UNIT_ANALYSIS')}</Text>
                        </div>
                        <Row gutter={[12, 12]}>
                          <Col span={8}>
                            <div className="text-center p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
                              <div className="text-purple-600 text-xs font-medium mb-1">{t('TXT_COST_PER_UNIT')}</div>
                              <div className="text-lg font-bold text-purple-700">{formatPrice(costPricePerUnit)}</div>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div className="text-center p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                              <div className="text-blue-600 text-xs font-medium mb-1">{t('TXT_SELLING_PROFIT_PER_UNIT')}</div>
                              <div className={`text-lg font-bold ${sellingProfitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPrice(sellingProfitPerUnit)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {avgSellingPricePerUnit > 0 ? ((sellingProfitPerUnit / avgSellingPricePerUnit) * 100).toFixed(1) : 0}% margin
                              </div>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div className="text-center p-3 bg-white rounded-lg border border-green-200 shadow-sm">
                              <div className="text-green-600 text-xs font-medium mb-1">{t('TXT_RETAIL_PROFIT_PER_UNIT')}</div>
                              <div className={`text-lg font-bold ${retailProfitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPrice(retailProfitPerUnit)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {avgRetailPricePerUnit > 0 ? ((retailProfitPerUnit / avgRetailPricePerUnit) * 100).toFixed(1) : 0}% margin
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )} */}

                    {/* Quick Summary */}
                    {/* <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <Text type="secondary" className="text-xs">{t('TXT_PROFIT_MARGIN')}</Text>
                          <div className="font-bold text-blue-600">
                            {summary.sellingPrice > 0 ? ((summary.sellingProfit / summary.sellingPrice) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                        <div>
                          <Text type="secondary" className="text-xs">{t('TXT_RETAIL_MARGIN')}</Text>
                          <div className="font-bold text-green-600">
                            {summary.retailPrice > 0 ? ((summary.retailProfit / summary.retailPrice) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                        <div>
                          <Text type="secondary" className="text-xs">{t('TXT_PRICE_RATIO')}</Text>
                          <div className="font-bold text-purple-600">
                            {summary.sellingPrice > 0 ? (summary.retailPrice / summary.sellingPrice).toFixed(2) : 0}x
                          </div>
                        </div>
                      </div>
                    </div> */}
                  </div>
                );
              })()}
            </Card>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-8 pt-6">
          <Button
            onClick={onCancel}
            size="large"
            className="px-8 h-12 font-medium"
          >
            {t('TXT_CANCEL')}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            className="px-8 h-12 font-medium bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span>{t('TXT_CREATING')}...</span>
            ) : (
              <span>{t('TXT_CREATE')}</span>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CreateCompositeProductForm;
