import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, message, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import useStoreProduct from '../../store/product';

const ProductSelector = ({ visible, onCancel, onConfirm, recipe, existingProductIds = [] }) => {
  const { t } = useTranslation();
  const { products, isLoading: loading } = useStoreProduct();
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  useEffect(() => {
    if (visible) {
      setSelectedProductIds([]);
    }
  }, [visible]);

  const availableProducts = products.filter(product => 
    !existingProductIds.includes(product._id)
  );

  const handleConfirm = () => {
    if (selectedProductIds.length === 0) {
      message.warning(t('MSG_PLEASE_SELECT_PRODUCTS'));
      return;
    }
    
    onConfirm(recipe._id, selectedProductIds);
  };

  const rowSelection = {
    type: 'checkbox',
    selectedRowKeys: selectedProductIds,
    onChange: (selectedKeys) => {
      setSelectedProductIds(selectedKeys);
    },
  };

  const columns = [
    {
      title: t('TXT_PRODUCT_NAME'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('TXT_CATEGORY'),
      dataIndex: ['productCategory', 'name'],
      key: 'category',
    },
    {
      title: t('TXT_COST_PRICE'),
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (price) => price ? `${price.toLocaleString()} VND` : '-',
    },
    {
      title: t('TXT_SELLING_PRICE'),
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (price) => price ? `${price.toLocaleString()} VND` : '-',
    },
  ];

  return (
    <Modal
      title={t('TXT_LINK_PRODUCTS_TO_RECIPE')}
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      width={800}
      okText={t('TXT_LINK_PRODUCT')}
      cancelText={t('TXT_CANCEL')}
      confirmLoading={loading}
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          message={t('TXT_SELECTED_RECIPE')}
          description={recipe?.name}
          type="info"
          showIcon
        />
      </div>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={availableProducts}
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

export default ProductSelector;
