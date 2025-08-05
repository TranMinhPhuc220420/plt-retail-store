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
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined, CalculatorOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";

// Requests
import { updateChildProductPrices, calculatePriceFromRecipe, getCompositeProductDetails } from "@/request/compositeProduct";
import useCompositeProductStore from "@/store/compositeProduct";
import useRecipeStore from "@/store/recipe";
import { parseDecimal, formatPrice, parseCompositeProductData } from "@/utils/numberUtils";
import RecipeSelector from "@/components/form/RecipeSelector";
import useAuth from "@/hooks/useAuth";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const EditCompositeProductForm = ({ 
  compositeProductData, 
  storeId, 
  storeCode, 
  onCancel, 
  onOK 
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { user } = useAuth();

  const { regularProducts, fetchRegularProducts, updateCompositeProduct } = useCompositeProductStore();
  const { recipes, fetchRecipes } = useRecipeStore();

  // State
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [childProducts, setChildProducts] = useState([]);
  const [totalCost, setTotalCost] = useState({ sellingPrice: 0, retailPrice: 0 });
  const [forceUpdate, setForceUpdate] = useState(0); // To trigger Financial Summary re-render
  const [parsedCompositeData, setParsedCompositeData] = useState(null);

  // Recipe-related state
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [recipeCalculating, setRecipeCalculating] = useState(false);
  const [recipeCost, setRecipeCost] = useState(null);
  const [showRecipeBasedPricing, setShowRecipeBasedPricing] = useState(false);

  // Load composite product details on mount
  useEffect(() => {
    const loadCompositeProductDetails = async () => {
      if (!compositeProductData?._id) return;
      
      try {
        setLoadingDetails(true);
        const detailsResponse = await getCompositeProductDetails(compositeProductData._id, storeCode);
        const parsedData = parseCompositeProductData(detailsResponse);
        setParsedCompositeData(parsedData);
        console.log('Loaded composite product details:', parsedData);
      } catch (error) {
        console.error('Error loading composite product details:', error);
        // Fall back to using original data if API fails
        const parsedData = parseCompositeProductData(compositeProductData);
        setParsedCompositeData(parsedData);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadCompositeProductDetails();
  }, [compositeProductData, storeCode]);

  // Load regular products and recipes on mount (for display purposes only)
  useEffect(() => {
    fetchRegularProducts(storeCode);
    fetchRecipes({ storeCode });
  }, [storeCode]);

  // Initialize form with existing data
  useEffect(() => {
    if (parsedCompositeData) {
      console.log('🔍 Initializing form with parsed data:', {
        originalData: compositeProductData,
        parsedData: parsedCompositeData,
        prices: {
          price: parsedCompositeData.price,
          retailPrice: parsedCompositeData.retailPrice,
          recipeCost: parsedCompositeData.compositeInfo?.recipeCost
        },
        childProducts: parsedCompositeData.compositeInfo?.childProducts
      });
      
      // Set basic form values
      form.setFieldsValue({
        productCode: parsedCompositeData.productCode,
        name: parsedCompositeData.name,
        description: parsedCompositeData.description,
        price: parsedCompositeData.price,
        retailPrice: parsedCompositeData.retailPrice,
        currentStock: parsedCompositeData.compositeInfo?.currentStock || 0,
        expiryHours: parsedCompositeData.compositeInfo?.expiryHours || 24,
        capacity: {
          quantity: parsedCompositeData.compositeInfo?.capacity?.quantity || 1,
          unit: parsedCompositeData.compositeInfo?.capacity?.unit || 'phần'
        }
      });

      // Set recipe data if exists (read-only)
      if (parsedCompositeData.compositeInfo?.recipeId) {
        setSelectedRecipeId(parsedCompositeData.compositeInfo.recipeId._id || parsedCompositeData.compositeInfo.recipeId);
        
        // Show recipe cost info if available
        if (parsedCompositeData.compositeInfo?.recipeCost && parsedCompositeData.compositeInfo.recipeCost > 0) {
          setRecipeCost({
            costPerServing: parsedCompositeData.compositeInfo.recipeCost,
            totalRecipeCost: parsedCompositeData.compositeInfo.recipeCost,
            suggestedPrice: parsedCompositeData.price,
            suggestedRetailPrice: parsedCompositeData.retailPrice
          });
          setShowRecipeBasedPricing(true);
        }
      }

      // Set child products if they exist (display only, no editing)
      if (parsedCompositeData.compositeInfo?.childProducts && parsedCompositeData.compositeInfo.childProducts.length > 0) {
        const formattedChildProducts = parsedCompositeData.compositeInfo.childProducts.map((child, index) => ({
          id: Date.now() + index, // temporary ID for table
          productId: child.productId._id || child.productId,
          costPrice: child.costPrice,
          sellingPrice: child.sellingPrice,
          retailPrice: child.retailPrice,
          productData: child.productId
        }));
        
        console.log('🧒 Setting child products:', formattedChildProducts);
        setChildProducts(formattedChildProducts);
        calculateTotalRevenue(formattedChildProducts);
      }
    }
  }, [parsedCompositeData, form]);

  // Remove unused functions for editing mode
  // addChildProduct, removeChildProduct, updateChildProduct functions removed
  // handleRecipeChange, calculateRecipePrice functions removed
  // These are not needed in edit mode as recipe and child products are read-only

  // Add function to update child product prices
  const updateChildProductPrice = (childProductId, field, value) => {
    const updatedChildProducts = childProducts.map(child => {
      if (child.productId === childProductId) {
        return {
          ...child,
          [field]: value
        };
      }
      return child;
    });
    
    setChildProducts(updatedChildProducts);
    calculateTotalRevenue(updatedChildProducts);
    setForceUpdate(prev => prev + 1); // Trigger Financial Summary re-render
  };

  // Calculate total revenue from child products (for display only)
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

  // Calculate financial summary for display only
  const calculateFinancialSummary = () => {
    // Recipe cost is the total cost base
    const recipeCostValue = recipeCost?.costPerServing || 0;
    let totalCostPrice = recipeCostValue;

    // Calculate current selling and retail prices from child products only
    const childProductsRevenue = childProducts.reduce((total, child) => ({
      sellingPrice: total.sellingPrice + (child.sellingPrice || 0),
      retailPrice: total.retailPrice + (child.retailPrice || 0)
    }), { sellingPrice: 0, retailPrice: 0 });

    let currentSellingPrice = 0;
    let currentRetailPrice = 0;

    if (childProducts.length > 0) {
      // If we have child products, use their revenue
      currentSellingPrice = childProductsRevenue.sellingPrice;
      currentRetailPrice = childProductsRevenue.retailPrice;
    } else {
      // If no child products, use form values
      const formValues = form.getFieldsValue();
      currentSellingPrice = formValues.price || 0;
      currentRetailPrice = formValues.retailPrice || 0;
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

  // Child products table columns (editable prices)
  const childProductColumns = [
    {
      title: t('TXT_PRODUCT'),
      dataIndex: 'productId',
      key: 'productId',
      width: 200,
      render: (value, record) => (
        <div className="flex items-center">
          <span className="font-medium text-gray-700">
            {record.productData?.name || 'Unknown Product'}
          </span>
          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {record.productData?.unit || 'N/A'}
          </span>
        </div>
      )
    },
    {
      title: t('TXT_COST_PRICE'),
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 120,
      render: (value) => (
        <Text className="font-medium text-red-600">{formatPrice(value || 0)}</Text>
      )
    },
    {
      title: t('TXT_SELLING_PRICE'),
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 140,
      render: (value, record) => (
        <InputNumber
          value={value || 0}
          min={0}
          step={1000}
          className="w-full"
          formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={val => val.replace(/\$\s?|(,*)/g, '')}
          onChange={(newValue) => updateChildProductPrice(record.productId, 'sellingPrice', newValue || 0)}
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
          value={value || 0}
          min={0}
          step={1000}
          className="w-full"
          formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={val => val.replace(/\$\s?|(,*)/g, '')}
          onChange={(newValue) => updateChildProductPrice(record.productId, 'retailPrice', newValue || 0)}
        />
      )
    }
  ];

  // Form submission - only update child product prices
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Prepare child products data with only productId, sellingPrice, and retailPrice
      const childProductsData = childProducts.map(child => ({
        productId: child.productId,
        sellingPrice: child.sellingPrice,
        retailPrice: child.retailPrice
      }));

      // Call the new API to update only child product prices
      const result = await updateChildProductPrices(compositeProductData._id, childProductsData);

      messageApi.success(t('MSG_SUCCESS_UPDATE_CHILD_PRODUCT_PRICES'));
      updateCompositeProduct(compositeProductData._id, result);
      onOK();
    } catch (error) {
      console.error('Error updating child product prices:', error);
      messageApi.error(t('MSG_ERROR_UPDATE_CHILD_PRODUCT_PRICES'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  if (!compositeProductData) return null;

  // Show loading state while fetching details
  if (loadingDetails) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-500 text-lg mb-2">{t('TXT_LOADING_COMPOSITE_DETAILS')}</div>
          <div className="text-gray-400 text-sm">{t('TXT_PLEASE_WAIT')}</div>
        </div>
      </div>
    );
  }

  // Don't render form until we have parsed data
  if (!parsedCompositeData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">{t('TXT_NO_DATA_AVAILABLE')}</div>
          <div className="text-gray-400 text-sm">{t('TXT_PLEASE_REFRESH_PAGE')}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
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
              <Input placeholder={t('TXT_ENTER_PRODUCT_CODE')} disabled />
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

        <Divider>{t('TXT_RECIPE_INFORMATION')}</Divider>

        {/* Display recipe information (read-only) */}
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
                      <span className="text-blue-700 font-medium">{t('TXT_CURRENT_RECIPE')}</span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                        {t('TXT_READ_ONLY')}
                      </span>
                    </div>
                  }
                >
                  <Row gutter={[16, 8]}>
                    <Col span={7}>
                      <div className="flex flex-col">
                        <Text type="secondary" className="text-xs">{t('TXT_RECIPE_NAME')}</Text>
                        <Text strong className="text-sm">{selectedRecipe.dishName}</Text>
                      </div>
                    </Col>
                    <Col span={5}>
                      <div className="flex flex-col">
                        <Text type="secondary" className="text-xs">{t('TXT_INGREDIENTS')}</Text>
                        <Text className="text-sm">{selectedRecipe.ingredients?.length || 0} {t('TXT_INGREDIENTS_COUNT')}</Text>
                      </div>
                    </Col>
                    {selectedRecipe.yield && (
                      <Col span={5}>
                        <div className="flex flex-col">
                          <Text type="secondary" className="text-xs">{t('TXT_RECIPE_YIELD')}</Text>
                          <Text className="text-sm font-medium text-green-600">
                            {selectedRecipe.yield.quantity} {selectedRecipe.yield.unit}
                          </Text>
                        </div>
                      </Col>
                    )}
                    {selectedRecipe.expiryHours && (
                      <Col span={7}>
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
                  <span className="text-green-700 font-semibold">{t('TXT_RECIPE_COST_INFORMATION')}</span>
                </div>
                <Text type="secondary" className="text-xs">
                  {t('TXT_TOTAL_RECIPE_COST')}: <Text strong className="text-gray-700">{formatPrice(recipeCost.totalRecipeCost || recipeCost.costPerServing)}</Text>
                </Text>
              </div>
            }
          >
            {/* Display current recipe cost info */}
            <div className="mb-4">
              <Text type="secondary" className="text-sm font-medium mb-3 block">📋 {t('TXT_RECIPE')} - {t('TXT_COST_INFORMATION')}</Text>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <div className="h-20 text-center p-4 bg-white rounded-lg border-l-4 border-l-red-400 shadow-sm">
                    <div className="text-red-500 text-xs font-medium mb-1">{t('TXT_RECIPE_COST_PER_SERVING')}</div>
                    <div className="text-lg font-bold text-red-600">{formatPrice(recipeCost.costPerServing)}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="h-20 text-center p-4 bg-white rounded-lg border-l-4 border-l-blue-400 shadow-sm">
                    <div className="text-blue-500 text-xs font-medium mb-1">{t('TXT_CURRENT_PRODUCT_PRICE')}</div>
                    <div className="text-lg font-bold text-blue-600">{formatPrice(parsedCompositeData?.price || 0)}</div>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        )}

        <Divider>
          <div className="flex items-center">
            <span className="text-gray-600">
              👥 {t('TXT_CHILD_PRODUCTS')} - {t('TXT_EDITABLE_PRICES')}
            </span>
          </div>
        </Divider>

        {childProducts.length > 0 && (
          <Card
            size="small"
            className="mb-4 shadow-sm"
            title={
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">📋 {t('TXT_CHILD_PRODUCTS')} ({childProducts.length})</span>
                <div className="flex items-center space-x-4">
                  <Text type="secondary" className="text-xs">
                    {t('TXT_TOTAL_REVENUE')}:
                    <Text strong className="ml-1 text-blue-600">{formatPrice(totalCost.sellingPrice)}</Text> |
                    <Text strong className="ml-1 text-green-600">{formatPrice(totalCost.retailPrice)}</Text>
                  </Text>
                  <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                    💰 {t('TXT_PRICES_EDITABLE')}
                  </span>
                </div>
              </div>
            }
          >
            {/*<Alert
              message={t('TXT_CHILD_PRODUCTS_PRICE_EDITABLE_NOTICE')}
              description={t('TXT_CHILD_PRODUCTS_PRICE_EDIT_INSTRUCTION')}
              type="success"
              showIcon
              className="mb-4"
            />*/}
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
                    <Text type="secondary">{t('MSG_NO_CHILD_PRODUCTS')}</Text>
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
            <Text type="secondary">{t('MSG_NO_CHILD_PRODUCTS')}</Text>
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
                  </div>
                );
              })()}
            </Card>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <Button
            onClick={handleCancel}
            size="large"
            className="px-8 h-12 font-medium"
            icon={<CloseOutlined />}
          >
            {t('TXT_CANCEL')}
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            size="large"
            className="px-8 h-12 font-medium bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-md hover:shadow-lg"
            icon={<SaveOutlined />}
            disabled={childProducts.length === 0}
          >
            {loading ? (
              <span>{t('TXT_UPDATING_PRICES')}...</span>
            ) : (
              <span>{t('TXT_UPDATE_CHILD_PRICES')}</span>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EditCompositeProductForm;
