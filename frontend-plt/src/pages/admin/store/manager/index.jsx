import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

// Ant Design
import { FireOutlined,EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Modal, message } from "antd";

// Zustand store
import useStoreStore from "@/store/store";

// Third-party libraries

// Constants

// Request

// Styles
import styles from "./index.module.scss";

// Components
import CreateStoreForm from "@/components/form/CreateStore";
import EditStoreForm from "@/components/form/EditStore";
import ConfirmDeleteStore from "@/components/form/ConfirmDeleteStore";

const StoreManagerPage = () => {
  // Translation
  const { t } = useTranslation();

  // Ant Design message
  const [messageApi, contextHolder] = message.useMessage();

  // Zustand store
  const { stores, error, fetchStores } = useStoreStore();

  // State
  const [height, setHeight] = useState(window.innerHeight - 300);
  const [isShowModalCreate, setShowModalCreate] = useState(false);
  const [isShowModelEdit, setShowModalEdit] = useState(false);
  const [isShowModelDelete, setShowModalDelete] = useState(false);
  const [storeEditing, setStoreEditing] = useState(null);
  const [storeDeleting, setStoreDeleting] = useState(null);

  // Handlers
  const handleCreateOk = () => {
    setShowModalCreate(false);
    fetchStores();
  };
  const handleCancelCreate = () => {
    setShowModalCreate(false);
  };
  const handlerCreateOnFail = () => {
  };

  const handlerClickEdit = (store) => {
    setStoreEditing(store);
    setShowModalEdit(true);
  };
  const handleCancelEdit = () => {
    setShowModalEdit(false);
    setStoreEditing(null);
  };
  const handleEditOk = () => {
    setShowModalEdit(false);
    fetchStores();
  };
  const handlerEditOnFail = () => {
  };

  const handlerClickDelete = (store) => {
    setStoreDeleting(store);
    setShowModalDelete(true);
  };
  const handleCancelDelete = () => {
    setShowModalDelete(false);
    setStoreDeleting(null);
  };
  const handleDeleteOk = () => {
    setShowModalDelete(false);
    fetchStores();
  };
  const handlerDeleteOnFail = () => {
  };

  // Effect
  useEffect(() => {
    fetchStores();
  }, []);
  useEffect(() => {
    if (error) {
      let msgError = t(error);
      if (msgError === error) {
        msgError = t('TXT_FAILED_TO_FETCH_STORES');
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

      <div className="md:px-12 md:mx-25">
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10 md:px-4">
            {/* Add New Store Button as the first grid item */}
            <div>
              <div
                className="p-4 bg-white border-blue-500 h-50 rounded-2xl overflow-hidden shadow shadow-blue-500 border-4 hover:bg-gray-100 transition duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center text-amber-500"
                onClick={() => setShowModalCreate(true)}
              >
                <FireOutlined className="text-5xl mb-2" twoToneColor="#4096ff" />
                <span className="text-lg font-semibold text-gray-700">
                  {t('TXT_ADD_NEW_STORE')}
                </span>
              </div>
            </div>
            {/* Store Cards */}
            {stores.map((store) => (
              <div key={store._id} className="mb-10">
                  <div className="relative p-4 border bg-white border-gray-200 h-50 rounded-2xl shadow text-center hover:bg-gray-100 transition duration-300 ease-in-out">
                    <Link to={`/store/${store.storeCode}/admin`} className="no-underline">
                      <div className="flex flex-col items-center justify-center h-full">
                        <img
                          className="h-15 w-15 object-cover rounded-lg mb-4"
                          src={`${store.imageUrl}`}
                          alt={store.name}
                        />
                        <h3 className="text-lg font-semibold text-gray-800">{store.name}</h3>
                        <p className="line-clamp-2 text-gray-700 min-h-[2.5em] overflow-hidden text-ellipsis">
                          {store.address}
                        </p>
                      </div>
                    </Link>
                    <div className="absolute -top-2.5 -right-2.5"></div>
                    <div className="absolute top-[5px] right-[45px]">
                      <Button
                        shape="circle"
                        color="primary"
                        variant="outlined"
                        icon={<EditOutlined />}
                        onClick={() => handlerClickEdit(store)}
                      />
                    </div>
                    <div className="absolute top-[5px] right-[5px]">
                      <Button
                        // type="primary"
                        color="danger"
                        variant="solid"
                        shape="circle"
                        icon={<DeleteOutlined />}
                        onClick={() => handlerClickDelete(store)}
                      />
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal title={t('TXT_ADD_NEW_STORE')} 
        open={isShowModalCreate}
        footer={false}
        onCancel={handleCancelCreate}
      >
        {isShowModalCreate && <CreateStoreForm onCancel={handleCancelCreate} onOK={handleCreateOk} onFail={handlerCreateOnFail} />}
      </Modal>

      <Modal title={t('TXT_EDIT_STORE')} 
        open={isShowModelEdit}
        footer={false}
        onCancel={handleCancelEdit}
      >
        {isShowModelEdit && <EditStoreForm storeData={storeEditing} onCancel={handleCancelEdit} onOK={handleEditOk} onFail={handlerEditOnFail} />}
      </Modal>

      <Modal title={t('TXT_CONFIRM_DELETE_STORE')}
        open={isShowModelDelete}
        footer={false}
        onCancel={handleCancelDelete}
      >
        {isShowModelDelete && <ConfirmDeleteStore store={storeDeleting} onCancel={handleCancelDelete} onOK={handleDeleteOk} onFail={handlerDeleteOnFail} />}
      </Modal>
    </div>
  );
};

export default StoreManagerPage;