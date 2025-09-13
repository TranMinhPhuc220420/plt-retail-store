import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, Button, message, Space, DatePicker, Row, Col, Switch } from 'antd';
import { PlusOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useIngredientInventoryStore from '@/store/ingredientInventory';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Ingredient Stock In Modal Component
 * Allows users to receive ingredients into warehouse
 */
const IngredientStockInModal = ({
  visible,
  onClose,
  storeCode,
  ingredients,
  warehouses,
  suppliers,
  selectedRecord,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { performIngredientStockIn, isStockingIn } = useIngredientInventoryStore();
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [hasExpirationDate, setHasExpirationDate] = useState(false);
  const [hasBatchNumber, setHasBatchNumber] = useState(false);
  const [hasQualityCheck, setHasQualityCheck] = useState(true);

  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    try {
      const stockInData = {
        storeCode,
        ingredientId: values.ingredientId,
        warehouseId: values.warehouseId,
        quantity: values.quantity,
        unit: values.unit,
        note: values.note || '',
        batchNumber: hasBatchNumber ? values.batchNumber : undefined,
        expirationDate: hasExpirationDate && values.expirationDate ? values.expirationDate.toDate() : undefined,
        supplierId: values.supplierId || undefined,
        referenceNumber: values.referenceNumber || undefined,
        costPerUnit: values.costPerUnit || undefined,
        temperatureCondition: values.temperatureCondition || 'room_temp',
        qualityCheck: hasQualityCheck ? {
          passed: values.qualityPassed !== false,
          notes: values.qualityNotes || '',
          checkedBy: values.qualityCheckedBy || undefined
        } : undefined
      };

      await performIngredientStockIn(stockInData);

      message.success(t('MSG_INGREDIENT_STOCK_IN_SUCCESS') || 'Ingredient stock in successful');
      form.resetFields();
      setSelectedIngredient(null);
      setHasExpirationDate(false);
      setHasBatchNumber(false);
      setHasQualityCheck(true);
      onClose();

      // Refresh inventory data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      message.error(error.message || t('MSG_INGREDIENT_STOCK_IN_FAILED') || 'Ingredient stock in failed');
    }
  };

  /**
   * Handle ingredient selection change
   * Auto-fill unit field when ingredient is selected
   */
  const handleIngredientChange = (ingredientId) => {
    const ingredient = ingredients.find(i => i._id === ingredientId);
    if (ingredient) {
      console.log(ingredient);
      
      setSelectedIngredient(ingredient);
      form.setFieldsValue({
        unit: ingredient.unit,
        warehouseId: ingredient.warehouseId._id,
        // standardCost
        costPerUnit: ingredient.standardCost.$numberDecimal || 0,
        temperatureCondition: ingredient.properties?.storageTemp || 'room_temp'
      });

      // Auto-enable expiration date if ingredient has shelf life
      if (ingredient.properties?.shelfLifeDays) {
        setHasExpirationDate(true);
        const expirationDate = moment().add(ingredient.properties.shelfLifeDays, 'days');
        form.setFieldsValue({
          expirationDate: expirationDate
        });
      }
    }
  };

  // Auto-select ingredient when modal opens with selectedRecord
  useEffect(() => {
    if (visible && selectedRecord && selectedRecord.ingredientId) {
      const ingredientId = selectedRecord.ingredientId._id || selectedRecord.ingredientId;
      form.setFieldsValue({ ingredientId });
      handleIngredientChange(ingredientId);
      // Nếu có warehouseId thì set luôn
      if (selectedRecord.warehouseId) {
        form.setFieldsValue({ warehouseId: selectedRecord.warehouseId._id || selectedRecord.warehouseId });
      }
    }
    if (!visible) {
      setSelectedIngredient(null);
    }
  }, [visible, selectedRecord, ingredients]);

  /**
   * Handle warehouse selection change
   */
  const handleWarehouseChange = (warehouseId) => {
    // Could implement warehouse-specific logic here if needed
  };

  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    form.resetFields();
    setSelectedIngredient(null);
    setHasExpirationDate(false);
    setHasBatchNumber(false);
    setHasQualityCheck(true);
    onClose();
  };

  /**
   * Filter warehouses based on selected ingredient
   */
  const getFilteredWarehouses = () => {
    if (!selectedIngredient) return warehouses;
    // Could implement filtering logic based on ingredient storage requirements
    return warehouses;
  };

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined />
          {t('TXT_INGREDIENT_STOCK_IN') || 'Ingredient Stock In'} - {t('TXT_RECEIVE_INGREDIENTS') || 'Receive Ingredients'}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          quantity: 1,
          temperatureCondition: 'room_temp',
          qualityPassed: true
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
                onChange={handleWarehouseChange}
              >
                {getFilteredWarehouses().map(warehouse => (
                  <Option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('TXT_QUANTITY') || 'Quantity'}
              name="quantity"
              rules={[
                { required: true, message: t('MSG_PLEASE_ENTER_QUANTITY') || 'Please enter quantity' },
                { type: 'number', min: 0.01, message: t('MSG_QUANTITY_MUST_BE_POSITIVE') || 'Quantity must be positive' }
              ]}
            >
              <InputNumber
                min={0.01}
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
              label={t('TXT_COST_PER_UNIT') || 'Cost per Unit'}
              name="costPerUnit"
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder={t('TXT_ENTER_COST') || 'Enter cost'}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' VNĐ'}
                parser={(value) => value.replace(/\s?VNĐ|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('TXT_SUPPLIER') || 'Supplier'}
              name="supplierId"
            >
              <Select
                placeholder={t('TXT_SELECT_SUPPLIER') || 'Select supplier'}
                allowClear
              >
                {suppliers?.map(supplier => (
                  <Option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={t('TXT_REFERENCE_NUMBER') || 'Reference Number'}
              name="referenceNumber"
            >
              <Input placeholder={t('TXT_ENTER_REFERENCE') || 'Enter reference number'} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('TXT_TEMPERATURE_CONDITION') || 'Storage Temperature'}
              name="temperatureCondition"
            >
              <Select>
                <Option value="frozen">{t('TXT_FROZEN') || 'Frozen'}</Option>
                <Option value="refrigerated">{t('TXT_REFRIGERATED') || 'Refrigerated'}</Option>
                <Option value="room_temp">{t('TXT_ROOM_TEMPERATURE') || 'Room Temperature'}</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch
                  checked={hasBatchNumber}
                  onChange={setHasBatchNumber}
                  size="small"
                />
                <span>{t('TXT_HAS_BATCH_NUMBER') || 'Has Batch Number'}</span>
              </Space>

              {hasBatchNumber && (
                <Form.Item
                  name="batchNumber"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={t('TXT_ENTER_BATCH_NUMBER') || 'Enter batch number'} />
                </Form.Item>
              )}
            </Space>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch
                  checked={hasExpirationDate}
                  onChange={setHasExpirationDate}
                  size="small"
                />
                <span>{t('TXT_HAS_EXPIRATION_DATE') || 'Has Expiration Date'}</span>
              </Space>

              {hasExpirationDate && (
                <Form.Item
                  name="expirationDate"
                  style={{ marginBottom: 0 }}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder={t('TXT_SELECT_EXPIRATION_DATE') || 'Select expiration date'}
                    disabledDate={(current) => current && current < moment().endOf('day')}
                  />
                </Form.Item>
              )}
            </Space>
          </Col>

          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Switch
                  checked={hasQualityCheck}
                  onChange={setHasQualityCheck}
                  size="small"
                />
                <Space>
                  <ExperimentOutlined />
                  <span>{t('TXT_QUALITY_CHECK') || 'Quality Check'}</span>
                </Space>
              </Space>

              {hasQualityCheck && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item
                    name="qualityPassed"
                    valuePropName="checked"
                    style={{ marginBottom: 8 }}
                  >
                    <Switch
                      checkedChildren={t('TXT_PASSED') || 'Passed'}
                      unCheckedChildren={t('TXT_FAILED') || 'Failed'}
                      defaultChecked
                    />
                  </Form.Item>

                  <Form.Item
                    name="qualityNotes"
                    style={{ marginBottom: 0 }}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder={t('TXT_QUALITY_NOTES') || 'Quality check notes'}
                    />
                  </Form.Item>
                </Space>
              )}
            </Space>
          </Col>
        </Row>

        <Form.Item
          label={t('TXT_NOTE') || 'Note'}
          name="note"
        >
          <TextArea
            rows={2}
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
              loading={isStockingIn}
              icon={<PlusOutlined />}
            >
              {t('TXT_STOCK_IN') || 'Stock In'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default IngredientStockInModal;
