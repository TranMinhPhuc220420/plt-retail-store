import React, { useState, useEffect, useRef } from "react";

import * as XLSX from 'xlsx';

import { useTranslation } from "react-i18next";

// Firebase
import { getEmployeeList, deleteEmployee, addEmployee } from "@/database";

import { PlusOutlined, FileExcelOutlined, TeamOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Modal, message, Table, Space, Popconfirm } from "antd";
const { Column, ColumnGroup } = Table;

import { BRANCH_LIST } from "@/constant";

// Components
import AddEmployeeForm from "@/components/form/AddEmployee";
import EditEmployeeForm from "@/components/form/EditEmployee";

const ProductManager = () => {
  // Ref
  const inputRef = useRef(null);

  // Translation
  const { t } = useTranslation();

  // State
  const [height, setHeight] = useState(window.innerHeight - 300);
  const [employeeList, setEmployeeList] = useState([]);
  const [employeeListLoading, setEmployeeListLoading] = useState(true);
  const [idEmployeeDeleting, setIdEmployeeDeleting] = useState(null);
  const [idEmployeeEditing, setIdEmployeeEditing] = useState(null);

  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [isAddingByExcelLoading, setIsAddingByExcelLoading] = useState(false);

  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [employeeEdit, setEmployeeEdit] = useState(null);

  const [employeeSelected, setEmployeeSelected] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Columns for the table
  const columns = [
    {
      title: t('LABEL_NAME'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('LABEL_BRANCH'),
      dataIndex: 'branch_display',
      key: 'branch',
      onFilter: (value, record) => record.branch_display.startsWith(value),
      filters: BRANCH_LIST.map((branch) => ({
        text: branch.name,
        value: branch.name,
      })),
    },
    {
      title: t('LABEL_POSITION'),
      dataIndex: 'position_display',
      key: 'position',
    },
    {
      title: t('LABEL_LEVEL'),
      dataIndex: 'level_display',
      key: 'level',
    },
    {
      title: t('LABEL_SALARY'),
      dataIndex: 'salary_display',
      key: 'salary',
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);

      setEmployeeSelected(selectedRows);
    },
    getCheckboxProps: record => ({
      disabled: record.name === 'Disabled User', // Column configuration not to be checked
      name: record.name,
    }),
  };

  // Fetch data from firebase
  const fetchEmployeeList = async () => {
    setEmployeeListLoading(true);
    const employeeList = await getEmployeeList();
    if (employeeList) {
      setEmployeeList(employeeList);
    }
    else {
      setEmployeeList([]);
    }

    setEmployeeListLoading(false);
  };

  // Handlers functions
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    messageApi.open({
      type: 'success',
      content: t('MSG_SUCCESS_ADD_EMPLOYEE'),
      duration: 3,
    });

    // Fetch data again
    fetchEmployeeList();

    setIsModalOpen(false);
  }
  const handlerOnFail = () => {
    messageApi.open({
      type: 'error',
      content: t('MSG_ERROR_ADD_EMPLOYEE'),
      duration: 3,
    });
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const handlerConfirmDelete = async (employee) => {
    // Call the delete function here
    console.log("Delete employee with id: ", employee);

    const { key } = employee;
    setIdEmployeeDeleting(key);

    await deleteEmployee(key);
    messageApi.open({
      type: 'success',
      content: t('MSG_SUCCESS_DELETE_EMPLOYEE'),
      duration: 3,
    });

    // Fetch data again
    fetchEmployeeList();

    setIdEmployeeDeleting(false);
  }
  const handlerConfirmDeleteSelected = async () => {
    // Call the delete function here
    console.log("Delete employee with id: ", employeeSelected);
    setIsDeletingLoading(true);
    setEmployeeListLoading(true);

    let countDeleted = 0;
    const checkDone = () => {
      countDeleted++;
      if (countDeleted === employeeSelected.length) {
        messageApi.open({
          type: 'success',
          content: t('MSG_SUCCESS_DELETE_EMPLOYEES_SELECTED'),
          duration: 3,
        });
        setIsDeletingLoading(false);
        fetchEmployeeList();

        // Clear the selected employees
        setEmployeeSelected([]);

        setEmployeeListLoading(false);
      }
    };

    employeeSelected.forEach(async (employee) => {
      const { key } = employee;
      setIdEmployeeDeleting(key);
      await deleteEmployee(key);
      checkDone();
    });

    setIdEmployeeDeleting(false);
  };

  const handleEdit = (employee) => {
    // Call the edit function here
    console.log("Edit employee with id: ", employee);

    const { key } = employee;
    setIdEmployeeEditing(key);

    setEmployeeEdit(employee);
    setIsModalEditOpen(true);
  }
  const handleEditOk = () => {
    messageApi.open({
      type: 'success',
      content: t('MSG_SUCCESS_UPDATE_EMPLOYEE'),
      duration: 3,
    });

    // Fetch data again
    fetchEmployeeList();

    setIsModalEditOpen(false);
    setIdEmployeeEditing(false);
  };
  const handleEditFail = () => {
    messageApi.open({
      type: 'error',
      content: t('MSG_ERROR_UPDATE_EMPLOYEE'),
      duration: 3,
    });

    // Fetch data again
    fetchEmployeeList();

    setIsModalEditOpen(false);
    setIdEmployeeEditing(false);
  };
  const handleEditCancel = () => {
    setIsModalEditOpen(false);
    setIdEmployeeEditing(false);
  };

  const handleAddByExcel = () => {
    // Open the file input dialog
    inputRef.current.click();
  };
  const handlerOnChangeFile = (e) => {
    const file = e.target.files[0];

    // Check if the file is selected
    if (!file) {
      messageApi.open({
        type: 'error',
        content: t('MSG_ERROR_NO_FILE_SELECTED'),
        duration: 3,
      });
      return;
    }
    // Check if the file is a valid Excel or CSV file
    const validFileTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validFileTypes.includes(file.type)) {
      messageApi.open({
        type: 'error',
        content: t('MSG_ERROR_FILE_TYPE'),
        duration: 3,
      });
      return;
    }

    setIsAddingByExcelLoading(true);

    // Read the file and convert it to JSON
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const json = XLSX.utils.sheet_to_json(worksheet, {
        header: ['ten', 'chi_nhanh', 'chuc_vu', 'cap_bac', 'luong'],
        range: 1, // skip the first row if it has actual headers
      });

      // Check each item in the JSON array make sure it has all the required fields
      const requiredFields = ['ten', 'chi_nhanh', 'chuc_vu', 'cap_bac', 'luong'];
      const isValid = json.every(item => {
        return requiredFields.every(field => {
          return item[field] !== null && item[field] !== undefined && item[field] !== '';
        });
      });
      if (!isValid) {
        messageApi.open({
          type: 'error',
          content: t('MSG_ERROR_FILE_TYPE'),
          duration: 3,
        });
        setIsAddingByExcelLoading(false);
        // Clear the input file
        inputRef.current.value = null;
        return;
      }

      let countAdded = 0;
      const checkDone = () => {
        countAdded++;
        if (countAdded === json.length) {
          messageApi.open({
            type: 'success',
            content: t('MSG_SUCCESS_ADD_EMPLOYEE'),
            duration: 3,
          });

          setIsAddingByExcelLoading(false);
          fetchEmployeeList();

          // Clear the input file
          inputRef.current.value = null;
        }
      };

      json.forEach(async (item) => {
        let data = {
          name: item.ten,
          branch: item.chi_nhanh,
          position: item.chuc_vu,
          level: item.cap_bac,
          salary: item.luong,
        }

        // Call the add function here
        await addEmployee(data);

        checkDone();
      });
    };

    reader.readAsArrayBuffer(file);
  }

  // Effect
  useEffect(() => {
    // Fetch data here
    fetchEmployeeList();

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
        <Breadcrumb items={[{ title: t('TXT_EMPLOYEE') }, { title: t('TXT_MANAGER') }]} />
      </div>

      <div className="w-full bg-white p-2 rounded-md shadow-sm overflow-auto">
        {/* Toolbar top */}
        <div className="flex align-items-center justify-between mb-4">
          {/* Left */}
          <div className="flex align-items-center">
            <TeamOutlined className="text-2xl text-primary mr-2" />
            <h1 className="text-2xl font-semibold">{t('TXT_EMPLOYEE_LIST')}</h1>
          </div>
          {/* Right */}
          <div className="flex align-items-center">

            {employeeSelected && employeeSelected.length > 0 && (
              <Popconfirm
                placement="bottomRight"
                title={t('TITLE_CONFIRM_DELETE_SELECTED')}
                description={t('CONFIRM_DELETE_EMPLOYEES_SELECTED')}
                onConfirm={handlerConfirmDeleteSelected}
                okText={t('TXT_CONFIRM')}
                cancelText={t('TXT_CANCEL')}
              >
                <Button type="primary" danger icon={<DeleteOutlined />} className="ml-2"
                  disabled={isDeletingLoading || isAddingByExcelLoading}
                  loading={isDeletingLoading}
                >
                  {t('TXT_DELETE_SELECTED')}
                </Button>
              </Popconfirm>
            )}

            <Button type="primary" icon={<PlusOutlined />} className="ml-2" onClick={showModal}
              disabled={isAddingByExcelLoading || isDeletingLoading}
            >
              {t('TXT_ADD_NEW')}
            </Button>

            <Button type="primary" icon={<FileExcelOutlined />} className="ml-2" onClick={handleAddByExcel}
              loading={isAddingByExcelLoading} disabled={isAddingByExcelLoading || isDeletingLoading}
            >
              {t('TXT_ADD_BY_EXCEL')}
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table dataSource={employeeList} loading={employeeListLoading}
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
          <Column title="Hành động" key="action" render={(_, record) => (
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
        <Modal title={t('TITLE_ADD_EMPLOYEE')} open={isModalOpen} footer={false} onCancel={handleCancel} >
          {isModalOpen && <AddEmployeeForm onCancel={handleCancel} onOK={handleOk} onFail={handlerOnFail} />}
        </Modal>
        <Modal title={t('TITLE_EDIT_EMPLOYEE')} open={isModalEditOpen} footer={false} onCancel={handleEditCancel}>
          {employeeEdit && <EditEmployeeForm employeeId={employeeEdit.key} employeeEdit={employeeEdit}
            onCancel={handleEditCancel}
            onOK={handleEditOk}
            onFail={handleEditFail}
          />}
        </Modal>

        {/* Input update file csv or excel */}
        <input type="file" ref={inputRef} hidden
          accept="application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handlerOnChangeFile} />

        {/* Test */}

      </div>
    </div>
  );
};

export default ProductManager;