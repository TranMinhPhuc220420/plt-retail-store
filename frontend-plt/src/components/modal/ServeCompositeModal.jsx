import React, { useState, useEffect } from "react";
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
  Progress,
  Alert,
  Tag,
  Spin
} from "antd";
import { ShoppingOutlined, ExclamationCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";

// Requests
import { serveCompositeProduct, getCompositeProductDetails } from "@/request/compositeProduct";
import useCompositeProductStore from "@/store/compositeProduct";
import { parseDecimal, formatPrice } from "@/utils/numberUtils";

const { Title, Text } = Typography;

const ServeCompositeModal = ({ open, product, onOk, onCancel, storeCode }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const { setServingProduct, updateCompositeProduct } = useCompositeProductStore();
  
  const [loading, setLoading] = useState(false);
  const [detailedProduct, setDetailedProduct] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Move useWatch hook to top to follow Rules of Hooks
  const watchQuantity = Form.useWatch('quantityToServe', form) || 1;

  // Fetch detailed product info when modal opens
  useEffect(() => {
    if (open && product?._id) {
      fetchProductDetails();
    }
  }, [open, product?._id]);

  const fetchProductDetails = async () => {
    try {
      setLoadingDetails(true);
      const details = await getCompositeProductDetails(product._id, storeCode);
      console.log('🔍 Fetched product details:', details);
      console.log('🔍 Child products:', details?.compositeInfo?.childProducts);
      setDetailedProduct(details);
    } catch (error) {
      console.error('Error fetching product details:', error);
      messageApi.error(t('MSG_ERROR_FETCH_PRODUCT_DETAILS'));
    } finally {
      setLoadingDetails(false);
    }
  };
  
  // Get expiry status from detailed product or fallback to prop
  const getExpiryStatus = () => {
    const productToUse = detailedProduct || product;
    if (productToUse?.statusInfo) {
      return productToUse.statusInfo;
    }
    
    // Fallback calculation if no statusInfo
    if (!productToUse?.compositeInfo?.lastPreparedAt) return null;
    
    const hoursElapsed = (new Date() - new Date(productToUse.compositeInfo.lastPreparedAt)) / (1000 * 60 * 60);
    const expiryHours = productToUse.compositeInfo.expiryHours || 24;
    const remainingHours = expiryHours - hoursElapsed;
    
    let status = 'fresh';
    if (hoursElapsed >= expiryHours) {
      status = 'expired';
    } else if (hoursElapsed >= expiryHours * 0.8) {
      status = 'expiring_soon';
    }
    
    return {
      status,
      hoursElapsed,
      remainingHours: Math.max(0, remainingHours),
      percentage: Math.min(100, (hoursElapsed / expiryHours) * 100)
    };
  };

  // Calculate pricing from detailed product child products (đồng bộ với PrepareCompositeModal)
  const calculatePricing = () => {
    console.log('🔍 calculatePricing called');
    const productToUse = detailedProduct || product;
    console.log('🔍 productToUse:', productToUse);
    console.log('🔍 watchQuantity:', watchQuantity);

    if (!productToUse?.compositeInfo?.childProducts || productToUse.compositeInfo.childProducts.length === 0) {
      // Fallback: dùng giá vốn và giá bán lẻ của sản phẩm
      const recipeCostPerServing = productToUse?.compositeInfo?.recipeCost || parseDecimal(productToUse?.costPrice) || 0;
      const sellingPricePerServing = productToUse?.price || productToUse?.retailPrice || 0;
      const capacityQuantity = productToUse?.compositeInfo?.capacity?.quantity || 1;
      const totalServings = capacityQuantity * watchQuantity;
      return {
        totalCost: recipeCostPerServing * watchQuantity,
        totalRevenue: sellingPricePerServing * watchQuantity,
        profit: (sellingPricePerServing - recipeCostPerServing) * watchQuantity,
        revenuePerServing: sellingPricePerServing,
        costPerServing: recipeCostPerServing
      };
    }

    let costPerServing = 0;
    let sellingRevenuePerServing = 0;
    // let retailRevenuePerServing = 0; // Không dùng ở đây

    productToUse.compositeInfo.childProducts.forEach(child => {
      const quantityPerServing = parseFloat(child.quantityPerServing) || 1;
      // Lấy giá từ chính object child, không lấy từ productId
      const childCostPrice = parseDecimal(child.costPrice) || 0;
      const childSellingPrice = parseDecimal(child.sellingPrice) || 0;
      // const childRetailPrice = parseDecimal(child.retailPrice) || 0;

      costPerServing += childCostPrice * quantityPerServing;
      sellingRevenuePerServing += childSellingPrice * quantityPerServing;
    });

    const capacityQuantity = productToUse?.compositeInfo?.capacity?.quantity || 1;
    const totalServings = capacityQuantity * watchQuantity;
    const totalCost = costPerServing * watchQuantity;
    const totalRevenue = sellingRevenuePerServing * watchQuantity;
    const profit = totalRevenue - totalCost;

    return {
      totalRevenue,
      totalCost,
      profit,
      revenuePerServing: sellingRevenuePerServing,
      costPerServing: costPerServing
    };
  };
  
  // Calculate values
  const expiryStatus = product ? getExpiryStatus() : null;
  const { totalRevenue, totalCost, profit, revenuePerServing, costPerServing } = calculatePricing();
  const remainingAfterServe = product ? (product.compositeInfo.currentStock - watchQuantity) : 0;

  // Format hours elapsed
  const formatHoursElapsed = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} ${t('TXT_MINUTES')}`;
    }
    return `${Math.round(hours)} ${t('TXT_HOURS')}`;
  };

  // Form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setServingProduct(product._id, true);

      // Validate expiry
      if (expiryStatus && expiryStatus.status === 'expired') {
        messageApi.error(t('MSG_ERROR_PRODUCT_EXPIRED'));
        return;
      }

      // Validate stock
      if (values.quantityToServe > product.compositeInfo.currentStock) {
        messageApi.error(t('MSG_ERROR_INSUFFICIENT_STOCK'));
        return;
      }

      await serveCompositeProduct(product._id, values.quantityToServe);
      
      messageApi.success(t('MSG_SUCCESS_SERVE_COMPOSITE_PRODUCT'));
      
      // Update product in store
      updateCompositeProduct(product._id, {
        'compositeInfo.currentStock': product.compositeInfo.currentStock - values.quantityToServe
      });
      
      form.resetFields();
      onOk();
    } catch (error) {
      console.error('Error serving composite product:', error);
      if (error.response?.data?.error === 'composite_product_expired') {
        messageApi.error(t('MSG_ERROR_PRODUCT_EXPIRED'));
      } else if (error.response?.data?.error === 'insufficient_stock') {
        messageApi.error(t('MSG_ERROR_INSUFFICIENT_STOCK'));
      } else {
        messageApi.error(t('MSG_ERROR_SERVE_COMPOSITE_PRODUCT'));
      }
    } finally {
      setLoading(false);
      setServingProduct(product._id, false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDetailedProduct(null);
    onCancel();
  };

  if (!product) return null;

  // Check if product is expired or expiring soon
  const showExpiryWarning = expiryStatus && 
    (expiryStatus.status === 'expired' || expiryStatus.status === 'expiring_soon');

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <ShoppingOutlined className="text-green-500" />
          <span>{t('TITLE_SERVE_COMPOSITE_PRODUCT')}</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
    >
      {contextHolder}
      
      <Card className="mb-4" size="small">
        <Title level={5} className="mb-2">{product.name}</Title>
        <Row gutter={16}>
          <Col span={8}>
            <Text className="text-gray-500">{t('TXT_AVAILABLE_STOCK')}: </Text>
            <Text strong className="text-green-600">
              {product.compositeInfo.currentStock} {product.compositeInfo.capacity.unit}
            </Text>
          </Col>
          <Col span={8}>
            <Text className="text-gray-500">{t('TXT_RETAIL_PRICE')}: </Text>
            <Text strong>
              {loadingDetails ? (
                <Spin size="small" />
              ) : (
                formatPrice(revenuePerServing || 0)
              )}
            </Text>
          </Col>
          <Col span={8}>
            <Text className="text-gray-500">{t('TXT_COST_PRICE')}: </Text>
            <Text strong>
              {loadingDetails ? (
                <Spin size="small" />
              ) : (
                formatPrice(costPerServing || 0)
              )}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Expiry Status Warning */}
      {showExpiryWarning && (
        <Alert
          type={expiryStatus.status === 'expired' ? 'error' : 'warning'}
          icon={<ClockCircleOutlined />}
          message={
            expiryStatus.status === 'expired' 
              ? t('MSG_PRODUCT_EXPIRED')
              : t('MSG_PRODUCT_EXPIRING_SOON')
          }
          description={
            <div>
              <Progress 
                percent={expiryStatus.percentage} 
                status={expiryStatus.status === 'expired' ? 'exception' : 'active'}
                size="small"
              />
              <Text className="text-xs">
                {expiryStatus.status === 'expired' 
                  ? t('MSG_EXPIRED_AGO', { time: formatHoursElapsed(expiryStatus.hoursElapsed - product.compositeInfo.expiryHours) })
                  : t('MSG_EXPIRES_IN', { time: formatHoursElapsed(expiryStatus.remainingHours) })
                }
              </Text>
            </div>
          }
          className="mb-4"
        />
      )}

      {product.compositeInfo.currentStock === 0 && (
        <Alert
          type="warning"
          icon={<ExclamationCircleOutlined />}
          message={t('MSG_NO_STOCK_AVAILABLE')}
          description={t('MSG_NEED_TO_PREPARE_FIRST')}
          className="mb-4"
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ quantityToServe: 1 }}
      >
        <Form.Item
          name="quantityToServe"
          label={t('TXT_QUANTITY_TO_SERVE')}
          rules={[
            { required: true, message: t('MSG_QUANTITY_REQUIRED') },
            { 
              type: 'number', 
              min: 1, 
              max: product.compositeInfo.currentStock,
              message: t('MSG_QUANTITY_EXCEED_STOCK') 
            }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={product.compositeInfo.currentStock}
            placeholder={t('TXT_ENTER_QUANTITY')}
            addonAfter={product.compositeInfo.capacity.unit}
            disabled={product.compositeInfo.currentStock === 0 || 
                     (expiryStatus && expiryStatus.status === 'expired')}
          />
        </Form.Item>

        <Divider>{t('TXT_TRANSACTION_SUMMARY')}</Divider>

        {loadingDetails ? (
          <div className="text-center py-8">
            <Text type="secondary">{t('TXT_LOADING_PRODUCT_DETAILS', 'Đang tải thông tin sản phẩm...')}</Text>
          </div>
        ) : (
          <Row gutter={16} className="mb-4">
            <Col span={8}>
              <Card size="small" className="text-center">
                <Title level={4} className="text-blue-600 mb-1">
                  {watchQuantity}
                </Title>
                <Text className="text-gray-500">
                  {t('TXT_QUANTITY')}
                </Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="text-center">
                <Title level={4} className="text-green-600 mb-1">
                  {formatPrice(totalRevenue)}
                </Title>
                <Text className="text-gray-500">
                  {t('TXT_REVENUE')}
                </Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="text-center">
                <Title level={4} className="text-red-600 mb-1">
                  {formatPrice(totalCost)}
                </Title>
                <Text className="text-gray-500">
                  {t('TXT_COST')}
                </Text>
              </Card>
            </Col>
          </Row>
        )}

        <Card size="small" className="mb-4">
          <Row justify="space-between">
            <Col>
              <Text className="text-gray-500">{t('TXT_REMAINING_AFTER_SERVE')}: </Text>
            </Col>
            <Col>
              <Tag color={remainingAfterServe > 0 ? 'green' : 'red'}>
                {remainingAfterServe} {product.compositeInfo.capacity.unit}
              </Tag>
            </Col>
          </Row>
        </Card>

        <div className="flex justify-end space-x-2 mt-6">
          <Button onClick={handleCancel}>
            {t('TXT_CANCEL')}
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<ShoppingOutlined />}
            disabled={
              product.compositeInfo.currentStock === 0 || 
              (expiryStatus && expiryStatus.status === 'expired')
            }
          >
            {t('TXT_SERVE_NOW')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ServeCompositeModal;
