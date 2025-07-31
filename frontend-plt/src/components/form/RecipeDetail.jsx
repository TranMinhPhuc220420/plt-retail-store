import React from 'react';
import { useTranslation } from 'react-i18next';

// Ant Design
import { Card, Descriptions, Tag, Typography, Divider, Alert } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * Modal component for displaying recipe details
 * @param {Object} props - Component props
 * @param {Object} props.recipe - Recipe data to display
 * @param {Object} props.availability - Recipe availability information
 * @param {Function} props.onClose - Callback function to close modal
 */
const RecipeDetailModal = ({
  recipe,
  availability,
  onClose
}) => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Recipe Basic Information */}
      <div className="mb-4">
        <Card>
          <Title level={4} className="mb-3">
            {recipe.dishName}
          </Title>

          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('TXT_DESCRIPTION')}>
              {recipe.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('TXT_INGREDIENTS_COUNT')}>
              <Tag color="blue">
                {recipe.ingredients?.length || 0} {t('TXT_INGREDIENTS')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('TXT_STORE_NAME')}>
              {recipe.storeName} ({recipe.storeCode})
            </Descriptions.Item>
            <Descriptions.Item label={t('TXT_CREATED_AT')}>
              {recipe.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label={t('LABEL_UPDATED_AT')}>
              {recipe.updatedAt}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>

      {/* Availability Information */}
      {availability && (
        <div className="mb-4">
          <Card>
            <Title level={5} className="mb-3">
              {t('TXT_RECIPE_AVAILABILITY')}
            </Title>

            {availability.canPrepare ? (
              <Alert
                message={t('MSG_RECIPE_CAN_BE_PREPARED')}
                type="success"
                icon={<CheckCircleOutlined />}
                className="mb-3"
              />
            ) : (
              <Alert
                message={t('MSG_RECIPE_CANNOT_BE_PREPARED')}
                description={t('MSG_INSUFFICIENT_INGREDIENTS')}
                type="error"
                icon={<ExclamationCircleOutlined />}
                className="mb-3"
              />
            )}

            {availability.missingIngredients && availability.missingIngredients.length > 0 && (
              <div>
                <Text strong className="text-red-500">
                  {t('TXT_MISSING_INGREDIENTS')}:
                </Text>
                <ul className="mt-2 ml-4">
                  {availability.missingIngredients.map((ingredient, index) => (
                    <li key={index} className="text-red-500">
                      {ingredient.name}: {t('TXT_NEED')} {ingredient.needed} {ingredient.unit},
                      {t('TXT_AVAILABLE')} {ingredient.available} {ingredient.unit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Recipe Ingredients */}
      <Card>
        <Title level={5} className="mb-3">
          {t('TXT_RECIPE_INGREDIENTS')}
        </Title>

        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => {
              const ingredientData = ingredient.ingredientId;
              
              // Find availability info for this ingredient
              const availabilityInfo = availability?.availability?.find(
                item => item.ingredientName === ingredientData?.name
              );
              
              const isAvailable = availabilityInfo?.isAvailable || false;

              return (
                <div className="mb-1" key={index}>
                  <Card
                    key={index}
                    size="small"
                    className={`border ${isAvailable ? 'border-green-200' : 'border-red-200'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Text strong>
                            {ingredientData?.name || 'Unknown ingredient'}
                          </Text>
                          {isAvailable ? (
                            <Tag color="green" size="small">
                              {t('TXT_AVAILABLE')}
                            </Tag>
                          ) : (
                            <Tag color="red" size="small">
                              {t('TXT_INSUFFICIENT')}
                            </Tag>
                          )}
                        </div>

                        <div className="mt-1 text-sm text-gray-600">
                          <div>
                            <Text>{t('TXT_REQUIRED')}: </Text>
                            <Text strong>
                              {ingredient.amountUsed} {ingredient.unit}
                            </Text>
                          </div>
                          <div>
                            <Text>{t('TXT_IN_STOCK')}: </Text>
                            <Text strong className={isAvailable ? 'text-green-600' : 'text-red-600'}>
                              {ingredientData?.stockQuantity || 0} {ingredientData?.unit || ingredient.unit}
                            </Text>
                            {availabilityInfo?.availableInRequiredUnit !== null && 
                             availabilityInfo?.stockUnit !== availabilityInfo?.requiredUnit && (
                              <Text className="ml-2 text-gray-500">
                                (≈ {availabilityInfo.availableInRequiredUnit?.toFixed(2)} {ingredient.unit})
                              </Text>
                            )}
                          </div>
                          {ingredientData?.warehouseId && (
                            <div>
                              <Text>{t('TXT_WAREHOUSE')}: </Text>
                              <Text>{ingredientData.warehouseId.name}</Text>
                            </div>
                          )}
                          {availabilityInfo?.message && !isAvailable && (
                            <div className="mt-1">
                              <Text className="text-red-500 text-xs">
                                {availabilityInfo.message}
                              </Text>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            {t('MSG_NO_INGREDIENTS_FOUND')}
          </div>
        )}
      </Card>
    </div>
  );
};

export default RecipeDetailModal;
