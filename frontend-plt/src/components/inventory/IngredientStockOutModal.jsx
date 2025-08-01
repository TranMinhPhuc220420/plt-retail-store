import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, Button, message, Space, Row, Col, Alert } from 'antd';
import { MinusOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useIngredientInventoryStore from '@/store/ingredientInventory';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Ingredient Stock Out Modal Component
 * Allows users to issue ingredients from warehouse
 */
const IngredientStockOutModal = ({ 
  visible, 
  onClose, 
  storeCode, 
  ingredients, 
  warehouses,
  stockBalances,
  selectedRecord,
  onSuccess 
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { performIngredientStockOut, isStockingOut } = useIngredientInventoryStore();
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [availableStock, setAvailableStock] = useState(0);
  const [stockInfo, setStockInfo] = useState(null);
  // Auto-fill form when selectedRecord changes
  useEffect(() => {
    if (visible && selectedRecord) {
      // Find ingredient and warehouse objects
      const ingredientObj = ingredients.find(i => i._id === (selectedRecord.ingredientId?._id || selectedRecord.ingredientId));
      const warehouseObj = warehouses.find(w => w._id === (selectedRecord.warehouseId?._id || selectedRecord.warehouseId));

      setSelectedIngredient(ingredientObj || null);
      setSelectedWarehouse(warehouseObj?._id || null);

      // Update stock info for this ingredient/warehouse
      updateStockInfo(ingredientObj?._id, warehouseObj?._id);

      // Set form fields
      form.setFieldsValue({
        ingredientId: ingredientObj?._id,
        warehouseId: warehouseObj?._id,
        unit: ingredientObj?.unit,
        quantity: 1,
        batchNumber: selectedRecord.batchNumber || undefined,
        reason: 'general_use',
        recipeId: undefined,
        orderId: undefined,
        note: ''
      });
    } else if (!visible) {
      form.resetFields();
      setSelectedIngredient(null);
      setSelectedWarehouse(null);
      setAvailableStock(0);
      setStockInfo(null);
    }
  }, [visible, selectedRecord, ingredients, warehouses]);
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    try {
      // Validate sufficient stock
      if (values.quantity > availableStock) {
        message.error(t('MSG_INSUFFICIENT_STOCK') || 'Insufficient stock available');
        return;
      }

      const stockOutData = {
        storeCode,
        ingredientId: values.ingredientId,
        warehouseId: values.warehouseId,
        quantity: values.quantity,
        unit: values.unit,
        note: values.note || '',
        batchNumber: values.batchNumber || undefined,
        reason: values.reason || 'general_use',
        recipeId: values.recipeId || undefined,
        orderId: values.orderId || undefined
      };
      
      await performIngredientStockOut(stockOutData);
      
      message.success(t('MSG_INGREDIENT_STOCK_OUT_SUCCESS') || 'Ingredient stock out successful');
      form.resetFields();
      setSelectedIngredient(null);
      setSelectedWarehouse(null);
      setAvailableStock(0);
      setStockInfo(null);
      onClose();
      
      // Refresh inventory data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      message.error(error.message || t('MSG_INGREDIENT_STOCK_OUT_FAILED') || 'Ingredient stock out failed');
    }
  };
  
  /**
   * Handle ingredient selection change
   */
  const handleIngredientChange = (ingredientId) => {
    const ingredient = ingredients.find(i => i._id === ingredientId);
    if (ingredient) {
      setSelectedIngredient(ingredient);
      form.setFieldsValue({
        unit: ingredient.unit,
        warehouseId: undefined // Reset warehouse selection
      });
      setSelectedWarehouse(null);
      setAvailableStock(0);
      setStockInfo(null);
    }
  };
  
  /**
   * Handle warehouse selection change
   */
  const handleWarehouseChange = (warehouseId) => {
    setSelectedWarehouse(warehouseId);
    updateStockInfo(selectedIngredient?._id, warehouseId);
  };

  /**
   * Update stock information for selected ingredient and warehouse
   */
  const updateStockInfo = (ingredientId, warehouseId) => {
    if (!ingredientId || !warehouseId || !stockBalances) {
      setAvailableStock(0);
      setStockInfo(null);
      return;
    }

    const balances = stockBalances.filter(
      balance => balance.ingredientId._id === ingredientId && balance.warehouseId._id === warehouseId
    );

    const totalStock = balances.reduce((sum, balance) => sum + balance.quantity, 0);
    setAvailableStock(totalStock);

    // Get stock info with expiration details
    const stockWithExpiration = balances.map(balance => ({
      ...balance,
      isExpiring: balance.expirationDate && moment(balance.expirationDate).diff(moment(), 'days') <= 7,
      isExpired: balance.expirationDate && moment(balance.expirationDate).isBefore(moment()),
      daysToExpiry: balance.expirationDate ? moment(balance.expirationDate).diff(moment(), 'days') : null
    })).sort((a, b) => {
      // Sort by expiration date (expired first, then expiring soon)
      if (a.expirationDate && b.expirationDate) {
        return moment(a.expirationDate).diff(moment(b.expirationDate));
      }
      return 0;
    });

    setStockInfo({
      totalStock,
      balances: stockWithExpiration,
      hasExpiredStock: stockWithExpiration.some(s => s.isExpired),
      hasExpiringStock: stockWithExpiration.some(s => s.isExpiring)
    });
  };
  
  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    form.resetFields();
    setSelectedIngredient(null);
    setSelectedWarehouse(null);
    setAvailableStock(0);
    setStockInfo(null);
    onClose();
  };

  /**
   * Get available warehouses for selected ingredient
   */
  const getAvailableWarehouses = () => {
    if (!selectedIngredient || !stockBalances) return [];
    
    const warehouseIds = [...new Set(
      stockBalances
        .filter(balance => balance.ingredientId._id === selectedIngredient._id && balance.quantity > 0)
        .map(balance => balance.warehouseId._id)
    )];
    
    return warehouses.filter(warehouse => warehouseIds.includes(warehouse._id));
  };

  /**
   * Get stock alert message
   */
  const getStockAlert = () => {
    if (!stockInfo) return null;

    if (stockInfo.hasExpiredStock) {
      return (
        <Alert
          message={t('TXT_EXPIRED_STOCK_WARNING') || 'Warning: Expired Stock Available'}
          description={t('MSG_EXPIRED_STOCK_WARNING') || 'Some stock has expired. Please check expiration dates before use.'}
          type="error"
          icon={<WarningOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }

    if (stockInfo.hasExpiringStock) {
      return (
        <Alert
          message={t('TXT_EXPIRING_STOCK_WARNING') || 'Warning: Stock Expiring Soon'}
          description={t('MSG_EXPIRING_STOCK_WARNING') || 'Some stock is expiring within 7 days. Consider using it first.'}
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }

    return null;
  };
  
  return (
    <Modal
      title={
        <Space>
          <MinusOutlined />
          {t('TXT_INGREDIENT_STOCK_OUT') || 'Ingredient Stock Out'} - {t('TXT_ISSUE_INGREDIENTS') || 'Issue Ingredients'}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          quantity: 1,
          reason: 'general_use'
        }}
      >
        {getStockAlert()}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('TXT_INGREDIENT') || 'Ingredient'}
              name="ingredientId"
              rules={[
                { required: true, message: t('MSG_PLEASE_SELECT_INGREDIENT') || 'Please select an ingredient' }
              ]}
            >
              <Select
                placeholder={t('TXT_SELECT_AN_INGREDIENT') || 'Select an ingredient'}
                showSearch
                optionFilterProp="children"
                onChange={handleIngredientChange}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {ingredients.map(ingredient => (
                  <Option key={ingredient._id} value={ingredient._id}>
                    {ingredient.name} ({ingredient.ingredientCode})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label={t('TXT_WAREHOUSE') || 'Warehouse'}
              name="warehouseId"
              rules={[
                { required: true, message: t('MSG_PLEASE_SELECT_WAREHOUSE') || 'Please select a warehouse' }
              ]}
            >
              <Select
                placeholder={t('TXT_SELECT_WAREHOUSE') || 'Select warehouse'}
                disabled={!selectedIngredient}
                onChange={handleWarehouseChange}
              >
                {getAvailableWarehouses().map(warehouse => (
                  <Option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {availableStock > 0 && (
          <Alert
            message={`${t('TXT_AVAILABLE_STOCK') || 'Available Stock'}: ${availableStock} ${selectedIngredient?.unit || ''}`}
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('TXT_QUANTITY') || 'Quantity'}
              name="quantity"
              rules={[
                { required: true, message: t('MSG_PLEASE_ENTER_QUANTITY') || 'Please enter quantity' },
                { type: 'number', min: 0.01, message: t('MSG_QUANTITY_MUST_BE_POSITIVE') || 'Quantity must be positive' },
                {
                  validator: (_, value) => {
                    if (value && value > availableStock) {
                      return Promise.reject(new Error(t('MSG_QUANTITY_EXCEEDS_STOCK') || 'Quantity exceeds available stock'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                min={0.01}
                max={availableStock}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder={t('TXT_ENTER_QUANTITY') || 'Enter quantity'}
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              label={t('TXT_UNIT') || 'Unit'}
              name="unit"
              rules={[
                { required: true, message: t('MSG_PLEASE_SELECT_UNIT') || 'Please select unit' }
              ]}
            >
              <Input
                disabled
                placeholder={t('TXT_UNIT_AUTO_FILLED') || 'Unit (auto-filled)'}
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              label={t('TXT_REASON') || 'Reason'}
              name="reason"
            >
              <Select>
                <Option value="general_use">{t('TXT_GENERAL_USE') || 'General Use'}</Option>
                <Option value="production">{t('TXT_PRODUCTION') || 'Production'}</Option>
                <Option value="recipe">{t('TXT_RECIPE') || 'Recipe'}</Option>
                <Option value="order_fulfillment">{t('TXT_ORDER_FULFILLMENT') || 'Order Fulfillment'}</Option>
                <Option value="waste">{t('TXT_WASTE') || 'Waste'}</Option>
                <Option value="transfer">{t('TXT_TRANSFER') || 'Transfer'}</Option>
                <Option value="sample">{t('TXT_SAMPLE') || 'Sample'}</Option>
                <Option value="other">{t('TXT_OTHER') || 'Other'}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('TXT_BATCH_NUMBER') || 'Batch Number'}
              name="batchNumber"
            >
              <Select
                placeholder={t('TXT_SELECT_BATCH') || 'Select batch (optional)'}
                allowClear
              >
                {stockInfo?.balances?.map((balance, index) => 
                  balance.batchNumber && (
                    <Option key={`${balance._id}-${index}`} value={balance.batchNumber}>
                      {balance.batchNumber} 
                      {balance.expirationDate && ` (Exp: ${moment(balance.expirationDate).format('DD/MM/YYYY')})`}
                      {balance.isExpired && ` - EXPIRED`}
                      {balance.isExpiring && !balance.isExpired && ` - EXPIRING SOON`}
                    </Option>
                  )
                )}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label={t('TXT_RECIPE_ID') || 'Recipe ID'}
              name="recipeId"
            >
              <Input placeholder={t('TXT_ENTER_RECIPE_ID') || 'Enter recipe ID (optional)'} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('TXT_NOTE') || 'Note'}
          name="note"
        >
          <TextArea
            rows={3}
            placeholder={t('TXT_ENTER_NOTE_OPTIONAL') || 'Enter note (optional)'}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel}>
              {t('TXT_CANCEL') || 'Cancel'}
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isStockingOut}
              icon={<MinusOutlined />}
              danger
            >
              {t('TXT_STOCK_OUT') || 'Stock Out'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default IngredientStockOutModal;
