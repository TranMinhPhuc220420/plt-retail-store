import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, Button, message, Space, Alert } from 'antd';
import { MinusOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useInventoryStore from '@/store/inventory';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Stock Out Modal Component
 * Allows users to issue inventory from warehouse
 */
const StockOutModal = ({ visible, onClose, storeCode, products, stockBalances, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { performStockOut, isStockingOut } = useInventoryStore();
  const [selectedProductBalance, setSelectedProductBalance] = useState(null);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    try {
      const stockOutData = {
        storeCode,
        productId: values.productId,
        quantity: values.quantity,
        unit: values.unit,
        note: values.note || ''
      };
      
      await performStockOut(stockOutData);
      
      message.success(t('MSG_STOCK_OUT_SUCCESS'));
      form.resetFields();
      setSelectedProductBalance(null);
      setAvailableQuantity(0);
      onClose();
      
      // Refresh inventory data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      message.error(error.message || t('MSG_STOCK_OUT_FAILED'));
    }
  };
  
  /**
   * Handle product selection change
   * Auto-fill unit field and show available quantity
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
      setAvailableQuantity(productBalance.quantity);
    } else {
      setSelectedProductBalance(null);
      setAvailableQuantity(0);
    }
    
    // Reset quantity field when product changes
    form.setFieldsValue({ quantity: null });
  };
  
  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    form.resetFields();
    setSelectedProductBalance(null);
    setAvailableQuantity(0);
    onClose();
  };
  
  /**
   * Get products that have stock available
   */
  const getProductsWithStock = () => {
    console.log(products);
    
    return products.filter(product => {
      const balance = stockBalances.find(b => b.productId._id === product._id);
      return balance && balance.quantity > 0;
    });
  };
  
  return (
    <Modal
      title={
        <Space>
          <MinusOutlined />
          {t('TXT_STOCK_OUT')} - {t('TXT_ISSUE_INVENTORY')}
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
      >
        <Form.Item
          label={t('TXT_PRODUCT')}
          name="productId"
          rules={[
            { required: true, message: t('MSG_PLEASE_SELECT_PRODUCT') }
          ]}
        >
          <Select
            placeholder={t('TXT_SELECT_PRODUCT_WITH_AVAILABLE_STOCK')}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            onChange={handleProductChange}
          >
            {getProductsWithStock().map(product => {
              const balance = stockBalances.find(b => b.productId._id === product._id);
              return (
                <Option key={product._id} value={product._id}>
                  {product.productCode} - {product.name} 
                  {balance && ` (${t('TXT_AVAILABLE')}: ${balance.quantity} ${balance.unit})`}
                </Option>
              );
            })}
          </Select>
        </Form.Item>
        
        {/* Show current stock information */}
        {selectedProductBalance && (
          <Alert
            message={`${t('TXT_AVAILABLE_STOCK')}: ${availableQuantity} ${selectedProductBalance.unit}`}
            type={availableQuantity <= selectedProductBalance.productId.minStock ? "warning" : "info"}
            icon={availableQuantity <= selectedProductBalance.productId.minStock ? <WarningOutlined /> : null}
            style={{ marginBottom: 16 }}
            description={
              availableQuantity <= selectedProductBalance.productId.minStock
                ? t('MSG_LOW_STOCK_ALERT_WITH_MIN', { 
                    minStock: selectedProductBalance.productId.minStock, 
                    unit: selectedProductBalance.unit 
                  })
                : null
            }
          />
        )}
        
        <Form.Item
          label={t('TXT_QUANTITY')}
          name="quantity"
          rules={[
            { required: true, message: t('MSG_PLEASE_ENTER_QUANTITY') },
            { type: 'number', min: 0.01, message: t('MSG_QUANTITY_MUST_BE_GREATER_THAN_ZERO') },
            {
              validator: (_, value) => {
                if (value && availableQuantity > 0 && value > availableQuantity) {
                  return Promise.reject(new Error(t('MSG_QUANTITY_CANNOT_EXCEED_AVAILABLE_STOCK', { availableQuantity })));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={t('TXT_ENTER_QUANTITY_TO_ISSUE')}
            min={0.01}
            max={availableQuantity}
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
            placeholder={t('TXT_STOCK_OUT_NOTE_PLACEHOLDER')}
            maxLength={500}
            showCount
          />
        </Form.Item>
        
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel} disabled={isStockingOut}>
              {t('TXT_CANCEL')}
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isStockingOut}
              icon={<MinusOutlined />}
              disabled={availableQuantity <= 0}
            >
              {t('TXT_STOCK_OUT')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StockOutModal;
