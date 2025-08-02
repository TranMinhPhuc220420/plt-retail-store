import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, message, Checkbox, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import useRecipeStore from '../../store/recipe';

const RecipeSelector = ({ visible, onCancel, onConfirm, product, existingRecipeIds = [] }) => {
  const { t } = useTranslation();
  const { recipes, isLoading: loading } = useRecipeStore();
  const [selectedRecipeIds, setSelectedRecipeIds] = useState([]);
  const [setAsDefault, setSetAsDefault] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedRecipeIds([]);
      setSetAsDefault(false);
    }
  }, [visible]);

  const availableRecipes = recipes.filter(recipe => 
    !existingRecipeIds.includes(recipe._id)
  );

  const handleConfirm = () => {
    if (selectedRecipeIds.length === 0) {
      message.warning(t('MSG_PLEASE_SELECT_RECIPES'));
      return;
    }
    
    onConfirm(product._id, selectedRecipeIds, setAsDefault);
  };

  const rowSelection = {
    type: 'checkbox',
    selectedRowKeys: selectedRecipeIds,
    onChange: (selectedKeys) => {
      setSelectedRecipeIds(selectedKeys);
      if (selectedKeys.length !== 1) {
        setSetAsDefault(false);
      }
    },
  };

  const columns = [
    {
      title: t('TXT_RECIPE_NAME'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('TXT_DESCRIPTION'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('TXT_YIELD_QUANTITY'),
      key: 'yield',
      render: (_, record) => {
        if (record.yield) {
          return `${record.yield.quantity} ${record.yield.unit}`;
        }
        return '-';
      },
    },
  ];

  return (
    <Modal
      title={t('TXT_LINK_RECIPES_TO_PRODUCT')}
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      width={800}
      okText={t('TXT_LINK_RECIPE')}
      cancelText={t('TXT_CANCEL')}
      confirmLoading={loading}
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          message={t('TXT_SELECTED_PRODUCT')}
          description={product?.name}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        {selectedRecipeIds.length === 1 && (
          <Checkbox
            checked={setAsDefault}
            onChange={(e) => setSetAsDefault(e.target.checked)}
          >
            {t('MSG_SET_AS_DEFAULT_RECIPE_INFO')}
          </Checkbox>
        )}
      </div>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={availableRecipes}
        rowKey="_id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          size: 'small',
        }}
      />
    </Modal>
  );
};

export default RecipeSelector;
