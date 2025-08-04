import React, { useState, useEffect } from 'react';
import { Select, Tag, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import useRecipeStore from '@/store/recipe';

const { Option } = Select;

/**
 * Recipe Selector Component - Multi-select dropdown with search for recipes
 * @param {Object} props - Component props
 * @param {Array} props.value - Selected recipe IDs
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.storeCode - Store code for filtering recipes
 * @param {string} props.ownerId - Owner ID for filtering recipes
 * @param {boolean} props.multiple - Whether to allow multiple selection
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether the selector is disabled
 * @param {Array} props.excludeIds - Recipe IDs to exclude from options
 * @param {boolean} props.showCost - Whether to show cost information in options
 */
const RecipeSelector = ({
  value = [],
  onChange,
  storeCode,
  ownerId,
  multiple = true,
  placeholder,
  disabled = false,
  excludeIds = [],
  showCost = false
}) => {
  const { t } = useTranslation();
  const { recipes, isLoading, fetchRecipes } = useRecipeStore();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (storeCode || ownerId) {
      fetchRecipes({ storeCode, ownerId });
    }
  }, [storeCode, ownerId, fetchRecipes]);

  const filteredRecipes = recipes.filter(recipe =>
    !excludeIds.includes(recipe._id) &&
    (searchValue === '' ||
      recipe.dishName.toLowerCase().includes(searchValue.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const handleChange = (selectedValues) => {
    if (onChange) {
      onChange(selectedValues);
    }
  };

  const handleSearch = (value) => {
    setSearchValue(value);
  };

  const renderOption = (recipe) => (
    <Option key={recipe._id} value={recipe._id} label={recipe.dishName}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="font-medium">{recipe.dishName}</div>
          {recipe.description && (
            <div className="text-sm text-gray-500 truncate">
              {recipe.description}
            </div>
          )}
          <div className="flex gap-1 mt-1">
            <Tag color="blue" size="small">
              {recipe.ingredientCount || recipe.ingredients?.length || 0} {t('TXT_INGREDIENTS')}
            </Tag>
            {recipe.yield && (
              <Tag color="orange" size="small">
                {t('TXT_YIELD')}: {recipe.yield.quantity} {recipe.yield.unit}
              </Tag>
            )}
            {recipe.expiryHours && (
              <Tag color="purple" size="small">
                {t('TXT_EXPIRY')}: {recipe.expiryHours}h
              </Tag>
            )}
            {showCost && recipe.costPerUnit && (
              <Tag color="green" size="small">
                {parseFloat(recipe.costPerUnit.toString()).toFixed(2)} VND/{t('TXT_UNIT')}
              </Tag>
            )}
          </div>
        </div>
      </div>
    </Option>
  );

  return (
    <Select
      mode={multiple ? 'multiple' : undefined}
      value={value}
      onChange={handleChange}
      onSearch={handleSearch}
      placeholder={placeholder || t('TXT_SELECT_RECIPES')}
      loading={isLoading}
      disabled={disabled}
      showSearch
      allowClear
      filterOption={false}
      optionLabelProp={multiple ? undefined : "label"}
      style={{ width: '100%' }}
      tagRender={multiple ? ({ label, value: tagValue, closable, onClose }) => {
        const recipe = recipes.find(r => r._id === tagValue);
        return (
          <Tag
            color="blue"
            closable={closable}
            onClose={onClose}
            style={{ marginRight: 3 }}
          >
            <Tooltip title={recipe?.description ? `${recipe.dishName} - ${recipe.description}` : recipe?.dishName}>
              {recipe?.dishName || tagValue}
            </Tooltip>
          </Tag>
        );
      } : undefined}
      notFoundContent={isLoading ? t('TXT_LOADING') : t('MSG_NO_RECIPES_FOUND')}
    >
      {filteredRecipes.map(renderOption)}
    </Select>
  );
};

export default RecipeSelector;
