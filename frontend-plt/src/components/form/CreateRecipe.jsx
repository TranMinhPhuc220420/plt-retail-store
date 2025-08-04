import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Ant Design
import { 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Button, 
  Space, 
  message, 
  Card, 
  Row, 
  Col,
  Divider,
  Typography 
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, CloseOutlined } from '@ant-design/icons';

// API
import { createRecipe } from '@/request/recipe';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

/**
 * Form component for creating new recipes
 * @param {Object} props - Component props
 * @param {string} props.storeCode - Store code for API requests
 * @param {string} props.ownerId - Owner ID for API requests
 * @param {Array} props.ingredients - Available ingredients for selection
 * @param {Function} props.onSuccess - Callback function on successful creation
 * @param {Function} props.onCancel - Callback function on cancel
 * @param {Function} props.onFail - Callback function on creation failure
 */
const CreateRecipeForm = ({ 
  storeCode, 
  ownerId, 
  ingredients = [], 
  onSuccess, 
  onCancel, 
  onFail 
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  // Unit options for recipe yield
  const unitOptions = [
    'kg',   // kilograms for weight measurements
    'l',    // liters for volume measurements
    'phần'  // portions/servings
  ];

  /**
   * Handle form submission
   * @param {Object} values - Form values
   */
  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const recipeData = {
        ...values,
        ownerId,
        storeCode
      };

      await createRecipe(recipeData);
      message.success(t('MSG_RECIPE_CREATED_SUCCESSFULLY'));
      form.resetFields();
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Failed to create recipe:', error);
      const errorMessage = typeof error === 'string' ? error : 'MSG_RECIPE_CREATION_FAILED';
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

  /**
   * Get available ingredients that haven't been selected yet
   */
  const getAvailableIngredients = (currentIndex, currentValues) => {
    const selectedIngredients = currentValues
      .map((_, index) => form.getFieldValue(['ingredients', index, 'ingredientId']))
      .filter((id, index) => id && index !== currentIndex);
    
    return ingredients.filter(ingredient => 
      !selectedIngredients.includes(ingredient._id)
    );
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      requiredMark={false}
      initialValues={{
        ingredients: [{}],
        yield: {
          quantity: 1,
          unit: 'phần'
        }
      }}
    >
      <Row gutter={16}>
        <Col span={24}>
          {/* Recipe Name */}
          <Form.Item
            label={t('TXT_DISH_NAME')}
            name="dishName"
            rules={[
              { required: true, message: t('MSG_DISH_NAME_REQUIRED') },
              { min: 2, message: t('MSG_DISH_NAME_MIN_LENGTH') },
              { max: 100, message: t('MSG_DISH_NAME_MAX_LENGTH') }
            ]}
          >
            <Input 
              placeholder={t('TXT_ENTER_DISH_NAME')}
              maxLength={100}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          {/* Recipe Description */}
          <Form.Item
            label={t('TXT_DESCRIPTION')}
            name="description"
            rules={[
              { max: 500, message: t('MSG_DESCRIPTION_MAX_LENGTH') }
            ]}
          >
            <TextArea 
              placeholder={t('TXT_ENTER_RECIPE_DESCRIPTION')}
              maxLength={500}
              rows={3}
              showCount
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          {/* Recipe Yield Quantity */}
          <Form.Item
            label={t('TXT_RECIPE_YIELD_QUANTITY')}
            name={['yield', 'quantity']}
            rules={[
              { required: true, message: t('MSG_YIELD_QUANTITY_REQUIRED') },
              { type: 'number', min: 1, message: t('MSG_YIELD_QUANTITY_MIN') }
            ]}
            tooltip={t('TXT_RECIPE_YIELD_QUANTITY_TOOLTIP')}
          >
            <InputNumber
              placeholder={t('TXT_ENTER_YIELD_QUANTITY')}
              min={1}
              precision={0}
              style={{ width: '100%' }}
              addonAfter={<span>{t('TXT_UNITS')}</span>}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          {/* Recipe Yield Unit */}
          <Form.Item
            label={t('TXT_RECIPE_YIELD_UNIT')}
            name={['yield', 'unit']}
            rules={[
              { required: true, message: t('MSG_YIELD_UNIT_REQUIRED') }
            ]}
            tooltip={t('TXT_RECIPE_YIELD_UNIT_TOOLTIP')}
          >
            <Select
              placeholder={t('TXT_SELECT_YIELD_UNIT')}
              showSearch
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
          {/* Recipe Expiry Hours */}
          <Form.Item
            label={t('TXT_EXPIRY_HOURS')}
            name="expiryHours"
            rules={[
              { required: true, message: t('MSG_EXPIRY_HOURS_REQUIRED') },
              { type: 'number', min: 1, max: 168, message: t('MSG_EXPIRY_HOURS_RANGE') }
            ]}
            tooltip={t('TXT_EXPIRY_HOURS_TOOLTIP')}
          >
            <InputNumber
              placeholder={t('TXT_ENTER_EXPIRY_HOURS')}
              min={1}
              max={168}
              precision={0}
              style={{ width: '100%' }}
              addonAfter={<span>{t('TXT_HOURS')}</span>}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      {/* Ingredients Section */}
      <Title level={5}>{t('TXT_RECIPE_INGREDIENTS')}</Title>
      
      <Form.List
        name="ingredients"
        rules={[
          {
            validator: async (_, ingredients) => {
              if (!ingredients || ingredients.length < 1) {
                return Promise.reject(new Error(t('MSG_AT_LEAST_ONE_INGREDIENT_REQUIRED')));
              }
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map(({ key, name, ...restField }, index) => (
              <Card 
                key={key} 
                size="small" 
                className="mb-4"
                title={`${t('TXT_INGREDIENT')} ${index + 1}`}
                extra={
                  fields.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    >
                      {t('TXT_REMOVE')}
                    </Button>
                  )
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    {/* Ingredient Selection */}
                    <Form.Item
                      {...restField}
                      label={t('TXT_INGREDIENT')}
                      name={[name, 'ingredientId']}
                      rules={[
                        { required: true, message: t('MSG_INGREDIENT_REQUIRED') }
                      ]}
                    >
                      <Select
                        placeholder={t('TXT_SELECT_INGREDIENT')}
                        showSearch
                        // filterOption={(input, option) =>
                        //   option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        // }
                      >
                        {getAvailableIngredients(index, form.getFieldValue('ingredients') || []).map(ingredient => (
                          <Option key={ingredient._id} value={ingredient._id}>
                            {ingredient.name} ({ingredient.stockQuantity} {ingredient.unit})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    {/* Amount Used */}
                    <Form.Item
                      {...restField}
                      label={t('TXT_AMOUNT_USED')}
                      name={[name, 'amountUsed']}
                      rules={[
                        { required: true, message: t('MSG_AMOUNT_REQUIRED') },
                        { type: 'number', min: 0.01, message: t('MSG_AMOUNT_MIN') }
                      ]}
                    >
                      <InputNumber
                        placeholder={t('TXT_ENTER_AMOUNT')}
                        min={0.01}
                        precision={2}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    {/* Unit */}
                    <Form.Item
                      {...restField}
                      label={t('TXT_UNIT')}
                      name={[name, 'unit']}
                      rules={[
                        { required: true, message: t('MSG_UNIT_REQUIRED') }
                      ]}
                    >
                      <Select
                        placeholder={t('TXT_UNIT')}
                        showSearch
                      >
                        {unitOptions.map(unit => (
                          <Option key={unit} value={unit}>
                            {unit}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
            
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                disabled={fields.length >= ingredients.length}
              >
                {t('TXT_ADD_INGREDIENT')}
              </Button>
              <Form.ErrorList errors={errors} />
            </Form.Item>
          </>
        )}
      </Form.List>

      {/* Action Buttons */}
      {/* <Form.Item>
        <Space>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isLoading}
          >
            {t('TXT_CREATE_RECIPE')}
          </Button>
          <Button onClick={handleCancel}>
            {t('TXT_CANCEL')}
          </Button>
        </Space>
      </Form.Item> */}
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
              {t('TXT_CREATE_RECIPE')}
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

export default CreateRecipeForm;
