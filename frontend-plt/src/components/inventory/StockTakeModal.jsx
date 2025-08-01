import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, Button, message, Space, Row, Col, Alert, Statistic } from 'antd';
import { AuditOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useInventoryStore from '@/store/inventory';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Product Stock Take Modal Component
 * Allows users to perform physical count and adjust product stock
 */
const StockTakeModal = ({ visible, onClose, storeCode, products, warehouses, stockBalances, selectedRecord, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { performStockTake, isPerformingStockTake } = useInventoryStore();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [systemStock, setSystemStock] = useState(0);
  const [countedQuantity, setCountedQuantity] = useState(0);
  const [variance, setVariance] = useState(0);
  const [stockInfo, setStockInfo] = useState(null);
  // Auto-select product/warehouse/batch if selectedRecord is provided
  useEffect(() => {
    if (selectedRecord && visible) {
      // Find product and warehouse
      const product = products.find(p => p._id === selectedRecord.productId?._id || p._id === selectedRecord.productId);
      const warehouse = warehouses.find(w => w._id === selectedRecord.warehouseId?._id || w._id === selectedRecord.warehouseId);
      setSelectedProduct(product || null);
      setSelectedWarehouse(warehouse?._id || null);

      // Update stock info for this product/warehouse
      updateStockInfo(product?._id, warehouse?._id);

      // Set batch if available
      form.setFieldsValue({
        productId: product?._id,
        warehouseId: warehouse?._id,
        unit: product?.unit,
        batchNumber: selectedRecord.batchNumber || undefined,
        countedQuantity: selectedRecord.countedQuantity || 0,
        note: selectedRecord.note || ''
      });

      // Set countedQuantity and variance state
      setCountedQuantity(selectedRecord.countedQuantity || 0);
      // Calculate variance based on selectedRecord.countedQuantity and systemStock
      // But systemStock is set async, so use a timeout to sync after updateStockInfo
      setTimeout(() => {
        setVariance((selectedRecord.countedQuantity || 0) - (systemStock || 0));
      }, 100);
    } else if (!visible) {
      form.resetFields();
      setSelectedProduct(null);
      setSelectedWarehouse(null);
      setSystemStock(0);
      setCountedQuantity(0);
      setVariance(0);
      setStockInfo(null);
    }
  }, [visible, selectedRecord, products, warehouses]);
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    try {
      const stockTakeData = {
        storeCode,
        productId: values.productId,
        warehouseId: values.warehouseId,
        countedQuantity: values.countedQuantity,
        unit: values.unit,
        note: values.note || '',
        batchNumber: values.batchNumber || undefined
      };

      await performStockTake(stockTakeData);
      
      message.success(t('MSG_PRODUCT_STOCK_TAKE_SUCCESS') || 'Product stock take completed successfully');
      form.resetFields();
      setSelectedProduct(null);
      setSelectedWarehouse(null);
      setSystemStock(0);
      setCountedQuantity(0);
      setVariance(0);
      setStockInfo(null);
      onClose();
      
      // Refresh inventory data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      message.error(error.message || t('MSG_PRODUCT_STOCK_TAKE_FAILED') || 'Product stock take failed');
    }
  };
  
  /**
   * Handle product selection change
   */
  const handleProductChange = (productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setSelectedProduct(product);
      form.setFieldsValue({
        unit: product.unit,
        warehouseId: undefined, // Reset warehouse selection
        countedQuantity: 0
      });
      setSelectedWarehouse(null);
      setSystemStock(0);
      setCountedQuantity(0);
      setVariance(0);
      setStockInfo(null);
    } else {
      setSelectedProduct(null);
      setSelectedWarehouse(null);
      setSystemStock(0);
      setCountedQuantity(0);
      setVariance(0);
      setStockInfo(null);
    }
  };
  
  /**
   * Handle warehouse selection change
   */
  const handleWarehouseChange = (warehouseId) => {
    setSelectedWarehouse(warehouseId);
    updateStockInfo(selectedProduct?._id, warehouseId);
  };

  /**
   * Handle counted quantity change
   */
  const handleCountedQuantityChange = (value) => {
    setCountedQuantity(value || 0);
    const newVariance = (value || 0) - systemStock;
    setVariance(newVariance);
  };

  /**
   * Update stock information for selected product and warehouse
   */
  const updateStockInfo = (productId, warehouseId) => {
    if (!productId || !warehouseId || !stockBalances) {
      setSystemStock(0);
      setStockInfo(null);
      return;
    }

    const balances = stockBalances.filter(
      balance => balance.productId._id === productId && balance.warehouseId._id === warehouseId
    );

    const totalStock = balances.reduce((sum, balance) => sum + balance.quantity, 0);
    setSystemStock(totalStock);

    const hasBatches = balances.some(balance => balance.batchNumber);

    setStockInfo({
      balances,
      hasBatches,
      totalStock
    });
  };

  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    form.resetFields();
    setSelectedProduct(null);
    setSelectedWarehouse(null);
    setSystemStock(0);
    setCountedQuantity(0);
    setVariance(0);
    setStockInfo(null);
    onClose();
  };

  /**
   * Get available warehouses for selected product
   */
  const getAvailableWarehouses = () => {
    if (!selectedProduct || !stockBalances) return warehouses;
    const warehouseIds = [...new Set(
      stockBalances
        .filter(balance => balance.productId && balance.productId._id === selectedProduct._id)
        .map(balance => balance.warehouseId?._id)
    )];
    return warehouses;
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
          `${isLoss ? 'Shortage' : 'Excess'}: ${absVariance} ${selectedProduct?.unit || ''} (${percentageVariance}%). 
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
          {t('TXT_PRODUCT_STOCK_TAKE') || 'Product Stock Take'} - {t('TXT_PHYSICAL_COUNT') || 'Physical Count'}
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
          countedQuantity: 0
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('TXT_PRODUCT') || 'Product'}
              name="productId"
              rules={[
                { required: true, message: t('MSG_PLEASE_SELECT_PRODUCT') || 'Please select a product' }
              ]}
            >
              <Select
                placeholder={t('TXT_SELECT_A_PRODUCT') || 'Select a product'}
                showSearch
                optionFilterProp="children"
                onChange={handleProductChange}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {products.map(product => (
                  <Option key={product._id} value={product._id}>
                    {product.name} ({product.productCode})
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
                disabled={!selectedProduct}
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
                suffix={selectedProduct?.unit || ''}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={t('TXT_COUNTED_STOCK') || 'Counted Stock'}
                value={countedQuantity}
                suffix={selectedProduct?.unit || ''}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={t('TXT_VARIANCE') || 'Variance'}
                value={variance}
                suffix={selectedProduct?.unit || ''}
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
              label={t('TXT_COUNTED_QUANTITY') || 'Counted Quantity'}
              name="countedQuantity"
              rules={[
                { required: true, message: t('MSG_PLEASE_ENTER_COUNTED_QUANTITY') || 'Please enter counted quantity' },
                { type: 'number', min: 0, message: t('MSG_QUANTITY_CANNOT_BE_NEGATIVE') || 'Quantity cannot be negative' }
              ]}
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder={t('TXT_ENTER_COUNTED_QUANTITY') || 'Enter counted quantity'}
                onChange={handleCountedQuantityChange}
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
                      {balance.batchNumber} ({balance.quantity} {selectedProduct?.unit})
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
                    <strong>{balance.batchNumber || t('TXT_NO_BATCH') || 'No Batch'}:</strong> {balance.quantity} {selectedProduct?.unit}
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

export default StockTakeModal;
