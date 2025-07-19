import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import * as XLSX from 'xlsx';

import { PlusOutlined, FileExcelOutlined, DeleteOutlined, ApartmentOutlined, DownloadOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Dropdown, Modal, message, Popconfirm } from "antd";

// Components
import CreateProductTypeForm from "@/components/form/CreateProductType";
import EditProductTypeForm from "@/components/form/EditProductType";
import AdminProductTypeTable from "@/components/table/AdminProductTypeTable";

// Requests
import { deleteMyProductType, getMyProductTypes, downloadFileTemplateProductType, createMyProductTypeTypeBulk } from "@/request/product-type";

// use zustand
import useStoreApp from "@/store/app";
import useStoreProductType from "@/store/productType";

const ProductTypeManager = () => {
  const { storeCode } = useParams();

  // Ref
  const inputRef = useRef(null);

  // Translation
  const { t } = useTranslation();

  // Zustand store
  const { storeActive, storeActiveIsLoading } = useStoreApp((state) => state);
  const { 
    setProductTypes, setIsLoading, setError,
    setProductTypeIsEditing, setProductTypeIsDeleting 
  } = useStoreProductType();

  // State
  const [productTypeSelected, setProductTypeSelected] = useState([]);
  const [productTypeEdit, setProductTypeEdit] = useState(null);
  
  // Loading states
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [isAddingByExcelLoading, setIsAddingByExcelLoading] = useState(false);
  
  // Modal states
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  
  // Message API
  const [messageApi, contextHolder] = message.useMessage();

  // Actions for CSV button
  const csvBtnAction = [
    {
      key: 'export_data',
      label: t('TXT_EXPORT_DATA'),
      icon: <DownloadOutlined />,
      disabled: true,
      title: t('MSG_FEATURE_COMING_SOON'),
    },
    {
      key: 'download_template',
      label: t('TXT_DOWNLOAD_TEMPLATE'),
      icon: <FileExcelOutlined />,
    }
  ];

  // Fetch data from firebase
  const fetchData = async () => {
    setIsLoading(true);
    try {
      let data = await getMyProductTypes(storeCode);
      if (data) {
        setProductTypes(data);
      } else {
        setError(t('MSG_ERROR_PRODUCT_TYPE_NOT_FOUND'));
      }
    } catch (error) {
      let message = t(error);
      if (message == error) {
        message = t('MSG_ERROR_FETCHING_PRODUCT_TYPES');
      }
      setError(message);
      messageApi.open({
        type: 'error',
        content: message,
        duration: 3,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modal handlers
  const showModalCreate = () => {
    setIsModalCreateOpen(true);
  };

  const handleCreateOk = () => {
    fetchData();
    setIsModalCreateOpen(false);
  };

  const handleCreateCancel = () => {
    setIsModalCreateOpen(false);
  };

  const handleEdit = (productType) => {
    setProductTypeEdit(productType);
    setProductTypeIsEditing(productType.key, true);
    // Open edit modal
    setIsModalEditOpen(true);
  };

  const handleEditOk = () => {
    fetchData();
    setIsModalEditOpen(false);
  };

  const handleEditCancel = () => {
    setProductTypeIsEditing(productTypeEdit.key, false);
    setIsModalEditOpen(false);
  };

  // Delete handlers
  const handleConfirmDeleteSelected = async () => {
    try {
      setIsDeletingLoading(true);

      productTypeSelected.forEach(key => {
        setProductTypeIsDeleting(key, true);
      });
      
      const deletePromises = productTypeSelected.map(key => 
        deleteMyProductType(key)
      );
      
      await Promise.all(deletePromises);
      
      messageApi.open({
        type: 'success',
        content: t('MSG_SUCCESS_DELETE_PRODUCT_TYPES_SELECTED'),
        duration: 3,
      });
      
      setProductTypeSelected([]);
      fetchData();
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: t('MSG_ERROR_DELETE_PRODUCT_TYPE'),
        duration: 3,
      });
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const handleConfirmDeleteItem = async (record) => {
    try {
      setIsDeletingLoading(true);
      setProductTypeIsDeleting(record.key, true);

      await deleteMyProductType(record.key);
      messageApi.open({
        type: 'success',
        content: t('MSG_SUCCESS_DELETE_PRODUCT_TYPE'),
        duration: 3,
      });

      fetchData();
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: t('MSG_ERROR_DELETE_PRODUCT_TYPE'),
        duration: 3,
      });
    } finally {
      setIsDeletingLoading(false);
      setProductTypeIsDeleting(record.key, false);
    }
  };

  // Excel import handler
  const handlerSelectActionsCSV = ({ key }) => {
    switch (key) {
      case 'export_data':
        messageApi.open({
          type: 'info',
          content: t('MSG_EXPORT_DATA_NOT_IMPLEMENTED'),
          duration: 3,
        }); 
        break;
      case 'download_template':
        handlerDownloadTemplate()
        break;
      default:
        messageApi.open({
          type: 'error',
          content: t('MSG_UNKNOWN_ACTION'),
          duration: 3,
        });
    }
  };

  const handleAddByExcel = () => {
    inputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      messageApi.open({
        type: 'error',
        content: t('MSG_ERROR_NO_FILE_SELECTED'),
        duration: 3,
      });
      return;
    }

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

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json(worksheet, {
          header: ['name', 'description'],
          range: 1,
        });

        const requiredFields = ['name'];
        const isValid = json.every(item => 
          requiredFields.every(field => 
            item[field] !== null && item[field] !== undefined && item[field] !== ''
          )
        );

        if (!isValid) {
          messageApi.open({
            type: 'error',
            content: t('MSG_ERROR_INVALID_EXCEL_FORMAT'),
            duration: 3,
          });
          setIsAddingByExcelLoading(false);
          inputRef.current.value = null;
          return;
        }

        const formData = json.map(item => {
          return {
            ...item,
            storeId: storeActive.id, // Ensure store ID is included
          };
        });

        // Process Excel data here - you'll need to implement addProductType function
        await createMyProductTypeTypeBulk(storeCode, formData)
        
        // This is just a placeholder
        messageApi.open({
          type: 'success',
          content: t('MSG_SUCCESS_ADD_PRODUCT_TYPE_BY_EXCEL'),
          duration: 3,
        });

        fetchData();
      } catch (error) {
        messageApi.open({
          type: 'error',
          content: t('MSG_ERROR_PROCESS_EXCEL_FILE'),
          duration: 3,
        });
      } finally {
        setIsAddingByExcelLoading(false);
        inputRef.current.value = null;
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handlerDownloadTemplate = async () => {
    try {
      await downloadFileTemplateProductType();
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: t('MSG_ERROR_DOWNLOAD_TEMPLATE'),
        duration: 3,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [storeActive]);

  if (!storeActive) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-gray-500">{t('MSG_NO_STORE_SELECTED')}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full px-4 pt-4 pb-10">
      <div className="mb-2">
        <Breadcrumb items={[{ title: t('TXT_PRODUCT_TYPES') }, { title: t('TXT_MANAGER') }]} />
      </div>

      <div className="h-full w-full bg-white p-2 rounded-md shadow-sm overflow-hidden">
        {/* Toolbar top */}
        <div className="flex align-items-center justify-between mb-4">
          <div className="flex align-items-center">
            <ApartmentOutlined className="text-2xl text-primary mr-2" />
            <h1 className="text-2xl text-gray-800 font-semibold">{t('TXT_PRODUCT_TYPE_LIST')}</h1>
          </div>
          <div className="flex align-items-center">
            {productTypeSelected && productTypeSelected.length > 0 && (
              <Popconfirm
                placement="bottomRight"
                title={t('TITLE_CONFIRM_DELETE_SELECTED')}
                description={t('CONFIRM_DELETE_PRODUCT_TYPES_SELECTED')}
                onConfirm={handleConfirmDeleteSelected}
                okText={t('TXT_CONFIRM')}
                cancelText={t('TXT_CANCEL')}
              >
                <Button 
                  type="primary" 
                  danger 
                  icon={<DeleteOutlined />} 
                  className="ml-2"
                  disabled={isDeletingLoading || isAddingByExcelLoading}
                  loading={isDeletingLoading}
                >
                  {t('TXT_DELETE_SELECTED')}
                </Button>
              </Popconfirm>
            )}

            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              className="ml-2" 
              onClick={showModalCreate}
              disabled={isAddingByExcelLoading || isDeletingLoading}
            >
              {t('TXT_ADD_NEW')}
            </Button>

            <Dropdown.Button
              className="ml-2"
              loading={isAddingByExcelLoading}
              disabled={isAddingByExcelLoading || isDeletingLoading}
              onClick={handleAddByExcel}
              type="primary"
              menu={{ items: csvBtnAction, onClick: handlerSelectActionsCSV }}
            >
              {t('TXT_ADD_BY_EXCEL')}
            </Dropdown.Button>
          </div>
        </div>

        {/* Table */}
        <AdminProductTypeTable 
          onEdit={handleEdit} 
          onDelete={handleConfirmDeleteItem}
          onSelectionChange={setProductTypeSelected}
        />

        {/* Hidden file input */}
        <input
          type="file"
          ref={inputRef}
          style={{ display: 'none' }}
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />

        {/* Modals */}
        {contextHolder}
        <Modal 
          title={t('TITLE_ADD_PRODUCT_TYPE')} 
          open={isModalCreateOpen} 
          footer={false} 
          onCancel={handleCreateCancel}
        >
          {isModalCreateOpen && (
            <CreateProductTypeForm
              storeId={storeActive._id}
              onCancel={handleCreateCancel}
              onOK={handleCreateOk} 
            />
          )}
        </Modal>

        <Modal 
          title={t('TITLE_EDIT_PRODUCT_TYPE')} 
          open={isModalEditOpen} 
          footer={false} 
          onCancel={handleEditCancel}
        >
          {productTypeEdit && (
            <EditProductTypeForm 
              storeId={storeActive._id}
              productTypeId={productTypeEdit.key} 
              productTypeEdit={productTypeEdit}
              onCancel={handleEditCancel}
              onOK={handleEditOk}
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ProductTypeManager;