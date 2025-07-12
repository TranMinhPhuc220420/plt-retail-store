import React, { useState, useEffect, useRef } from "react";

import * as XLSX from 'xlsx';

import { useTranslation } from "react-i18next";

// Firebase
import { } from "@/database";

import { PlusOutlined, FileExcelOutlined, AuditOutlined, DeleteOutlined, EditOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Modal, message, Table, Space, Popconfirm, Row, Col } from "antd";
const { Column, ColumnGroup } = Table;

import { BRANCH_LIST } from "@/constant";

// Components

const SellManagerPage = () => {
  // Ref

  // Translation
  const { t } = useTranslation();

  // State
  const [messageApi, contextHolder] = message.useMessage();
  const [dataTable, setDataTable] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [height, setHeight] = useState(window.innerHeight - 300);

  // Columns for the table
  const columns = [
    {
      title: t('LABEL_NAME'),
      dataIndex: 'name',
      key: 'name',
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    },
    getCheckboxProps: record => ({
      disabled: record.name === 'Disabled User', // Column configuration not to be checked
      name: record.name,
    }),
  };

  // Fetch data from firebase
  const fetchData = async () => {
  };

  // Handlers functions

  // Effect
  useEffect(() => {
  }, []);

  return (
    <div className="px-4 pt-4 pb-10 h-full w-full flex flex-col justify-between">
      {/* Modal */}
      {contextHolder}

      <div className="w-full bg-white p-2 rounded-md shadow-sm">
        {/* Toolbar top */}
        <div className="flex align-items-center justify-between">
          {/* Left */}
          <div className="flex align-items-center">
            <ShoppingCartOutlined className="text-2xl text-primary mr-2" />
            <h1 className="text-2xl font-semibold">{t('TXT_SELL')}</h1>
          </div>
          {/* Right */}
          <div className="flex align-items-center">
            <Button type="primary" icon={<PlusOutlined />} className="ml-2"
            >
              {t('TXT_ADD_NEW')}
            </Button>
          </div>
        </div>
      </div>

      <Row className="h-full mt-2">
        {/* Panel left */}
        <Col md={18} className="h-full">
          <div className="h-full bg-white rounded-md shadow-sm mr-3">
            {/* Table */}
            <Table dataSource={dataTable} loading={isTableLoading}
              scroll={{ y: height, x: true }}
              rowSelection={Object.assign({ type: 'checkbox' }, rowSelection)}
            >
              {columns.map((column) => (
                <Column
                  title={column.title}
                  dataIndex={column.dataIndex}
                  key={column.key}
                  filters={column.filters}
                  onFilter={column.onFilter}
                />
              ))}
              <Column title="Action" key="action" render={(_, record) => (
                <Space size="middle">
                  <Button type="primary" icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                    loading={idEmployeeEditing === record.key}
                    disabled={idEmployeeDeleting === record.key || idEmployeeEditing === record.key}
                  >
                    {t('TXT_EDIT')}
                  </Button>

                  <Popconfirm
                    title={t('TITLE_CONFIRM_DELETE')}
                    description={t('CONFIRM_DELETE_EMPLOYEE')}
                    onConfirm={() => handlerConfirmDelete(record)}
                    okText={t('TXT_CONFIRM')}
                    cancelText={t('TXT_CANCEL')}
                  >
                    <Button type="primary" icon={<DeleteOutlined />} danger
                      loading={idEmployeeDeleting === record.key}
                      disabled={idEmployeeDeleting === record.key || idEmployeeEditing === record.key}
                    >
                      {t('TXT_DELETE')}
                    </Button>
                  </Popconfirm>

                </Space>
              )}
              />
            </Table>
          </div>
        </Col>

        {/* Panel right */}
        <Col md={6} className="col-6 bg-white rounded-md shadow-sm">
          <div className="h-full flex flex-col justify-center items-center">
            <h1>Tổng hóa đơn</h1>
          </div>
        </Col>
      </Row>

    </div>
  );
};

export default SellManagerPage;