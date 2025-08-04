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
  List,
  Tag
} from "antd";
import { FireOutlined, ExperimentOutlined } from "@ant-design/icons";

// Requests
import { prepareCompositeProduct } from "@/request/compositeProduct";
import useCompositeProductStore from "@/store/compositeProduct";
import { parseDecimal, formatPrice } from "@/utils/numberUtils";

const { Title, Text } = Typography;

const PrepareCompositeModal = ({ open, product, onOk, onCancel }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  
  const { setPreparingProduct, updateCompositeProduct } = useCompositeProductStore();
  
  const [loading, setLoading] = useState(false);

  // Calculate requirements
  const calculateRequirements = (quantityToPrepare = 1) => {
    if (!product) return [];
    
    return product.compositeInfo?.childProducts?.map(child => {
      const totalNeeded = child.quantityPerServing * 
                         product.compositeInfo.capacity.quantity * 
                         quantityToPrepare;
      
      return {
        productName: child.productId?.name || 'N/A',
        quantityNeeded: totalNeeded,
        unit: child.unit,
        costPerUnit: parseDecimal(child.productId?.costPrice),
        totalCost: parseDecimal(child.productId?.costPrice) * totalNeeded
      };
    }) || [];
  };

  // Form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setPreparingProduct(product._id, true);

      const result = await prepareCompositeProduct(product._id, values.quantityToPrepare);
      
      messageApi.success(t('MSG_SUCCESS_PREPARE_COMPOSITE_PRODUCT'));
      
      // Update product in store
      updateCompositeProduct(product._id, {
        'compositeInfo.currentStock': product.compositeInfo.currentStock + 
          (product.compositeInfo.capacity.quantity * values.quantityToPrepare),
        'compositeInfo.lastPreparedAt': new Date()
      });
      
      form.resetFields();
      onOk();
    } catch (error) {
      console.error('Error preparing composite product:', error);
      messageApi.error(t('MSG_ERROR_PREPARE_COMPOSITE_PRODUCT'));
    } finally {
      setLoading(false);
      setPreparingProduct(product._id, false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  if (!product) return null;

  const watchQuantity = Form.useWatch('quantityToPrepare', form) || 1;
  const requirements = calculateRequirements(watchQuantity);
  const totalCost = requirements.reduce((sum, req) => sum + req.totalCost, 0);
  const totalServings = product.compositeInfo.capacity.quantity * watchQuantity;

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
            <Text className="text-gray-500">{t('TXT_EXPIRY_TIME')}: </Text>
            <Text strong>{product.compositeInfo.expiryHours}h</Text>
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
              <Title level={4} className="text-green-600 mb-1">
                {formatPrice(totalCost)}
              </Title>
              <Text className="text-gray-500">
                {t('TXT_TOTAL_COST')}
              </Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="text-center">
              <Title level={4} className="text-purple-600 mb-1">
                {formatPrice(totalCost / totalServings)}
              </Title>
              <Text className="text-gray-500">
                {t('TXT_COST_PER_SERVING')}
              </Text>
            </Card>
          </Col>
        </Row>

        <Divider>{t('TXT_REQUIRED_INGREDIENTS')}</Divider>

        <List
          size="small"
          dataSource={requirements}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.productName}
                description={
                  <div className="flex justify-between items-center">
                    <span>
                      <Text strong>{item.quantityNeeded}</Text> {item.unit}
                    </span>
                    <Tag color="blue">{formatPrice(item.totalCost)}</Tag>
                  </div>
                }
              />
            </List.Item>
          )}
        />

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
