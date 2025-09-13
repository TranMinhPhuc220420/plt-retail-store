import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Form,
  InputNumber,
  Button,
  message,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  List,
  Tag,
  Alert,
  Space
} from "antd";
import { 
  FireOutlined, 
  ExperimentOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined 
} from "@ant-design/icons";

// Requests
import { prepareCompositeProduct, getCompositeProductDetails } from "@/request/compositeProduct";
import useCompositeProductStore from "@/store/compositeProduct";
import { parseDecimal, formatPrice, parseCompositeProductData } from "@/utils/numberUtils";

const { Title, Text } = Typography;

const PrepareCompositeModal = ({ open, product, onOk, onCancel, storeCode }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  console.log(product);
  
  const { setPreparingProduct, updateCompositeProduct } = useCompositeProductStore();
  
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailedProduct, setDetailedProduct] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Move useWatch hook to top to follow Rules of Hooks
  const watchQuantity = Form.useWatch('quantityToPrepare', form) || 1;

  // Load detailed product data when modal opens
  useEffect(() => {
    if (open && product?._id) {
      loadProductDetails();
    }
  }, [open, product?._id, storeCode]);

  const loadProductDetails = async () => {
    if (!product?._id) return;
    
    try {
      setLoadingDetails(true);
      console.log('🔍 Loading detailed product data for:', product._id);
      const details = await getCompositeProductDetails(product._id, storeCode);
      const parsedDetails = parseCompositeProductData(details);
      console.log('🔍 [Prepare] Loaded detailed product:', parsedDetails);
      setDetailedProduct(parsedDetails);
    } catch (error) {
      console.error('Error loading product details:', error);
      // Fallback to using product prop data
      const parsedProduct = parseCompositeProductData(product);
      console.log('🔍 [Prepare] Using fallback product data:', parsedProduct);
      setDetailedProduct(parsedProduct);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Parse product data using the existing utility function - use detailedProduct when available
  const productToUse = useMemo(() => {
    if (detailedProduct) {
      console.log('🔍 [Prepare] Using detailed product:', detailedProduct);
      return detailedProduct;
    }
    
    if (!product) return null;
    
    // Parse the product data to handle Decimal128 values properly
    const parsedProduct = parseCompositeProductData(product);
    console.log('🔍 [Prepare] Using parsed product from prop:', parsedProduct);
    return parsedProduct;
  }, [detailedProduct, product]);

  // Form submission - Show confirmation first
  const handleSubmit = async (values) => {
    try {
      // Validate before showing confirmation
      if (!values.quantityToPrepare || values.quantityToPrepare < 1 || values.quantityToPrepare > 10) {
        messageApi.error(t('MSG_INVALID_QUANTITY_TO_PREPARE'));
        return;
      }

      // Check if we have valid requirements (prioritize ingredient requirements)
      const currentCalculation = calculatePrepareCompositeValues();
      const hasIngredientRequirements = currentCalculation.ingredientRequirements && currentCalculation.ingredientRequirements.length > 0;
      const hasRequirements = currentCalculation.requirements && currentCalculation.requirements.length > 0;
      
      if (!hasIngredientRequirements && !hasRequirements && (!productToUse?.compositeInfo?.recipeCost || productToUse.compositeInfo.recipeCost <= 0)) {
        messageApi.error(t('MSG_NO_VALID_REQUIREMENTS'));
        return;
      }

      // Check for insufficient stock in ingredients
      if (hasIngredientRequirements) {
        const insufficientIngredients = currentCalculation.ingredientRequirements.filter(req => 
          !req.isStockSufficient
        );

        if (insufficientIngredients.length > 0) {
          const shortfallMessage = insufficientIngredients.map(ing => 
            `${ing.ingredientName}: cần ${ing.quantityNeeded.toFixed(2)} ${ing.unit}, chỉ có ${ing.availableStock.toFixed(2)} ${ing.unit}`
          ).join('\n');
          
          messageApi.error({
            content: `Không đủ nguyên liệu trong kho:\n${shortfallMessage}`,
            duration: 8
          });
          return;
        }
      }

      // Check for invalid requirements (legacy validation)
      const invalidRequirements = currentCalculation.requirements.filter(req => 
        !req.isValid || isNaN(req.quantityNeeded) || req.quantityNeeded <= 0
      );

      if (invalidRequirements.length > 0) {
        messageApi.error(t('MSG_INVALID_REQUIREMENTS_FOUND'));
        console.error('Invalid requirements:', invalidRequirements);
        return;
      }

      // Show confirmation modal
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error in validation:', error);
      messageApi.error('Có lỗi xảy ra khi kiểm tra dữ liệu');
    }
  };

  // Actual preparation function
  const handleConfirmedPrepare = async () => {
    const values = form.getFieldsValue();
    try {
      setLoading(true);
      setPreparingProduct(product._id, true);

      const result = await prepareCompositeProduct(product._id, values.quantityToPrepare);
      
      // Show detailed success message
      const totalServingsPrepared = result.totalServingsPrepared || (product.compositeInfo.capacity.quantity * values.quantityToPrepare);
      messageApi.success({
        content: `${t('MSG_SUCCESS_PREPARE_COMPOSITE_PRODUCT')} - Đã chuẩn bị ${totalServingsPrepared} ${product.compositeInfo.capacity.unit}`,
        duration: 4
      });
      
      // Update product in store with proper validation
      const newStock = product.compositeInfo.currentStock + 
        (product.compositeInfo.capacity.quantity * values.quantityToPrepare);
      
      updateCompositeProduct(product._id, {
        'compositeInfo.currentStock': newStock,
        'compositeInfo.lastPreparedAt': new Date()
      });
      
      form.resetFields();
      setShowConfirmation(false);
      onOk();
    } catch (error) {
      console.error('Error preparing composite product:', error);
      
      // Handle specific error types from backend
      const errorType = error.response?.data?.error;
      const errorMessage = error.response?.data?.message;
      const errorDetails = error.response?.data?.details;
      
      switch (errorType) {
        case 'insufficient_ingredients':
          // Show detailed information about missing ingredients
          messageApi.error(t('MSG_INSUFFICIENT_INGREDIENTS'));
          if (errorDetails && Array.isArray(errorDetails)) {
            console.error('Thiếu nguyên liệu:', errorDetails);
            // Show detailed ingredient shortage info
            const missingItems = errorDetails.map(item => 
              `${item.name}: cần ${item.needed} ${item.unit}, chỉ có ${item.available} ${item.unit}`
            ).join('\n');
            messageApi.warning({
              content: `Chi tiết thiếu nguyên liệu:\n${missingItems}`,
              duration: 8
            });
          }
          break;
          
        case 'invalid_composite_structure':
          messageApi.error(errorMessage || 'Cấu trúc sản phẩm tổng hợp không hợp lệ');
          break;
          
        case 'invalid_quantity_to_prepare':
          messageApi.error(t('MSG_INVALID_QUANTITY_TO_PREPARE') || 'Số lượng chuẩn bị không hợp lệ (1-10)');
          break;
          
        case 'composite_product_not_found':
          messageApi.error('Không tìm thấy sản phẩm tổng hợp');
          break;
          
        case 'child_product_not_found':
          messageApi.error('Một hoặc nhiều nguyên liệu không còn tồn tại');
          break;
          
        case 'invalid_child_product_structure':
          messageApi.error(errorMessage || 'Cấu trúc nguyên liệu không hợp lệ');
          break;
          
        case 'failed_to_prepare_composite_product':
          messageApi.error('Lỗi hệ thống khi chuẩn bị sản phẩm. Vui lòng thử lại sau.');
          break;
          
        default:
          // Handle other error types or network errors
          if (error.response?.status === 400) {
            messageApi.error(errorMessage || 'Dữ liệu đầu vào không hợp lệ');
          } else if (error.response?.status === 404) {
            messageApi.error('Không tìm thấy sản phẩm');
          } else if (error.response?.status === 500) {
            messageApi.error('Lỗi hệ thống. Vui lòng thử lại sau.');
          } else if (!error.response) {
            // Network error
            messageApi.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.');
          } else {
            // Fallback error message
            messageApi.error(t('MSG_ERROR_PREPARE_COMPOSITE_PRODUCT') || 'Lỗi khi chuẩn bị sản phẩm tổng hợp');
          }
      }
    } finally {
      setLoading(false);
      setPreparingProduct(product._id, false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setShowConfirmation(false);
    onCancel();
  };

  const handleConfirmationCancel = () => {
    setShowConfirmation(false);
  };

  // Calculate required ingredients based on recipe (aligned with backend logic)
  const calculatePrepareCompositeValues = () => {
    console.log('🔍 calculatePrepareCompositeValues called');
    console.log('🔍 productToUse:', productToUse);
    console.log('🔍 watchQuantity:', watchQuantity);
    
    if (!productToUse) {
      console.log('🔍 No productToUse available');
      return {
        totalCost: 0,
        totalSellingRevenue: 0,
        totalRetailRevenue: 0,
        costPerServing: 0,
        totalServings: 0,
        requirements: [],
        ingredientRequirements: []
      };
    }
    
    // Get recipe information from the product
    const recipe = productToUse?.compositeInfo?.recipeId;
    const capacityQuantity = productToUse?.compositeInfo?.capacity?.quantity || 1;
    const totalServings = capacityQuantity * watchQuantity;
    
    console.log('🔍 Recipe info:', { 
      recipe: recipe ? 'found' : 'not found', 
      ingredients: recipe?.ingredients?.length || 0,
      capacityQuantity,
      totalServings 
    });
    
    console.log('🔍 Product pricing info:', {
      recipeCost: productToUse?.compositeInfo?.recipeCost,
      costPrice: productToUse?.costPrice,
      price: productToUse?.price,
      retailPrice: productToUse?.retailPrice
    });
    
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      console.log('🔍 No recipe or ingredients found, using fallback calculation');
      // Fallback to recipe cost if available, or product pricing
      const recipeCostPerServingRaw = productToUse?.compositeInfo?.recipeCost || productToUse?.costPrice || 0;
      const recipeCostPerServing = parseDecimal(recipeCostPerServingRaw);
      const sellingPricePerServingRaw = productToUse?.price || 0;
      const sellingPricePerServing = parseDecimal(sellingPricePerServingRaw);
      const retailPricePerServingRaw = productToUse?.retailPrice || 0;
      const retailPricePerServing = parseDecimal(retailPricePerServingRaw);
      
      // Calculate total cost based on total servings, not just quantity to prepare
      const totalCostFallback = recipeCostPerServing * totalServings;
      
      console.log('🔍 Fallback calculation:', {
        recipeCostPerServingRaw,
        recipeCostPerServing,
        watchQuantity,
        totalServings,
        totalCostFallback
      });
      
      return {
        totalCost: totalCostFallback,
        totalSellingRevenue: sellingPricePerServing * totalServings,
        totalRetailRevenue: retailPricePerServing * totalServings,
        costPerServing: recipeCostPerServing,
        totalServings: totalServings,
        requirements: [],
        ingredientRequirements: []
      };
    }

    // Calculate ingredient requirements based on recipe
    const recipeYield = recipe.yield?.quantity || 1;
    const recipeBatchesNeeded = Math.ceil(totalServings / recipeYield);
    
    console.log('🔍 Recipe calculation:', {
      recipeYield,
      totalServings,
      recipeBatchesNeeded,
      watchQuantity
    });

    let totalRecipeCost = 0;
    const ingredientRequirements = recipe.ingredients.map(recipeIngredient => {
      const ingredient = recipeIngredient.ingredientId;
      
      if (!ingredient) {
        return null;
      }
      
      const amountPerRecipeBatch = recipeIngredient.amountUsed || 0;
      const totalNeeded = amountPerRecipeBatch * recipeBatchesNeeded;
      const availableStock = ingredient.stockQuantity || 0;
      
      // Use standardCost first, fallback to costPrice, parse Decimal128 properly
      const unitCostRaw = ingredient.standardCost || ingredient.costPrice || 0;
      const unitCost = parseDecimal(unitCostRaw);
      const ingredientCost = unitCost * totalNeeded;
      
      totalRecipeCost += ingredientCost;
      
      console.log('🔍 Ingredient calculation:', {
        name: ingredient.name,
        amountPerRecipeBatch,
        recipeBatchesNeeded,
        totalNeeded,
        standardCostRaw: ingredient.standardCost,
        costPriceRaw: ingredient.costPrice,
        unitCost,
        ingredientCost,
        availableStock,
        ingredient: ingredient // Log full ingredient object for debugging
      });
      
      const requirement = {
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        quantityNeeded: totalNeeded,
        unit: ingredient.unit || 'kg',
        availableStock: availableStock,
        isStockSufficient: availableStock >= totalNeeded,
        shortfall: Math.max(0, totalNeeded - availableStock),
        costPrice: unitCost,
        totalCost: ingredientCost,
        amountPerRecipeBatch: amountPerRecipeBatch,
        recipeBatchesNeeded: recipeBatchesNeeded,
        isValid: totalNeeded > 0 && !isNaN(totalNeeded)
      };
      
      console.log('🔍 Ingredient requirement:', requirement);
      return requirement;
    }).filter(req => req !== null && req.isValid);

    // Calculate costs
    const costPerServing = totalServings > 0 ? totalRecipeCost / totalServings : 0;
    const sellingPricePerServingRaw = productToUse?.price || 0;
    const sellingPricePerServing = parseDecimal(sellingPricePerServingRaw);
    const retailPricePerServingRaw = productToUse?.retailPrice || 0;
    const retailPricePerServing = parseDecimal(retailPricePerServingRaw);
    
    console.log('🔍 Cost calculation summary:', {
      totalRecipeCost,
      totalServings,
      costPerServing,
      sellingPricePerServingRaw,
      sellingPricePerServing,
      retailPricePerServingRaw,
      retailPricePerServing
    });
    
    const result = {
      totalCost: totalRecipeCost,
      totalSellingRevenue: sellingPricePerServing * totalServings,
      totalRetailRevenue: retailPricePerServing * totalServings,
      costPerServing: costPerServing,
      totalServings: totalServings,
      requirements: [], // Keep empty for backward compatibility
      ingredientRequirements: ingredientRequirements,
      recipeBatchesNeeded: recipeBatchesNeeded,
      recipeYield: recipeYield
    };
    
    console.log('🔍 Final prepare calculation:', result);
    return result;
  };

  // Calculate values from detailed product
  const {
    totalCost,
    totalSellingRevenue,
    totalRetailRevenue,
    costPerServing,
    totalServings,
    requirements,
    ingredientRequirements,
    recipeBatchesNeeded,
    recipeYield
  } = calculatePrepareCompositeValues();

  // Validate product structure before rendering
  if (!product || !product.compositeInfo) {
    return null;
  }

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <FireOutlined className="text-orange-500" />
          <span>{t('TITLE_PREPARE_COMPOSITE_PRODUCT')}</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={700}
    >
      {contextHolder}
      
      <Card className="mb-4" size="small">
        <div className="flex items-center space-x-2 mb-2">
          <ExperimentOutlined className="text-blue-500" />
          <Title level={5} className="mb-0">{product.name}</Title>
        </div>
        <Row gutter={16}>
          <Col span={8}>
            <Text className="text-gray-500">{t('TXT_CAPACITY')}: </Text>
            <Text strong>
              {product.compositeInfo.capacity.quantity} {product.compositeInfo.capacity.unit}
            </Text>
          </Col>
          <Col span={8}>
            <Text className="text-gray-500">{t('TXT_CURRENT_STOCK')}: </Text>
            <Text strong>
              {product.compositeInfo.currentStock} {product.compositeInfo.capacity.unit}
            </Text>
          </Col>
          <Col span={8}>
            <Text className="text-gray-500">{t('TXT_EXPIRY_HOURS')}: </Text>
            <Text strong>{product.compositeInfo.expiryHours}</Text>
          </Col>
        </Row>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ quantityToPrepare: 1 }}
      >
        <Form.Item
          name="quantityToPrepare"
          label={t('TXT_QUANTITY_TO_PREPARE')}
          rules={[
            { required: true, message: t('MSG_QUANTITY_REQUIRED') },
            { type: 'number', min: 1, max: 10, message: t('MSG_QUANTITY_RANGE') }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={10}
            placeholder={t('TXT_ENTER_QUANTITY')}
            addonAfter={t('TXT_BATCHES')}
          />
        </Form.Item>

        <Divider>{t('TXT_PREPARATION_SUMMARY')}</Divider>

        {loadingDetails ? (
          <div className="text-center py-8">
            <Text type="secondary">{t('TXT_LOADING_PRODUCT_DETAILS', 'Đang tải thông tin sản phẩm...')}</Text>
          </div>
        ) : (
          <>
            {/* Debug Information - Remove in production */}
            {/* {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <details>
                  <summary className="cursor-pointer font-semibold">🔍 Debug Info - Cost Calculation</summary>
                  <div className="mt-2 space-y-2">
                    <div>Total Recipe Cost: <span className="font-mono">{totalCost}</span></div>
                    <div>Recipe Ingredients Count: <span className="font-mono">{ingredientRequirements?.length || 0}</span></div>
                    <div>Recipe Batches Needed: <span className="font-mono">{recipeBatchesNeeded || 0}</span></div>
                    <div>Total Servings: <span className="font-mono">{totalServings || 0}</span></div>
                    {ingredientRequirements?.slice(0, 2).map((ing, idx) => (
                      <div key={idx}>
                        {ing.ingredientName}: standardCost=<span className="font-mono">{JSON.stringify(productToUse?.compositeInfo?.recipeId?.ingredients?.[idx]?.ingredientId?.standardCost)}</span>, costPrice=<span className="font-mono">{JSON.stringify(productToUse?.compositeInfo?.recipeId?.ingredients?.[idx]?.ingredientId?.costPrice)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )} */}
            <Row gutter={16} className="mb-4">
              <Col span={8}>
                <Card size="small" className="text-center">
                  <Title level={4} className="text-blue-600 mb-1">
                    {totalServings}
                  </Title>
                  <Text className="text-gray-500">
                    {t('TXT_TOTAL_SERVINGS')}
                  </Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" className="text-center">
                  <Title level={4} className="text-red-600 mb-1">
                    {formatPrice(isNaN(totalCost) ? 0 : totalCost)}
                  </Title>
                  <Text className="text-gray-500">
                    {t('TXT_COST_PRICE')}
                  </Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" className="text-center">
                  <Title level={4} className="text-green-600 mb-1">
                    {formatPrice(isNaN(totalSellingRevenue) ? 0 : totalSellingRevenue)}
                  </Title>
                  <Text className="text-gray-500">
                    {t('TOTAL_REVENUE')}
                  </Text>
                </Card>
              </Col>
            </Row>

            <Divider>{t('TXT_REQUIRED_INGREDIENTS')}</Divider>

            {/* Show recipe information if available */}
            {recipeBatchesNeeded && recipeYield && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <Row gutter={16}>
                  <Col span={12}>
                    <Text className="text-sm text-gray-600">
                      <strong>Công thức:</strong> {productToUse?.compositeInfo?.recipeId?.dishName || 'N/A'}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text className="text-sm text-gray-600">
                      <strong>Số lô công thức cần làm:</strong> {recipeBatchesNeeded} lô (mỗi lô = {recipeYield} phần)
                    </Text>
                  </Col>
                </Row>
              </div>
            )}

            {(!ingredientRequirements || ingredientRequirements.length === 0) && (!requirements || requirements.length === 0) ? (
              <div className="text-center py-4">
                <Text type="secondary">{t('TXT_NO_INGREDIENTS_REQUIRED')}</Text>
              </div>
            ) : (
              <>
                {/* Show ingredient requirements (from recipe) */}
                {ingredientRequirements && ingredientRequirements.length > 0 && (
                  <div className="mb-4">
                    <Text strong className="block mb-2">Nguyên liệu cần thiết (từ công thức):</Text>
                    <List
                      size="small"
                      dataSource={ingredientRequirements}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            title={
                              <div className="flex items-center justify-between">
                                <span>{item.ingredientName}</span>
                                <div className="flex space-x-1">
                                  {!item.isStockSufficient && (
                                    <Tag color="red" size="small">Thiếu {item.shortfall.toFixed(2)} {item.unit}</Tag>
                                  )}
                                  {item.isStockSufficient && (
                                    <Tag color="green" size="small">Đủ</Tag>
                                  )}
                                </div>
                              </div>
                            }
                            description={
                              <div className="flex justify-between items-center">
                                <span>
                                  <Text strong className={!item.isStockSufficient ? 'text-red-600' : ''}>
                                    Cần: {typeof item.quantityNeeded === 'number' && !isNaN(item.quantityNeeded) 
                                      ? item.quantityNeeded.toFixed(2) 
                                      : '0'} {item.unit}
                                  </Text>
                                  <Text type="secondary" className="ml-2">
                                    (Tồn kho: {item.availableStock.toFixed(2)} {item.unit})
                                  </Text>
                                </span>
                                <div className="flex space-x-2">
                                  <Tag color="red">
                                    Chi phí: {formatPrice(
                                      typeof item.totalCost === 'number' && !isNaN(item.totalCost) 
                                        ? item.totalCost 
                                        : 0
                                    )}
                                  </Tag>
                                </div>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                )}

                {/* Fallback to child products if no ingredients */}
                {(!ingredientRequirements || ingredientRequirements.length === 0) && requirements && requirements.length > 0 && (
                  <>
                    {requirements.some(req => req.isLegacyData) && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <Text type="warning" className="text-sm">
                          ⚠️ {t('TXT_LEGACY_DATA_WARNING', 'Some ingredients are using default quantities. Please update the composite product configuration for accurate calculations.')}
                        </Text>
                      </div>
                    )}
                    
                    <Text strong className="block mb-2">Sản phẩm thành phần:</Text>
                    <List
                      size="small"
                      dataSource={requirements}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            title={
                              <div className="flex items-center justify-between">
                                <span>{item.productName}</span>
                                <div className="flex space-x-1">
                                  {!item.isValid && (
                                    <Tag color="red" size="small">Invalid</Tag>
                                  )}
                                  {item.isLegacyData && (
                                    <Tag color="orange" size="small">Legacy</Tag>
                                  )}
                                </div>
                              </div>
                            }
                            description={
                              <div className="flex justify-between items-center">
                                <span>
                                  <Text strong>
                                    {typeof item.quantityNeeded === 'number' && !isNaN(item.quantityNeeded) 
                                      ? item.quantityNeeded.toFixed(2) 
                                      : '0'}
                                  </Text> {item.unit || 'units'}
                                  {item.isLegacyData && (
                                    <Text type="secondary" className="ml-2 text-xs">
                                      (default: 1 per serving)
                                    </Text>
                                  )}
                                </span>
                                <div className="flex space-x-2">
                                  <Tag color="green">
                                    {formatPrice(
                                      typeof item.totalSellingRevenue === 'number' && !isNaN(item.totalSellingRevenue) 
                                        ? item.totalSellingRevenue 
                                        : 0
                                    )}
                                  </Tag>
                                  <Tag color="red">
                                    {formatPrice(
                                      typeof item.totalCost === 'number' && !isNaN(item.totalCost) 
                                        ? item.totalCost 
                                        : 0
                                    )}
                                  </Tag>
                                </div>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <Button onClick={handleCancel}>
            {t('TXT_CANCEL')}
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            disabled={loadingDetails}
            icon={<FireOutlined />}
          >
            {t('TXT_PREPARE')} {watchQuantity} {t('TXT_BATCH')}
          </Button>
        </div>
      </Form>

      {/* Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <ExclamationCircleOutlined className="text-orange-500" />
            <span>Xác nhận chuẩn bị sản phẩm</span>
          </div>
        }
        open={showConfirmation}
        onCancel={handleConfirmationCancel}
        width={800}
        footer={[
          <Button key="cancel" onClick={handleConfirmationCancel}>
            Hủy
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            loading={loading}
            onClick={handleConfirmedPrepare}
            icon={<CheckCircleOutlined />}
            danger
          >
            Xác nhận chuẩn bị
          </Button>
        ]}
      >
        <div className="space-y-4">
          <Alert
            message="Cảnh báo: Nguyên vật liệu sẽ được trừ khỏi kho"
            description="Sau khi xác nhận, các nguyên vật liệu dưới đây sẽ được tự động trừ khỏi kho để chuẩn bị sản phẩm. Hành động này không thể hoàn tác."
            type="warning"
            icon={<WarningOutlined />}
            showIcon
          />

          <div className="bg-gray-50 p-4 rounded">
            <Row gutter={16} className="mb-4">
              <Col span={8}>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {watchQuantity || 1}
                  </div>
                  <div className="text-sm text-gray-600">Số lô chuẩn bị</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {totalServings || 0}
                  </div>
                  <div className="text-sm text-gray-600">Tổng phần tạo ra</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {recipeBatchesNeeded || 1}
                  </div>
                  <div className="text-sm text-gray-600">Lô công thức cần làm</div>
                </div>
              </Col>
            </Row>
          </div>

          {ingredientRequirements && ingredientRequirements.length > 0 && (
            <div>
              <Text strong className="block mb-3">
                🔥 Nguyên vật liệu sẽ bị trừ khỏi kho:
              </Text>
              <List
                size="small"
                dataSource={ingredientRequirements}
                renderItem={(item) => (
                  <List.Item className="!px-4 !py-2 border rounded mb-2">
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <Text strong>{item.ingredientName}</Text>
                        <div className="text-sm text-gray-600">
                          Tồn kho hiện tại: {item.availableStock.toFixed(2)} {item.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-600 font-semibold">
                          - {item.quantityNeeded.toFixed(2)} {item.unit}
                        </div>
                        <div className="text-sm text-gray-600">
                          Còn lại: {(item.availableStock - item.quantityNeeded).toFixed(2)} {item.unit}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded">
            <Text className="text-sm text-blue-800">
              💡 <strong>Lưu ý:</strong> Sau khi chuẩn bị xong, sản phẩm sẽ được thêm vào kho với số lượng {totalServings} {productToUse?.compositeInfo?.capacity?.unit || 'phần'}.
            </Text>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default PrepareCompositeModal;
