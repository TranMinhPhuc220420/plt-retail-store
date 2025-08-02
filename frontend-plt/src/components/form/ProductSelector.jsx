import React, { useState, useEffect } from 'react';
import { Select, Tag, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import useProductStore from '@/store/product';

const { Option } = Select;

/**
 * Product Selector Component - Multi-select dropdown with search for products
 * @param {Object} props - Component props
 * @param {Array} props.value - Selected product IDs
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.storeCode - Store code for filtering products
 * @param {string} props.ownerId - Owner ID for filtering products
 * @param {boolean} props.multiple - Whether to allow multiple selection
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether the selector is disabled
 * @param {Array} props.excludeIds - Product IDs to exclude from options
 * @param {boolean} props.showPrice - Whether to show price information in options
 */
const ProductSelector = ({
  value = [],
  onChange,
  storeCode,
  ownerId,
  multiple = true,
  placeholder,
  disabled = false,
  excludeIds = [],
  showPrice = false
}) => {
  const { t } = useTranslation();
  const { products, isLoading, fetchProducts } = useProductStore();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (storeCode && ownerId) {
      fetchProducts({ storeCode, ownerId });
    }
  }, [storeCode, ownerId, fetchProducts]);

  const filteredProducts = products.filter(product => 
    !excludeIds.includes(product._id) &&
    (searchValue === '' || 
     product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
     product.productCode?.toLowerCase().includes(searchValue.toLowerCase()) ||
     product.description?.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const handleChange = (selectedValues) => {
    if (onChange) {
      onChange(selectedValues);
    }
  };

  const handleSearch = (value) => {
    setSearchValue(value);
  };

  const renderOption = (product) => (
    <Option key={product._id} value={product._id}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="font-medium">{product.name}</div>
          {product.productCode && (
            <div className="text-sm text-gray-500">
              Code: {product.productCode}
            </div>
          )}
          {product.description && (
            <div className="text-sm text-gray-500 truncate">
              {product.description}
            </div>
          )}
          <div className="flex gap-1 mt-1">
            <Tag color="green" size="small">
              {product.unit}
            </Tag>
            {showPrice && product.retailPrice && (
              <Tag color="orange" size="small">
                {parseFloat(product.retailPrice.toString()).toLocaleString()} VND
              </Tag>
            )}
            {product.status && (
              <Tag 
                color={product.status === 'active' ? 'green' : 'red'} 
                size="small"
              >
                {product.status}
              </Tag>
            )}
          </div>
        </div>
      </div>
    </Option>
  );

  const renderValue = (selectedValue) => {
    const product = products.find(p => p._id === selectedValue);
    if (!product) return selectedValue;

    return (
      <Tooltip title={`${product.name} - ${product.productCode || 'No code'}`}>
        <Tag color="green" style={{ margin: '2px' }}>
          {product.name}
          {showPrice && product.retailPrice && (
            <span className="ml-1 text-xs">
              ({parseFloat(product.retailPrice.toString()).toLocaleString()} VND)
            </span>
          )}
        </Tag>
      </Tooltip>
    );
  };

  return (
    <Select
      mode={multiple ? 'multiple' : undefined}
      value={value}
      onChange={handleChange}
      onSearch={handleSearch}
      placeholder={placeholder || t('TXT_SELECT_PRODUCTS')}
      loading={isLoading}
      disabled={disabled}
      showSearch
      allowClear
      filterOption={false}
      style={{ width: '100%' }}
      tagRender={multiple ? ({ label, value: tagValue, closable, onClose }) => {
        const product = products.find(p => p._id === tagValue);
        return (
          <Tag
            color="green"
            closable={closable}
            onClose={onClose}
            style={{ marginRight: 3 }}
          >
            <Tooltip title={`${product?.name} - ${product?.productCode || 'No code'}`}>
              {product?.name || tagValue}
              {showPrice && product?.retailPrice && (
                <span className="ml-1 text-xs">
                  ({parseFloat(product.retailPrice.toString()).toLocaleString()})
                </span>
              )}
            </Tooltip>
          </Tag>
        );
      } : undefined}
      notFoundContent={isLoading ? t('TXT_LOADING') : t('MSG_NO_PRODUCTS_FOUND')}
    >
      {filteredProducts.map(renderOption)}
    </Select>
  );
};

export default ProductSelector;
