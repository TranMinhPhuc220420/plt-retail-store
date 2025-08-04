import React, { useState } from "react";
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
  Tag
} from "antd";
import { ShoppingOutlined, ExclamationCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";

// Requests
import { serveCompositeProduct } from "@/request/compositeProduct";
import useCompositeProductStore from "@/store/compositeProduct";
import { parseDecimal, formatPrice } from "@/utils/numberUtils";

const { Title, Text } = Typography;

const ServeCompositeModal = ({ open, product, onOk, onCancel }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const { setServingProduct, updateCompositeProduct } = useCompositeProductStore();
  
  const [loading, setLoading] = useState(false);

  // Format hours elapsed
  const formatHoursElapsed = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} ${t('TXT_MINUTES')}`;
    }
    return `${Math.round(hours)} ${t('TXT_HOURS')}`;
  };

  // Get expiry status
  const getExpiryStatus = () => {
    if (!product?.statusInfo) return null;
    
    const { status, hoursElapsed } = product.statusInfo;
    const expiryHours = product.compositeInfo.expiryHours;
    const remainingHours = expiryHours - hoursElapsed;
    
    return {
      status,
      hoursElapsed,
      remainingHours: Math.max(0, remainingHours),
      percentage: Math.min(100, (hoursElapsed / expiryHours) * 100)
    };
  };

  // Form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setServingProduct(product._id, true);

      // Validate expiry
      const expiryStatus = getExpiryStatus();
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
    onCancel();
  };

  if (!product) return null;

  const expiryStatus = getExpiryStatus();
  const watchQuantity = Form.useWatch('quantityToServe', form) || 1;
  const totalRevenue = (product.retailPrice || 0) * watchQuantity;
  const totalCost = parseDecimal(product.costPrice) * watchQuantity;
  const profit = totalRevenue - totalCost;
  const remainingAfterServe = product.compositeInfo.currentStock - watchQuantity;

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
            <Text strong>{formatPrice(parseDecimal(product.retailPrice))}</Text>
          </Col>
          <Col span={8}>
            <Text className="text-gray-500">{t('TXT_COST_PRICE')}: </Text>
            <Text strong>{formatPrice(parseDecimal(product.costPrice))}</Text>
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

        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Card size="small" className="text-center">
              <Title level={5} className="text-blue-600 mb-1">
                {watchQuantity}
              </Title>
              <Text className="text-gray-500 text-xs">
                {t('TXT_QUANTITY')}
              </Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="text-center">
              <Title level={5} className="text-green-600 mb-1">
                {formatPrice(totalRevenue)}
              </Title>
              <Text className="text-gray-500 text-xs">
                {t('TXT_REVENUE')}
              </Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="text-center">
              <Title level={5} className="text-red-600 mb-1">
                {formatPrice(totalCost)}
              </Title>
              <Text className="text-gray-500 text-xs">
                {t('TXT_COST')}
              </Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="text-center">
              <Title level={5} className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                {formatPrice(profit)}
              </Title>
              <Text className="text-gray-500 text-xs">
                {t('TXT_PROFIT')}
              </Text>
            </Card>
          </Col>
        </Row>

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
