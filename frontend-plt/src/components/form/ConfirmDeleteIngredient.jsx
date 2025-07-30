import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Ant Design
import { Button, Space, Typography, Alert, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

// API
import { deleteIngredient } from '@/request/ingredient';

const { Title, Text } = Typography;

/**
 * Confirmation component for deleting ingredients
 * @param {Object} props - Component props
 * @param {Object} props.ingredient - Ingredient data to delete
 * @param {string} props.storeCode - Store code for API requests
 * @param {string} props.ownerId - Owner ID for API requests
 * @param {Function} props.onSuccess - Callback function on successful deletion
 * @param {Function} props.onCancel - Callback function on cancel
 * @param {Function} props.onFail - Callback function on deletion failure
 */
const ConfirmDeleteIngredient = ({ 
  ingredient,
  storeCode, 
  ownerId, 
  onSuccess, 
  onCancel, 
  onFail 
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle ingredient deletion
   */
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteIngredient(
        ingredient._id,
        { ownerId, storeCode }
      );
      message.success(t('MSG_INGREDIENT_DELETED_SUCCESSFULLY'));
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      const errorMessage = typeof error === 'string' ? error : 'MSG_INGREDIENT_DELETE_FAILED';
      message.error(t(errorMessage));
      onFail && onFail();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle cancellation
   */
  const handleCancel = () => {
    onCancel && onCancel();
  };

  return (
    <div>
      <div className="text-center mb-4">
        <ExclamationCircleOutlined className="text-yellow-500 text-4xl mb-3" />
        <Title level={4}>
          {t('TXT_CONFIRM_DELETE_INGREDIENT')}
        </Title>
      </div>

      <Alert
        message={t('TXT_WARNING')}
        description={t('MSG_DELETE_INGREDIENT_WARNING')}
        type="warning"
        showIcon
        className="mb-4"
      />

      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <Title level={5} className="mb-2">
          {t('TXT_INGREDIENT_DETAILS')}
        </Title>
        <div className="space-y-1">
          <div>
            <Text strong>{t('TXT_INGREDIENT_NAME')}: </Text>
            <Text>{ingredient.name}</Text>
          </div>
          <div>
            <Text strong>{t('TXT_UNIT')}: </Text>
            <Text>{ingredient.unit}</Text>
          </div>
          <div>
            <Text strong>{t('TXT_STOCK_QUANTITY')}: </Text>
            <Text>{ingredient.stockQuantity} {ingredient.unit}</Text>
          </div>
          <div>
            <Text strong>{t('TXT_WAREHOUSE')}: </Text>
            <Text>{ingredient.warehouseName || 'N/A'}</Text>
          </div>
          {ingredient.stockQuantity > 0 && (
            <div className="mt-2">
              <Alert
                message={t('MSG_INGREDIENT_HAS_STOCK')}
                type="info"
                size="small"
              />
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <Text className="text-gray-600">
          {t('MSG_DELETE_INGREDIENT_CONFIRMATION')}
        </Text>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end mt-6">
        <Space>
          <Button onClick={handleCancel}>
            {t('TXT_CANCEL')}
          </Button>
          <Button 
            type="primary" 
            danger 
            loading={isLoading}
            onClick={handleDelete}
          >
            {t('TXT_DELETE_INGREDIENT')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ConfirmDeleteIngredient;
