import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// Third-party libraries

import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, message, Table, Space, Popconfirm } from "antd";
const { Column, ColumnGroup } = Table;

// Components

// use zustand
import useStoreProductType from "@/store/productType";

// Constants

const AdminProductTypeTable = ({ onEdit, onDelete, onSelectionChange }) => {
  // Translation
  const { t } = useTranslation();

  // Store product types
  const dataSource = useStoreProductType((state) => state.productTypes);
  const isLoading = useStoreProductType((state) => state.isLoading);

  // State
  const [height, setHeight] = useState(window.innerHeight - 310);

  // Columns for the table
  const columns = [
    {
      key: 'name',
      title: t('LABEL_NAME'),
      dataIndex: 'name',
      width: 200,
    },
    {
      key: 'description',
      title: t('LABEL_DESCRIPTION'),
      dataIndex: 'description',
      width: '40%',
      render: (text) => (
        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {text}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: t('LABEL_CREATED_AT'),
      dataIndex: 'createdAt',
    },
    {
      key: 'updatedAt',
      title: t('LABEL_UPDATED_AT'),
      dataIndex: 'updatedAt',
    }
  ];

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      if (onSelectionChange) {
        console.log(selectedRowKeys, selectedRows);
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
      <Column key="action" render={(_, record) => (
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

export default AdminProductTypeTable;