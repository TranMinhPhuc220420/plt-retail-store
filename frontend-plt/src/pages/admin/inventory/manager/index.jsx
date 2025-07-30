import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";

// Ant Design
import { FireOutlined, EditOutlined, DeleteOutlined, ShopOutlined } from "@ant-design/icons";
import { Button, Modal, message } from "antd";

// Zustand store
import useWarehouseType from "@/store/warehouse";

// Styles
import styles from "./index.module.scss";

// Components
import CreateWarehouseForm from "@/components/form/CreateWarehouse";
import EditWarehouseForm from "@/components/form/EditWarehouse";
import ConfirmDeleteWarehouse from "@/components/form/ConfirmDeleteWarehouse";

const InventoryManagerPage = () => {
  // Get store code from URL parameters
  const { storeCode } = useParams();

  // Translation
  const { t } = useTranslation();

  // Ant Design message
  const [messageApi, contextHolder] = message.useMessage();

  // Zustand store
  const { warehouses, error, fetchWarehouses } = useWarehouseType();

  // State
  const [isShowModalCreate, setShowModalCreate] = useState(false);
  const [isShowModelEdit, setShowModalEdit] = useState(false);
  const [warehouseEditing, setWarehouseEditing] = useState(null);
  const [isShowModelDelete, setShowModalDelete] = useState(false);
  const [warehouseDeleting, setWarehouseDeleting] = useState(null);

  // Handlers
  const handleCreateOk = () => {
    setShowModalCreate(false);
    fetchWarehouses(storeCode);
  };
  const handleCancelCreate = () => {
    setShowModalCreate(false);
  };
  const handlerCreateOnFail = () => {
    message.error(t('TXT_WAREHOUSE_CREATION_FAILED'));
  };

  const handlerClickEdit = (warehouse) => {
    setWarehouseEditing(warehouse);
    setShowModalEdit(true);
  };
  const handleCancelEdit = () => {
    setShowModalEdit(false);
    setWarehouseEditing(null);
  };
  const handleEditOk = () => {
    setShowModalEdit(false);
    fetchWarehouses(storeCode);
  };
  const handlerEditOnFail = () => {
    message.error(t('TXT_WAREHOUSE_UPDATE_FAILED'));
  };

  const handlerClickDelete = (warehouse) => {
    setWarehouseDeleting(warehouse);
    setShowModalDelete(true);
  };
  const handleCancelDelete = () => {
    setShowModalDelete(false);
    setWarehouseDeleting(null);
  };
  const handleDeleteOk = () => {
    setShowModalDelete(false);
    fetchWarehouses(storeCode);
  };
  const handlerDeleteOnFail = () => {
    message.error(t('TXT_WAREHOUSE_DELETION_FAILED'));
  };

  // Effect
  useEffect(() => {
    fetchWarehouses(storeCode);
  }, []);
  useEffect(() => {
    if (error) {
      let msgError = t(error);
      if (msgError === error) {
        msgError = t('TXT_FAILED_TO_FETCH_WAREHOUSES');
      }

      messageApi.open({
        type: 'error',
        content: msgError,
        duration: 3,
      });
    }
  }, [error]);

  return (
    <div className="p-4">
      {contextHolder}

      {/* Banner */}
      <div className={styles.banner}></div>

      <div className="md:px-2">
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-3 gap-6 mb-10 md:px-4">
            {/* Add New Warehouse Button as the first grid item */}
            <div>
              <div
                className="p-4 bg-white border-blue-500 h-35 rounded-2xl overflow-hidden shadow shadow-blue-500 border-4 hover:bg-gray-100 transition duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center text-amber-500"
                onClick={() => setShowModalCreate(true)}
              >
                <ShopOutlined className="text-5xl mb-2" twoToneColor="#4096ff" />
                <span className="text-lg font-semibold text-gray-700">
                  {t('TXT_ADD_NEW_WAREHOUSE')}
                </span>
              </div>
            </div>
            {/* Warehouse Cards */}
            {warehouses.map((warehouse) => (
              <div key={warehouse._id} className="mb-10">
                <div className="relative p-4 border bg-white border-gray-200 h-35 rounded-2xl shadow text-center hover:bg-gray-100 transition duration-300 ease-in-out">
                  <Link to={`/store/${storeCode}/admin/kho/${warehouse._id}`} className="no-underline">
                    <div className="flex flex-col items-center justify-center h-full">
                      <h3 className="text-lg font-semibold text-gray-800">{warehouse.name}</h3>
                      <p className="line-clamp-2 text-gray-700 min-h-[2.5em] overflow-hidden text-ellipsis">
                        {warehouse.address}
                      </p>
                    </div>
                  </Link>
                  <div className="absolute top-[5px] right-[45px]">
                    <Button
                      shape="circle"
                      color="primary"
                      variant="outlined"
                      icon={<EditOutlined />}
                      onClick={() => handlerClickEdit(warehouse)}
                    />
                  </div>
                  <div className="absolute top-[5px] right-[5px]">
                    <Button
                      // type="primary"
                      color="danger"
                      variant="solid"
                      shape="circle"
                      icon={<DeleteOutlined />}
                      onClick={() => handlerClickDelete(warehouse)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal title={t('TXT_ADD_NEW_WAREHOUSE')} 
        open={isShowModalCreate}
        footer={false}
        onCancel={handleCancelCreate}
      >
        {isShowModalCreate && <CreateWarehouseForm storeCode={storeCode} onCancel={handleCancelCreate} onOK={handleCreateOk} onFail={handlerCreateOnFail} />}
      </Modal>

      <Modal title={t('TXT_EDIT_WAREHOUSE')} 
        open={isShowModelEdit}
        footer={false}
        onCancel={handleCancelEdit}
      >
        {isShowModelEdit && <EditWarehouseForm storeData={warehouseEditing} onCancel={handleCancelEdit} onOK={handleEditOk} onFail={handlerEditOnFail} />}
      </Modal>

      <Modal title={t('TXT_CONFIRM_DELETE_WAREHOUSE')}
        open={isShowModelDelete}
        footer={false}
        onCancel={handleCancelDelete}
      >
        {isShowModelDelete && <ConfirmDeleteWarehouse warehouse={warehouseDeleting} onCancel={handleCancelDelete} onOK={handleDeleteOk} onFail={handlerDeleteOnFail} />}
      </Modal>
    </div>
  );
};

export default InventoryManagerPage;