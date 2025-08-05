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
  Tag
} from "antd";
import { FireOutlined, ExperimentOutlined } from "@ant-design/icons";

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

  // Form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setPreparingProduct(product._id, true);

      // Validate before submission
      if (!values.quantityToPrepare || values.quantityToPrepare < 1 || values.quantityToPrepare > 10) {
        messageApi.error(t('MSG_INVALID_QUANTITY_TO_PREPARE'));
        return;
      }

      // Check if we have valid requirements
      const currentCalculation = calculatePrepareCompositeValues();
      if (currentCalculation.requirements.length === 0 && (!productToUse?.compositeInfo?.recipeCost || productToUse.compositeInfo.recipeCost <= 0)) {
        messageApi.error(t('MSG_NO_VALID_REQUIREMENTS'));
        return;
      }

      // Check for invalid requirements
      const invalidRequirements = currentCalculation.requirements.filter(req => 
        !req.isValid || isNaN(req.quantityNeeded) || req.quantityNeeded <= 0
      );

      if (invalidRequirements.length > 0) {
        messageApi.error(t('MSG_INVALID_REQUIREMENTS_FOUND'));
        console.error('Invalid requirements:', invalidRequirements);
        return;
      }

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
    onCancel();
  };

  // Calculate pricing based on detailed product child products (similar to ServeCompositeModal)
  const calculatePrepareCompositeValues = () => {
    console.log('🔍 calculatePrepareCompositeValues called');
    console.log('🔍 productToUse:', productToUse);
    console.log('🔍 watchQuantity:', watchQuantity);
    
    if (!productToUse?.compositeInfo?.childProducts || productToUse.compositeInfo.childProducts.length === 0) {
      console.log('🔍 No child products, using fallback calculation');
      // Fallback to recipe cost if available, or product pricing
      const recipeCostPerServing = productToUse?.compositeInfo?.recipeCost || 0;
      const sellingPricePerServing = productToUse?.price || 0;
      const retailPricePerServing = productToUse?.retailPrice || 0;
      
      const capacityQuantity = productToUse?.compositeInfo?.capacity?.quantity || 1;
      const totalServings = capacityQuantity * watchQuantity;
      
      return {
        totalCost: recipeCostPerServing * watchQuantity,
        totalSellingRevenue: sellingPricePerServing * watchQuantity,
        totalRetailRevenue: retailPricePerServing * watchQuantity,
        costPerServing: recipeCostPerServing,
        totalServings: totalServings,
        requirements: []
      };
    }

    // Calculate from child products - use sellingPrice and costPrice from child products in composite
    let costPerServing = 0;
    let sellingRevenuePerServing = 0;
    let retailRevenuePerServing = 0;
    
    const requirements = productToUse.compositeInfo.childProducts.map(child => {
      const quantityPerServing = parseFloat(child.quantityPerServing) || 1;
      const unit = child.unit || child.productId.unit || 'phần';
      
      // Use sellingPrice and costPrice from child products in composite (not from productId)
      const childCostPrice = parseDecimal(child.costPrice) || 0;
      const childSellingPrice = parseDecimal(child.sellingPrice) || 0;
      const childRetailPrice = parseDecimal(child.retailPrice) || 0;
      
      // Calculate costs per serving using child product prices
      const childCostPerServing = childCostPrice * quantityPerServing;
      const childSellingRevenuePerServing = childSellingPrice * quantityPerServing;
      const childRetailRevenuePerServing = childRetailPrice * quantityPerServing;
      
      costPerServing += childCostPerServing;
      sellingRevenuePerServing += childSellingRevenuePerServing;
      retailRevenuePerServing += childRetailRevenuePerServing;
      
      // Calculate total needed for all batches
      const capacityQuantity = parseFloat(productToUse.compositeInfo.capacity.quantity) || 1;
      const totalNeeded = quantityPerServing * capacityQuantity * watchQuantity;
      
      const requirement = {
        productId: child.productId._id,
        productName: child.productId.name || 'Unknown Product',
        quantityNeeded: totalNeeded,
        unit: unit,
        costPrice: childCostPrice,
        sellingPrice: childSellingPrice,
        retailPrice: childRetailPrice,
        totalCost: childCostPrice * totalNeeded,
        totalSellingRevenue: childSellingPrice * totalNeeded,
        totalRetailRevenue: childRetailPrice * totalNeeded,
        isValid: totalNeeded > 0 && !isNaN(totalNeeded),
        isLegacyData: !child.quantityPerServing || !child.unit
      };
      
      console.log('🔍 Child requirement:', requirement);
      return requirement;
    }).filter(req => req !== null && req.isValid);

    const capacityQuantity = productToUse?.compositeInfo?.capacity?.quantity || 1;
    const totalServings = capacityQuantity * watchQuantity;
    
    const result = {
      totalCost: costPerServing * watchQuantity,
      totalSellingRevenue: sellingRevenuePerServing * watchQuantity, 
      totalRetailRevenue: retailRevenuePerServing * watchQuantity,
      costPerServing: costPerServing,
      totalServings: totalServings,
      requirements: requirements
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
    requirements
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
            <Row gutter={16} className="mb-4">
              <Col span={6}>
                <Card size="small" className="text-center">
                  <Title level={4} className="text-blue-600 mb-1">
                    {totalServings}
                  </Title>
                  <Text className="text-gray-500">
                    {t('TXT_TOTAL_SERVINGS')}
                  </Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <Title level={4} className="text-green-600 mb-1">
                    {formatPrice(isNaN(totalSellingRevenue) ? 0 : totalSellingRevenue)}
                  </Title>
                  <Text className="text-gray-500">
                    {t('TXT_TOTAL_REVENUE')}
                  </Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <Title level={4} className="text-red-600 mb-1">
                    {formatPrice(isNaN(totalCost) ? 0 : totalCost)}
                  </Title>
                  <Text className="text-gray-500">
                    {t('TXT_TOTAL_COST')}
                  </Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <Title level={4} className="text-purple-600 mb-1">
                    {formatPrice(isNaN(costPerServing) ? 0 : costPerServing)}
                  </Title>
                  <Text className="text-gray-500">
                    {t('TXT_COST_PER_SERVING')}
                  </Text>
                </Card>
              </Col>
            </Row>

            <Divider>{t('TXT_REQUIRED_INGREDIENTS')}</Divider>

            {requirements.length === 0 ? (
              <div className="text-center py-4">
                <Text type="secondary">{t('TXT_NO_INGREDIENTS_REQUIRED')}</Text>
              </div>
            ) : (
              <>
                {requirements.some(req => req.isLegacyData) && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <Text type="warning" className="text-sm">
                      ⚠️ {t('TXT_LEGACY_DATA_WARNING', 'Some ingredients are using default quantities. Please update the composite product configuration for accurate calculations.')}
                    </Text>
                  </div>
                )}
                
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

        <div className="flex justify-end space-x-2 mt-6">
          <Button onClick={handleCancel}>
            {t('TXT_CANCEL')}
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<FireOutlined />}
          >
            {t('TXT_START_PREPARATION')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default PrepareCompositeModal;
