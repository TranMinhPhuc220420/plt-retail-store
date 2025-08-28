import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, Button, message, Space, Row, Col, Alert, Statistic } from 'antd';
import { AuditOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useIngredientInventoryStore from '@/store/ingredientInventory';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Ingredient Stock Take Modal Component
 * Allows users to perform physical count and adjust ingredient stock
 */
const IngredientStockTakeModal = ({ 
  visible, 
  onClose, 
  storeCode, 
  ingredients, 
  warehouses,
  stockBalances,
  selectedRecord,
  onSuccess 
}) => {
  // Auto-select ingredient/warehouse/batch if selectedRecord is provided
  useEffect(() => {
    if (selectedRecord && visible) {
      // Find ingredient and warehouse
      const ingredient = ingredients.find(i => i._id === selectedRecord.ingredientId?._id || i._id === selectedRecord.ingredientId);
      const warehouse = warehouses.find(w => w._id === selectedRecord.warehouseId?._id || w._id === selectedRecord.warehouseId);
      setSelectedIngredient(ingredient || null);
      setSelectedWarehouse(warehouse?._id || null);
      // Update stock info for this ingredient/warehouse
      updateStockInfo(ingredient?._id, warehouse?._id);
      // Set batch if available
      form.setFieldsValue({
        ingredientId: ingredient?._id,
        warehouseId: warehouse?._id,
        unit: ingredient?.unit,
        batchNumber: selectedRecord.batchNumber || undefined,
        physicalCount: 0,
        note: ''
      });
    } else if (!visible) {
      form.resetFields();
      setSelectedIngredient(null);
      setSelectedWarehouse(null);
      setSystemStock(0);
      setPhysicalCount(0);
      setVariance(0);
      setStockInfo(null);
    }
  }, [selectedRecord, visible, ingredients, warehouses]);
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { performIngredientStockTake, isPerformingStockTake } = useIngredientInventoryStore();
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [systemStock, setSystemStock] = useState(0);
  const [physicalCount, setPhysicalCount] = useState(0);
  const [variance, setVariance] = useState(0);
  const [stockInfo, setStockInfo] = useState(null);
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    try {
      const stockTakeData = {
        storeCode,
        ingredientId: values.ingredientId,
        warehouseId: values.warehouseId,
        physicalCount: values.physicalCount,
        unit: values.unit,
        note: values.note || '',
        batchNumber: values.batchNumber || undefined
      };
      
      await performIngredientStockTake(stockTakeData);
      
      message.success(t('MSG_INGREDIENT_STOCK_TAKE_SUCCESS') || 'Ingredient stock take completed successfully');
      form.resetFields();
      setSelectedIngredient(null);
      setSelectedWarehouse(null);
      setSystemStock(0);
      setPhysicalCount(0);
      setVariance(0);
      setStockInfo(null);
      onClose();
      
      // Refresh inventory data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      message.error(error.message || t('MSG_INGREDIENT_STOCK_TAKE_FAILED') || 'Ingredient stock take failed');
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
        warehouseId: undefined, // Reset warehouse selection
        physicalCount: 0
      });
      setSelectedWarehouse(null);
      setSystemStock(0);
      setPhysicalCount(0);
      setVariance(0);
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
   * Handle physical count change
   */
  const handlePhysicalCountChange = (value) => {
    setPhysicalCount(value || 0);
    const newVariance = (value || 0) - systemStock;
    setVariance(newVariance);
  };

  /**
   * Update stock information for selected ingredient and warehouse
   */
  const updateStockInfo = (ingredientId, warehouseId) => {
    if (!ingredientId || !warehouseId || !stockBalances) {
      setSystemStock(0);
      setStockInfo(null);
      return;
    }

    const balances = stockBalances.filter(
      balance => balance.ingredientId._id === ingredientId && balance.warehouseId._id === warehouseId
    );

    const totalStock = balances.reduce((sum, balance) => sum + balance.quantity, 0);
    setSystemStock(totalStock);

    // Reset physical count and variance
    setPhysicalCount(0);
    setVariance(-totalStock);
    form.setFieldsValue({ physicalCount: 0 });

    setStockInfo({
      totalStock,
      balances: balances.sort((a, b) => {
        // Sort by batch number or creation date
        if (a.batchNumber && b.batchNumber) {
          return a.batchNumber.localeCompare(b.batchNumber);
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
      }),
      hasBatches: balances.some(b => b.batchNumber)
    });
  };
  
  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    form.resetFields();
    setSelectedIngredient(null);
    setSelectedWarehouse(null);
    setSystemStock(0);
    setPhysicalCount(0);
    setVariance(0);
    setStockInfo(null);
    onClose();
  };

  /**
   * Get available warehouses for selected ingredient
   */
  const getAvailableWarehouses = () => {
    if (!selectedIngredient || !stockBalances) return warehouses;
    
    const warehouseIds = [...new Set(
      stockBalances
        .filter(balance => balance.ingredientId._id === selectedIngredient._id)
        .map(balance => balance.warehouseId._id)
    )];
    
    return warehouses.filter(warehouse => warehouseIds.includes(warehouse._id));
  };

  /**
   * Get variance alert
   */
  const getVarianceAlert = () => {
    if (variance === 0) return null;

    const isLoss = variance < 0;
    const absVariance = Math.abs(variance);
    const percentageVariance = systemStock > 0 ? ((absVariance / systemStock) * 100).toFixed(2) : 0;

    if (absVariance === 0) return null;

    return (
      <Alert
        message={
          isLoss 
            ? (t('TXT_STOCK_LOSS_DETECTED') || 'Stock Loss Detected')
            : (t('TXT_STOCK_GAIN_DETECTED') || 'Stock Gain Detected')
        }
        description={
          `${isLoss ? 'Shortage' : 'Excess'}: ${absVariance} ${selectedIngredient?.unit || ''} (${percentageVariance}%). 
          ${t('MSG_PLEASE_VERIFY_COUNT') || 'Please verify your physical count.'}`
        }
        type={isLoss ? "error" : "warning"}
        icon={<WarningOutlined />}
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  };

  return (
    <Modal
      title={
        <Space>
          <AuditOutlined />
          {t('TXT_INGREDIENT_STOCK_TAKE') || 'Ingredient Stock Take'} - {t('TXT_PHYSICAL_COUNT') || 'Physical Count'}
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
          physicalCount: 0
        }}
      >
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

        {stockInfo && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic
                title={t('TXT_SYSTEM_STOCK') || 'System Stock'}
                value={systemStock}
                suffix={selectedIngredient?.unit || ''}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={t('TXT_PHYSICAL_COUNT') || 'Physical Count'}
                value={physicalCount}
                suffix={selectedIngredient?.unit || ''}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={t('TXT_VARIANCE') || 'Variance'}
                value={variance}
                suffix={selectedIngredient?.unit || ''}
                valueStyle={{ 
                  color: variance === 0 ? '#1890ff' : variance > 0 ? '#faad14' : '#ff4d4f' 
                }}
                prefix={variance > 0 ? '+' : ''}
              />
            </Col>
          </Row>
        )}

        {getVarianceAlert()}

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('TXT_PHYSICAL_COUNT') || 'Physical Count'}
              name="physicalCount"
              rules={[
                { required: true, message: t('MSG_PLEASE_ENTER_PHYSICAL_COUNT') || 'Please enter physical count' },
                { type: 'number', min: 0, message: t('MSG_QUANTITY_CANNOT_BE_NEGATIVE') || 'Quantity cannot be negative' }
              ]}
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder={t('TXT_ENTER_PHYSICAL_COUNT') || 'Enter physical count'}
                onChange={handlePhysicalCountChange}
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
                      {balance.batchNumber} ({balance.quantity} {selectedIngredient?.unit})
                    </Option>
                  )
                )}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Stock breakdown by batches */}
        {stockInfo && stockInfo.hasBatches && (
          <Alert
            message={t('TXT_STOCK_BREAKDOWN') || 'Stock Breakdown by Batches'}
            description={
              <div>
                {stockInfo.balances.map((balance, index) => (
                  <div key={index} style={{ marginBottom: 4 }}>
                    <strong>{balance.batchNumber || t('TXT_NO_BATCH') || 'No Batch'}:</strong> {balance.quantity} {selectedIngredient?.unit}
                    {balance.expirationDate && ` (Exp: ${new Date(balance.expirationDate).toLocaleDateString()})`}
                  </div>
                ))}
              </div>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          label={t('TXT_NOTE') || 'Note'}
          name="note"
          rules={[
            { required: variance !== 0, message: t('MSG_NOTE_REQUIRED_FOR_VARIANCE') || 'Note is required when there is a variance' }
          ]}
        >
          <TextArea
            rows={3}
            placeholder={
              variance !== 0 
                ? (t('TXT_EXPLAIN_VARIANCE') || 'Please explain the reason for the variance')
                : (t('TXT_ENTER_NOTE_OPTIONAL') || 'Enter note (optional)')
            }
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
              loading={isPerformingStockTake}
              icon={<AuditOutlined />}
            >
              {t('TXT_COMPLETE_STOCK_TAKE') || 'Complete Stock Take'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default IngredientStockTakeModal;
