import React, { useState } from 'react';
import { Modal, Form, Select, InputNumber, Input, Button, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useInventoryStore from '@/store/inventory';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Stock In Modal Component
 * Allows users to receive inventory into warehouse
 */
const StockInModal = ({ visible, onClose, storeCode, products, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { performStockIn, isStockingIn } = useInventoryStore();
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    try {
      const stockInData = {
        storeCode,
        productId: values.productId,
        quantity: values.quantity,
        unit: values.unit,
        note: values.note || ''
      };
      
      await performStockIn(stockInData);
      
      message.success(t('MSG_STOCK_IN_SUCCESS'));
      form.resetFields();
      onClose();
      
      // Refresh inventory data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      message.error(error.message || t('MSG_STOCK_IN_FAILED'));
    }
  };
  
  /**
   * Handle product selection change
   * Auto-fill unit field when product is selected
   */
  const handleProductChange = (productId) => {
    const selectedProduct = products.find(p => p._id === productId);
    if (selectedProduct) {
      form.setFieldsValue({
        unit: selectedProduct.unit
      });
    }
  };
  
  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    form.resetFields();
    onClose();
  };
  
  return (
    <Modal
      title={
        <Space>
          <PlusOutlined />
          {t('TXT_STOCK_IN')} - {t('TXT_RECEIVE_INVENTORY')}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          quantity: 1
        }}
      >
        <Form.Item
          label={t('TXT_PRODUCT')}
          name="productId"
          rules={[
            { required: true, message: t('MSG_PLEASE_SELECT_PRODUCT') }
          ]}
        >
          <Select
            placeholder={t('TXT_SELECT_A_PRODUCT')}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            onChange={handleProductChange}
          >
            {products.map(product => (
              <Option key={product._id} value={product._id}>
                {product.productCode} - {product.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          label={t('TXT_QUANTITY')}
          name="quantity"
          rules={[
            { required: true, message: t('MSG_PLEASE_ENTER_QUANTITY') },
            { type: 'number', min: 0.01, message: t('MSG_QUANTITY_MUST_BE_GREATER_THAN_ZERO') }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={t('TXT_ENTER_QUANTITY_TO_RECEIVE')}
            min={0.01}
            step={1}
            precision={2}
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
            placeholder={t('TXT_STOCK_IN_NOTE_PLACEHOLDER')}
            maxLength={500}
            showCount
          />
        </Form.Item>
        
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel} disabled={isStockingIn}>
              {t('TXT_CANCEL')}
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isStockingIn}
              icon={<PlusOutlined />}
            >
              {t('TXT_STOCK_IN')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StockInModal;
