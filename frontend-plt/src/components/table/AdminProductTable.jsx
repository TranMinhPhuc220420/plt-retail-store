import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// Third-party libraries

import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Table, Space, Popconfirm, Image, Tag } from "antd";
const { Column } = Table;

// Components

// use zustand
import useStoreProduct from "@/store/product";
import useStoreStore from "@/store/store";
import useStoreProductType from "@/store/productType";

// Constants

const AdminProductTable = ({ storeCode, onEdit, onDelete, onSelectionChange }) => {
  // Translation
  const { t } = useTranslation();

  // Store products
  const dataSource = useStoreProduct((state) => state.products);
  const isLoading = useStoreProduct((state) => state.isLoading);
  const isLoadProductTypeSuccess = useStoreProductType((state) => state.success);
  const { productTypes, fetchProductTypes } = useStoreProductType();

  // State
  const [height, setHeight] = useState(window.innerHeight - 310);

  // Columns for the table
  const columns = [
    {
      key: 'imageUrl',
      dataIndex: 'imageUrl',
      width: 80,
      render: (imageUrl) => {
        return <Image
          width={50}
          height={50}
          src={imageUrl}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          style={{ objectFit: 'cover' }}
        />
      },
    },
    {
      key: 'productCode',
      title: t('LABEL_PRODUCT_CODE'),
      dataIndex: 'productCode',
      width: 120,
    },
    {
      key: 'name',
      title: t('LABEL_NAME'),
      dataIndex: 'name',
      width: 200,
    },
    {
      key: 'price',
      title: t('LABEL_PRICE'),
      dataIndex: 'price',
      width: 100,
      render: (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price),
    },
    {
      key: 'retailPrice',
      title: t('LABEL_RETAIL_PRICE'),
      dataIndex: 'retailPrice',
      width: 120,
      render: (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price),
    },
    {
      key: 'stock',
      title: t('LABEL_STOCK'),
      dataIndex: 'stock',
      width: 80,
      render: (stock, record) => (
        <span style={{ color: stock <= record.minStock ? '#ff4d4f' : '#52c41a' }}>
          {stock}
        </span>
      ),
    },
    {
      key: 'unit',
      title: t('LABEL_UNIT'),
      dataIndex: 'unit',
      width: 80,
    },
    {
      key: 'status',
      title: t('LABEL_STATUS'),
      dataIndex: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'selling' ? 'green' : status === 'out_of_stock' ? 'red' : 'orange'}>
          {t(`STATUS_${status.toUpperCase()}`)}
        </Tag>
      ),
    },
    {
      key: 'categories',
      title: t('LABEL_CATEGORIES'),
      dataIndex: 'categories',
      width: 150,
      render: (categories) => (
        <div>
          {categories?.map((category_id) => {
            const productType = productTypes.find((type) => type._id === category_id);
            if (!productType) return null;
            
            return (
              <Tag key={category_id} color="blue">
                {productType.name}
              </Tag>
            );
          })}
        </div>
      ),
    },
    {
      key: 'updatedAt',
      title: t('LABEL_UPDATED_AT'),
      dataIndex: 'updatedAt',
      width: 130,
    }
  ];

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      if (onSelectionChange) {
        onSelectionChange(selectedRowKeys, selectedRows);
      }
    },
    getCheckboxProps: record => ({
      disabled: record.name === 'Disabled User', // Column configuration not to be checked
      name: record.name,
    }),
  };

  // Handlers functions
  const handlerConfirmDelete = async (record) => {
    if (onDelete) onDelete(record);
  }
  const handlerEdit = (record) => {
    if (onEdit) onEdit(record);
  }

  // Effect
  useEffect(() => {
    // Set the height of the table
    const handleResize = () => {
      setHeight(window.innerHeight - 310);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isLoadProductTypeSuccess) {
      fetchProductTypes(storeCode);
    }
  }, []);

  return (
    <Table 
      dataSource={dataSource}
      loading={isLoading}
      scroll={{ y: height, x: true }}
      rowSelection={{ type: 'checkbox', ...rowSelection }}
    >
      {columns.map((column) => (
        <Column
          key={column.key}
          title={column.title}
          dataIndex={column.dataIndex}
          filters={column.filters}
          onFilter={column.onFilter}
          width={column.width}
          render={column.render}
          />
      ))}
      <Column width={10} key="action" render={(_, record) => (
        <Space size="middle">

          <Button type="primary" 
            icon={<EditOutlined />} 
            loading={record.isEditing}
            disabled={record.isEditing || record.isDeleting}
            onClick={() => handlerEdit(record)}
          >
            {t('TXT_EDIT')}
          </Button>

          <Popconfirm title={t('TITLE_CONFIRM_DELETE')} description={t('MSG_CONFIRM_DELETE_PRODUCT_TYPE')}
            okText={t('TXT_CONFIRM')} cancelText={t('TXT_CANCEL')}
            onConfirm={() => handlerConfirmDelete(record)}
          >
            <Button danger type="primary" icon={<DeleteOutlined />}
              loading={record.isDeleting}
              disabled={record.isEditing || record.isDeleting}
            >
              {t('TXT_DELETE')}
            </Button>
          </Popconfirm>

        </Space>
      )}
      />
    </Table>
  );
};

export default AdminProductTable;