import React, { useState, useEffect, useRef } from "react";

import * as XLSX from 'xlsx';

import { useTranslation } from "react-i18next";

// Firebase
import { } from "@/database";

import { PlusOutlined, FileExcelOutlined, AuditOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Modal, message, Table, Space, Popconfirm } from "antd";
const { Column, ColumnGroup } = Table;

import { BRANCH_LIST } from "@/constant";

// Components

const RevenueManager = () => {
  // Ref

  // Translation
  const { t } = useTranslation();

  // State
  const [messageApi, contextHolder] = message.useMessage();
  const [dataTable, setDataTable] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
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
    setIsTableLoading(true);
    try {
      // const data = await getEmployeeList();
      // const dataSource = data.map((item, index) => ({
      //   key: item.id,
      //   name: item.name,
      //   branch: BRANCH_LIST[item.branch],
      //   position: item.position,
      //   salary: item.salary,
      // }));
      // setDataTable(dataSource);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsTableLoading(false);
    }
  };

  // Handlers functions

  // Effect
  useEffect(() => {
    // Fetch data here
    fetchData();

    // Set the height of the table
    const handleResize = () => {
      setHeight(window.innerHeight - 300);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="px-4 pt-4 pb-10 w-full">

      <div className="mb-2">
        <Breadcrumb items={[{ title: t('TXT_REVENUE') }]} />
      </div>

      <div className="w-full bg-white p-2 rounded-md shadow-sm overflow-auto">
        {/* Toolbar top */}
        <div className="flex align-items-center justify-between mb-4">
          {/* Left */}
          <div className="flex align-items-center">
            <AuditOutlined className="text-2xl text-primary mr-2" />
            <h1 className="text-2xl font-semibold">{t('TXT_REVENUE_LIST')}</h1>
          </div>
          {/* Right */}
          <div className="flex align-items-center">
            <Button type="primary" icon={<PlusOutlined />} className="ml-2"
            >
              {t('TXT_ADD_NEW')}
            </Button>

            <Button type="primary" icon={<FileExcelOutlined />} className="ml-2"
            >
              {t('TXT_ADD_BY_EXCEL')}
            </Button>
          </div>
        </div>

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

        {/* Modal */}
        {contextHolder}

        {/* Test */}

      </div>
    </div>
  );
};

export default RevenueManager;