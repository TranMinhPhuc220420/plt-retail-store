import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import * as XLSX from 'xlsx';

import { PlusOutlined, FileExcelOutlined, DeleteOutlined, ShoppingOutlined, DownloadOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Dropdown, Modal, message, Popconfirm } from "antd";

// Components
import CreateProductForm from "@/components/form/CreateProduct";
import EditProductForm from "@/components/form/EditProduct";
import AdminProductTable from "@/components/table/AdminProductTable";

// Requests
import { deleteMyProduct, getMyProducts, downloadFileTemplateProduct, createMyProductTypeBulk } from "@/request/product";

// use zustand
import useStoreApp from "@/store/app";
import useStoreProduct from "@/store/product";

// Constants
import { SERVER_URL } from "@/constant";

const ProductManagerPage = () => {
  const { storeCode } = useParams();

  // Ref
  const inputRef = useRef(null);

  // Translation
  const { t } = useTranslation();

  // Zustand store
  const { storeActive, storeActiveIsLoading } = useStoreApp((state) => state);
  const {
    fetchProducts,
    setProducts, setIsLoading, setError,
    setProductIsEditing, setProductIsDeleting 
  } = useStoreProduct();

  // State
  const [productSelected, setProductSelected] = useState([]);
  const [productEdit, setProductEdit] = useState(null);
  
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

  // Modal handlers
  const showModalCreate = () => {
    setIsModalCreateOpen(true);
  };

  const handleCreateOk = () => {
    fetchProducts(storeCode);
    setIsModalCreateOpen(false);
  };

  const handleCreateCancel = () => {
    setIsModalCreateOpen(false);
  };

  const handleCreateFail = () => {
    // Handle create failure if needed
  };

  const handleEdit = (product) => {
    setProductEdit(product);
    setProductIsEditing(product.key, true);
    setIsModalEditOpen(true);
  };

  const handleEditOk = () => {
    fetchProducts(storeCode);
    setIsModalEditOpen(false);
  };

  const handleEditCancel = () => {
    setProductIsEditing(productEdit.key, false);
    setIsModalEditOpen(false);
  };

  const handleEditFail = () => {
    // Handle edit failure if needed
  };

  // Delete handlers
  const handleConfirmDeleteSelected = async () => {
    try {
      setIsDeletingLoading(true);

      productSelected.forEach(key => {
        setProductIsDeleting(key, true);
      });
      
      const deletePromises = productSelected.map(key => 
        deleteMyProduct(key)
      );
      
      await Promise.all(deletePromises);
      
      messageApi.open({
        type: 'success',
        content: t('MSG_SUCCESS_DELETE_PRODUCTS_SELECTED'),
        duration: 3,
      });
      
      setProductSelected([]);
      fetchProducts(storeCode);
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: t('MSG_ERROR_DELETE_PRODUCT'),
        duration: 3,
      });
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const handleConfirmDeleteItem = async (record) => {
    try {
      setIsDeletingLoading(true);
      setProductIsDeleting(record.key, true);

      await deleteMyProduct(record.key);
      messageApi.open({
        type: 'success',
        content: t('MSG_SUCCESS_DELETE_PRODUCT'),
        duration: 3,
      });

      fetchProducts(storeCode);
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: t('MSG_ERROR_DELETE_PRODUCT'),
        duration: 3,
      });
    } finally {
      setIsDeletingLoading(false);
      setProductIsDeleting(record.key, false);
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
          header: ['productCode', 'name', 'description', 'price', 'retailPrice', 'wholesalePrice', 'costPrice', 'stock', 'minStock', 'unit', 'status'],
          range: 1,
        });

        const requiredFields = ['productCode', 'name', 'price', 'retailPrice', 'wholesalePrice', 'costPrice', 'stock', 'minStock', 'unit', 'status'];
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
            storeId: storeActive.id,
            productCode: item.productCode ? item.productCode.toUpperCase() : '',
            price: parseFloat(item.price),
            retailPrice: parseFloat(item.retailPrice),
            wholesalePrice: parseFloat(item.wholesalePrice),
            costPrice: parseFloat(item.costPrice),
            stock: parseInt(item.stock),
            minStock: parseInt(item.minStock),
          };
        });

        await createMyProductTypeBulk(storeCode, formData);
        
        messageApi.open({
          type: 'success',
          content: t('MSG_SUCCESS_ADD_PRODUCT_BY_EXCEL'),
          duration: 3,
        });

        fetchProducts(storeCode);
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
      await downloadFileTemplateProduct();
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: t('MSG_ERROR_DOWNLOAD_TEMPLATE'),
        duration: 3,
      });
    }
  };

  useEffect(() => {
    fetchProducts(storeCode);
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
        <Breadcrumb items={[{ title: t('TXT_PRODUCTS') }, { title: t('TXT_MANAGER') }]} />
      </div>

      <div className="h-full w-full bg-white p-2 rounded-md shadow-sm overflow-hidden">
        {/* Toolbar top */}
        <div className="flex align-items-center justify-between mb-4">
          <div className="flex align-items-center">
            <ShoppingOutlined className="text-2xl text-primary mr-2" />
            <h1 className="text-2xl text-gray-800 font-semibold">{t('TXT_PRODUCT_LIST')}</h1>
          </div>
          <div className="flex align-items-center">
            {productSelected && productSelected.length > 0 && (
              <Popconfirm
                placement="bottomRight"
                title={t('TITLE_CONFIRM_DELETE_SELECTED')}
                description={t('CONFIRM_DELETE_PRODUCTS_SELECTED')}
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
        <AdminProductTable
          storeCode={storeCode}
          onEdit={handleEdit} 
          onDelete={handleConfirmDeleteItem}
          onSelectionChange={setProductSelected}
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
          title={t('TITLE_ADD_PRODUCT')} 
          open={isModalCreateOpen} 
          footer={false} 
          onCancel={handleCreateCancel}
        >
          {isModalCreateOpen && (
            <CreateProductForm
              storeId={storeActive._id}
              storeCode={storeCode}
              onCancel={handleCreateCancel}
              onOK={handleCreateOk}
              onFail={handleCreateFail}
            />
          )}
        </Modal>

        <Modal 
          title={t('TITLE_EDIT_PRODUCT')} 
          open={isModalEditOpen} 
          footer={false} 
          onCancel={handleEditCancel}
        >
          {productEdit && (
            <EditProductForm 
              productData={productEdit}
              onCancel={handleEditCancel}
              onOK={handleEditOk}
              onFail={handleEditFail}
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ProductManagerPage;