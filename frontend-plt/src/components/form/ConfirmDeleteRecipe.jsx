import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Ant Design
import { Button, Space, Typography, Alert, message, Card, Divider } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

// API
import { deleteRecipe } from '@/request/recipe';

const { Title, Text } = Typography;

/**
 * Confirmation component for deleting recipes
 * @param {Object} props - Component props
 * @param {Object} props.recipe - Recipe data to delete
 * @param {string} props.storeCode - Store code for API requests
 * @param {string} props.ownerId - Owner ID for API requests
 * @param {Function} props.onSuccess - Callback function on successful deletion
 * @param {Function} props.onCancel - Callback function on cancel
 * @param {Function} props.onFail - Callback function on deletion failure
 */
const ConfirmDeleteRecipe = ({ 
  recipe,
  storeCode, 
  ownerId, 
  onSuccess, 
  onCancel, 
  onFail 
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle recipe deletion
   */
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteRecipe(
        recipe._id,
        { ownerId, storeCode }
      );
      message.success(t('MSG_RECIPE_DELETED_SUCCESSFULLY'));
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      const errorMessage = typeof error === 'string' ? error : 'MSG_RECIPE_DELETE_FAILED';
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
          {t('TXT_CONFIRM_DELETE_RECIPE')}
        </Title>
      </div>

      <Alert
        message={t('TXT_WARNING')}
        description={t('MSG_DELETE_RECIPE_WARNING')}
        type="warning"
        showIcon
        className="mb-4"
      />

      <Card className="mb-4">
        <Title level={5} className="mb-3">
          {t('TXT_RECIPE_DETAILS')}
        </Title>
        
        <div className="space-y-2">
          <div>
            <Text strong>{t('TXT_DISH_NAME')}: </Text>
            <Text>{recipe.dishName}</Text>
          </div>
          
          <div>
            <Text strong>{t('TXT_DESCRIPTION')}: </Text>
            <Text>{recipe.description || '-'}</Text>
          </div>
          
          <div>
            <Text strong>{t('TXT_INGREDIENTS_COUNT')}: </Text>
            <Text>{recipe.ingredients?.length || 0} {t('TXT_INGREDIENTS')}</Text>
          </div>
          
          <div>
            <Text strong>{t('TXT_CREATED_AT')}: </Text>
            <Text>{recipe.createdAt}</Text>
          </div>
        </div>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <>
            <Divider />
            <Title level={5} className="mb-2">
              {t('TXT_RECIPE_INGREDIENTS')}
            </Title>
            <div className="space-y-1">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="text-sm">
                  <Text>
                    • {ingredient.ingredientId?.name || 'Unknown ingredient'}: {ingredient.amountUsed} {ingredient.unit}
                  </Text>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <div className="text-center">
        <Text className="text-gray-600">
          {t('MSG_DELETE_RECIPE_CONFIRMATION')}
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
            {t('TXT_DELETE_RECIPE')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ConfirmDeleteRecipe;
