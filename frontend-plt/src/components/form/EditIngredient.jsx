import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Ant Design
import { Form, Input, InputNumber, Select, Button, Space, message, Row, Col } from 'antd';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';

// API
import { updateIngredient } from '@/request/ingredient';
import { parseNumberDecimal } from '@/utils';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Form component for editing existing ingredients
 * @param {Object} props - Component props
 * @param {Object} props.ingredient - Ingredient data to edit
 * @param {string} props.storeCode - Store code for API requests
 * @param {string} props.ownerId - Owner ID for API requests
 * @param {Array} props.warehouses - Available warehouses for selection
 * @param {Array} props.suppliers - Available suppliers for selection
 * @param {Function} props.onSuccess - Callback function on successful update
 * @param {Function} props.onCancel - Callback function on cancel
 * @param {Function} props.onFail - Callback function on update failure
 */
const EditIngredientForm = ({
  ingredient,
  storeCode,
  ownerId,
  warehouses = [],
  suppliers = [],
  onSuccess,
  onCancel,
  onFail
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  // Category options
  const categoryOptions = [
    'dairy', 'meat', 'vegetables', 'fruits', 'spices', 'grains', 
    'seafood', 'poultry', 'herbs', 'oils', 'condiments', 'beverages', 
    'nuts', 'legumes', 'frozen', 'canned', 'bakery', 'general'
  ];

  // Simplified unit options - only kg and liter for consistency
  const unitOptions = [
    'kg',   // kilograms for weight measurements
    'l'     // liters for volume measurements
  ];

  // Storage temperature options
  const storageTemperatureOptions = [
    { value: 'frozen', label: t('TXT_FROZEN') || 'Frozen' },
    { value: 'refrigerated', label: t('TXT_REFRIGERATED') || 'Refrigerated' },
    { value: 'room_temp', label: t('TXT_ROOM_TEMPERATURE') || 'Room Temperature' }
  ];

  // Status options
  const statusOptions = [
    { value: 'active', label: t('TXT_ACTIVE') || 'Active' },
    { value: 'inactive', label: t('TXT_INACTIVE') || 'Inactive' },
    { value: 'discontinued', label: t('TXT_DISCONTINUED') || 'Discontinued' }
  ];

  /**
   * Initialize form with ingredient data
   */
  useEffect(() => {
    if (ingredient) {
      form.setFieldsValue({
        ingredientCode: ingredient.ingredientCode,
        name: ingredient.name,
        description: ingredient.description,
        category: ingredient.category,
        unit: ingredient.unit,
        minStock: ingredient.minStock,
        maxStock: ingredient.maxStock,
        standardCost: parseNumberDecimal(ingredient.standardCost),
        warehouseId: ingredient.warehouseId?._id || ingredient.warehouseId,
        defaultSupplierId: ingredient.defaultSupplierId?._id || ingredient.defaultSupplierId,
        status: ingredient.status,
        imageUrl: ingredient.imageUrl || '',
        properties: {
          storageTemp: ingredient.properties?.storageTemp,
          shelfLifeDays: ingredient.properties?.shelfLifeDays,
          specialHandling: ingredient.properties?.specialHandling
        }
      });
    }
  }, [ingredient, form]);

  /**
   * Handle form submission
   * @param {Object} values - Form values
   */
  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      await updateIngredient(
        ingredient._id,
        {...values, storeCode},
      );
      message.success(t('MSG_INGREDIENT_UPDATED_SUCCESSFULLY'));
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Failed to update ingredient:', error);
      const errorMessage = typeof error === 'string' ? error : 'MSG_INGREDIENT_UPDATE_FAILED';
      message.error(t(errorMessage));
      onFail && onFail();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle form cancellation
   */
  const handleCancel = () => {
    form.resetFields();
    onCancel && onCancel();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      requiredMark={false}
    >
      <Row gutter={16}>
        <Col span={12}>
          {/* Ingredient Code - Read Only */}
          <Form.Item
            label={t('TXT_INGREDIENT_CODE')}
            name="ingredientCode"
          >
            <Input
              placeholder={t('TXT_INGREDIENT_CODE')}
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          {/* Ingredient Name */}
          <Form.Item
            label={t('TXT_INGREDIENT_NAME')}
            name="name"
            rules={[
              { required: true, message: t('MSG_INGREDIENT_NAME_REQUIRED') },
              { min: 2, message: t('MSG_INGREDIENT_NAME_MIN_LENGTH') },
              { max: 100, message: t('MSG_INGREDIENT_NAME_MAX_LENGTH') }
            ]}
          >
            <Input
              placeholder={t('TXT_ENTER_INGREDIENT_NAME')}
              maxLength={100}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Description */}
      <Form.Item
        label={t('TXT_DESCRIPTION')}
        name="description"
        rules={[
          { max: 500, message: t('MSG_DESCRIPTION_MAX_LENGTH') }
        ]}
      >
        <TextArea
          placeholder={t('TXT_ENTER_DESCRIPTION')}
          rows={3}
          maxLength={500}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={8}>
          {/* Category */}
          <Form.Item
            label={t('TXT_CATEGORY')}
            name="category"
            rules={[
              { required: true, message: t('MSG_CATEGORY_REQUIRED') }
            ]}
          >
            <Select
              placeholder={t('TXT_SELECT_CATEGORY')}
              showSearch
              allowClear
            >
              {categoryOptions.map(category => (
                <Option key={category} value={category}>
                  {t(`TXT_CATEGORY_${category.toUpperCase()}`) || category}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          {/* Unit of Measurement */}
          <Form.Item
            label={t('TXT_UNIT_OF_MEASUREMENT')}
            name="unit"
            rules={[
              { required: true, message: t('MSG_UNIT_REQUIRED') }
            ]}
          >
            <Select
              placeholder={t('TXT_SELECT_UNIT')}
              showSearch
              allowClear
            >
              {unitOptions.map(unit => (
                <Option key={unit} value={unit}>
                  {unit}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          {/* Status */}
          <Form.Item
            label={t('TXT_STATUS')}
            name="status"
            rules={[
              { required: true, message: t('MSG_STATUS_REQUIRED') }
            ]}
          >
            <Select
              placeholder={t('TXT_SELECT_STATUS')}
            >
              {statusOptions.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          {/* Min Stock */}
          <Form.Item
            label={t('TXT_MIN_STOCK')}
            name="minStock"
            rules={[
              { type: 'number', min: 0, message: t('MSG_MIN_STOCK_MIN') }
            ]}
          >
            <InputNumber
              placeholder={t('TXT_ENTER_MIN_STOCK')}
              min={0}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          {/* Max Stock */}
          <Form.Item
            label={t('TXT_MAX_STOCK')}
            name="maxStock"
            rules={[
              { type: 'number', min: 0, message: t('MSG_MAX_STOCK_MIN') }
            ]}
          >
            <InputNumber
              placeholder={t('TXT_ENTER_MAX_STOCK')}
              min={0}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          {/* Standard Cost */}
          <Form.Item
            label={t('TXT_STANDARD_COST')}
            name="standardCost"
            rules={[
              { type: 'number', min: 0, message: t('MSG_STANDARD_COST_MIN') }
            ]}
          >
            <InputNumber
              placeholder={t('TXT_ENTER_STANDARD_COST')}
              min={0}
              step={1000}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' VNĐ'}
              parser={(value) => value.replace(/\s?VNĐ|(,*)/g, '')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          {/* Warehouse Selection */}
          <Form.Item
            label={t('TXT_WAREHOUSE')}
            name="warehouseId"
            rules={[
              { required: true, message: t('MSG_WAREHOUSE_REQUIRED') }
            ]}
          >
            <Select
              placeholder={t('TXT_SELECT_WAREHOUSE')}
              showSearch
              optionFilterProp="children"
            >
              {warehouses.map(warehouse => (
                <Option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name} - {warehouse.address}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          {/* Default Supplier */}
          <Form.Item
            label={t('TXT_DEFAULT_SUPPLIER')}
            name="defaultSupplierId"
          >
            <Select
              placeholder={t('TXT_SELECT_SUPPLIER')}
              showSearch
              allowClear
              optionFilterProp="children"
            >
              {suppliers.map(supplier => (
                <Option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Properties Section */}
      <Row gutter={16}>
        <Col span={8}>
          {/* Storage Temperature */}
          <Form.Item
            label={t('TXT_STORAGE_TEMPERATURE')}
            name={['properties', 'storageTemp']}
          >
            <Select
              placeholder={t('TXT_SELECT_STORAGE_TEMP')}
            >
              {storageTemperatureOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          {/* Shelf Life Days */}
          <Form.Item
            label={t('TXT_SHELF_LIFE_DAYS')}
            name={['properties', 'shelfLifeDays']}
            rules={[
              { type: 'number', min: 1, message: t('MSG_SHELF_LIFE_MIN') }
            ]}
          >
            <InputNumber
              placeholder={t('TXT_ENTER_SHELF_LIFE')}
              min={1}
              style={{ width: '100%' }}
              addonAfter={t('TXT_DAYS') || 'days'}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          {/* Image URL */}
          <Form.Item
            label={t('TXT_IMAGE_URL')}
            name="imageUrl"
            rules={[
              { type: 'url', message: t('MSG_INVALID_URL') }
            ]}
          >
            <Input
              placeholder={t('TXT_ENTER_IMAGE_URL')}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Special Handling */}
      <Form.Item
        label={t('TXT_SPECIAL_HANDLING')}
        name={['properties', 'specialHandling']}
        rules={[
          { max: 500, message: t('MSG_SPECIAL_HANDLING_MAX_LENGTH') }
        ]}
      >
        <TextArea
          placeholder={t('TXT_ENTER_SPECIAL_HANDLING')}
          rows={2}
          maxLength={500}
        />
      </Form.Item>

      {/* Action Buttons */}
      <div className="flex justify-end pt-4">
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              disabled={isLoading}
              icon={<SaveOutlined />}
            >
              {t('TXT_UPDATE_INGREDIENT')}
            </Button>
            <Button
              type="default"
              danger
              onClick={handleCancel}
              disabled={isLoading}
              icon={<CloseOutlined />}
            >
              {t('TXT_CANCEL')}
            </Button>
          </Space>
        </Form.Item>
      </div>
    </Form>
  );
};

export default EditIngredientForm;
