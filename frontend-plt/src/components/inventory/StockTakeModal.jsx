import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, Button, message, Space, Alert, Statistic, Row, Col } from 'antd';
import { AuditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useInventoryStore from '@/store/inventory';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Stock Take Modal Component
 * Allows users to perform physical inventory count and adjustment
 */
const StockTakeModal = ({ visible, onClose, storeCode, products, stockBalances, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { performStockTake, isPerformingStockTake } = useInventoryStore();
  const [selectedProductBalance, setSelectedProductBalance] = useState(null);
  const [systemQuantity, setSystemQuantity] = useState(0);
  const [physicalCount, setPhysicalCount] = useState(0);
  const [difference, setDifference] = useState(0);
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    try {
      const stockTakeData = {
        storeCode,
        productId: values.productId,
        physicalCount: values.physicalCount,
        unit: values.unit,
        note: values.note || ''
      };
      
      const result = await performStockTake(stockTakeData);
      
      if (result.adjustmentMade) {
        message.success(t('MSG_STOCK_TAKE_COMPLETED_WITH_ADJUSTMENT', { difference: result.difference }));
      } else {
        message.success(t('MSG_STOCK_TAKE_COMPLETED_NO_ADJUSTMENT'));
      }
      
      form.resetFields();
      setSelectedProductBalance(null);
      setSystemQuantity(0);
      setPhysicalCount(0);
      setDifference(0);
      onClose();
      
      // Refresh inventory data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      message.error(error.message || t('MSG_STOCK_TAKE_FAILED'));
    }
  };
  
  /**
   * Handle product selection change
   * Auto-fill unit field and show current system quantity
   */
  const handleProductChange = (productId) => {
    const selectedProduct = products.find(p => p._id === productId);
    const productBalance = stockBalances.find(b => b.productId._id === productId);
    
    if (selectedProduct) {
      form.setFieldsValue({
        unit: selectedProduct.unit
      });
    }
    
    if (productBalance) {
      setSelectedProductBalance(productBalance);
      setSystemQuantity(productBalance.quantity);
    } else {
      setSelectedProductBalance(null);
      setSystemQuantity(0);
    }
    
    // Reset physical count and difference when product changes
    setPhysicalCount(0);
    setDifference(0);
    form.setFieldsValue({ physicalCount: null });
  };
  
  /**
   * Handle physical count change
   * Calculate difference between physical count and system quantity
   */
  const handlePhysicalCountChange = (value) => {
    if (value !== null && value !== undefined) {
      setPhysicalCount(value);
      setDifference(value - systemQuantity);
    } else {
      setPhysicalCount(0);
      setDifference(0);
    }
  };
  
  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    form.resetFields();
    setSelectedProductBalance(null);
    setSystemQuantity(0);
    setPhysicalCount(0);
    setDifference(0);
    onClose();
  };
  
  /**
   * Get difference status color
   */
  const getDifferenceColor = () => {
    if (difference > 0) return '#52c41a'; // Green for positive
    if (difference < 0) return '#ff4d4f'; // Red for negative
    return '#1890ff'; // Blue for zero
  };
  
  /**
   * Get difference description
   */
  const getDifferenceDescription = () => {
    if (difference > 0) return t('MSG_OVERAGE_SYSTEM_INCREASED');
    if (difference < 0) return t('MSG_SHORTAGE_SYSTEM_DECREASED');
    return t('MSG_NO_DIFFERENCE_MATCHES');
  };
  
  return (
    <Modal
      title={
        <Space>
          <AuditOutlined />
          {t('TXT_STOCK_TAKE')} - {t('TXT_PHYSICAL_INVENTORY_COUNT')}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Alert
        message={t('TXT_STOCK_TAKE_INSTRUCTIONS')}
        description={t('MSG_STOCK_TAKE_INSTRUCTIONS_DESCRIPTION')}
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label={t('TXT_PRODUCT')}
          name="productId"
          rules={[
            { required: true, message: t('MSG_PLEASE_SELECT_PRODUCT') }
          ]}
        >
          <Select
            placeholder={t('TXT_SELECT_PRODUCT_FOR_STOCK_TAKE')}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            onChange={handleProductChange}
          >
            {products.map(product => {
              const balance = stockBalances.find(b => b.productId._id === product._id);
              const currentStock = balance ? balance.quantity : 0;
              return (
                <Option key={product._id} value={product._id}>
                  {product.productCode} - {product.name} 
                  {` (${t('TXT_SYSTEM')}: ${currentStock} ${product.unit})`}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        
        {/* Show current system information */}
        {selectedProductBalance && (
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={t('TXT_SYSTEM_QUANTITY')}
                  value={systemQuantity}
                  suffix={selectedProductBalance.unit}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={t('TXT_PHYSICAL_COUNT')}
                  value={physicalCount}
                  suffix={selectedProductBalance.unit}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={t('TXT_DIFFERENCE')}
                  value={difference}
                  suffix={selectedProductBalance.unit}
                  valueStyle={{ color: getDifferenceColor() }}
                  prefix={difference > 0 ? '+' : ''}
                />
              </Col>
            </Row>
            
            {difference !== 0 && (
              <Alert
                message={getDifferenceDescription()}
                type={difference > 0 ? 'success' : 'warning'}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
        )}
        
        <Form.Item
          label={t('TXT_PHYSICAL_COUNT')}
          name="physicalCount"
          rules={[
            { required: true, message: t('MSG_PLEASE_ENTER_PHYSICAL_COUNT') },
            { type: 'number', min: 0, message: t('MSG_PHYSICAL_COUNT_CANNOT_BE_NEGATIVE') }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={t('TXT_ENTER_ACTUAL_QUANTITY_COUNTED')}
            min={0}
            step={1}
            precision={2}
            onChange={handlePhysicalCountChange}
          />
        </Form.Item>
        
        <Form.Item
          label={t('TXT_UNIT')}
          name="unit"
          rules={[
            { required: true, message: t('MSG_PLEASE_ENTER_UNIT') }
          ]}
        >
          <Input placeholder={t('TXT_UNIT_PLACEHOLDER')} />
        </Form.Item>
        
        <Form.Item
          label={t('TXT_NOTE')}
          name="note"
        >
          <TextArea
            rows={3}
            placeholder={t('TXT_STOCK_TAKE_NOTE_PLACEHOLDER')}
            maxLength={500}
            showCount
          />
        </Form.Item>
        
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel} disabled={isPerformingStockTake}>
              {t('TXT_CANCEL')}
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isPerformingStockTake}
              icon={<AuditOutlined />}
            >
              {t('TXT_COMPLETE_STOCK_TAKE')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StockTakeModal;
