import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Ant Design
import { Form, Input, InputNumber, Select, Button, Space, message } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';

// API
import { updateIngredient } from '@/request/ingredient';

const { Option } = Select;

/**
 * Form component for editing existing ingredients
 * @param {Object} props - Component props
 * @param {Object} props.ingredient - Ingredient data to edit
 * @param {string} props.storeCode - Store code for API requests
 * @param {string} props.ownerId - Owner ID for API requests
 * @param {Array} props.warehouses - Available warehouses for selection
 * @param {Function} props.onSuccess - Callback function on successful update
 * @param {Function} props.onCancel - Callback function on cancel
 * @param {Function} props.onFail - Callback function on update failure
 */
const EditIngredientForm = ({
  ingredient,
  storeCode,
  ownerId,
  warehouses = [],
  onSuccess,
  onCancel,
  onFail
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  // Standardized unit options - only grams/kilograms and milliliters/liters
  const unitOptions = [
    'g',    // grams (base weight unit)
    'kg',   // kilograms 
    'ml',   // milliliters (base volume unit)
    'l',    // liters
    'piece' // for countable items that can't be measured by weight/volume
  ];

  /**
   * Initialize form with ingredient data
   */
  useEffect(() => {
    if (ingredient) {
      console.log(ingredient);
      
      form.setFieldsValue({
        name: ingredient.name,
        unit: ingredient.unit,
        stockQuantity: ingredient.stockQuantity,
        warehouseId: ingredient.warehouseId._id
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
        values,
        { ownerId, storeCode }
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

      {/* Stock Quantity */}
      <Form.Item
        label={t('TXT_STOCK_QUANTITY')}
        name="stockQuantity"
        rules={[
          { required: true, message: t('MSG_STOCK_QUANTITY_REQUIRED') },
          { type: 'number', min: 0, message: t('MSG_STOCK_QUANTITY_MIN') }
        ]}
      >
        <InputNumber
          placeholder={t('TXT_ENTER_STOCK_QUANTITY')}
          min={0}
          precision={2}
          style={{ width: '100%' }}
          addonAfter={form.getFieldValue('unit') || t('TXT_UNIT')}
        />
      </Form.Item>

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
        >
          {warehouses.map(warehouse => (
            <Option key={warehouse._id} value={warehouse._id}>
              {warehouse.name} - {warehouse.address}
            </Option>
          ))}
        </Select>
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
              icon={<PlusOutlined />}
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
