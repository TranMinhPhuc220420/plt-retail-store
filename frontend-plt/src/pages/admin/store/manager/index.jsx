import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

// Ant Design
import Icon, { FireOutlined, DeleteOutlined, EditOutlined, FireFilled } from "@ant-design/icons";
import { Button, Modal, message, Table, Space, Popconfirm, Row, Col } from "antd";
const { Column } = Table;

// Zustand store
import useStoreStore from "@/store/store";

// Firebase
import { getEmployeeList, deleteEmployee, addEmployee } from "@/database";

// Third-party libraries

// Constants
import { BASE_URL } from "@/constant";

// Request
import { getMyStores } from "@/request/store";

// Styles
import styles from "./index.module.scss";

// Components
import CreateStoreForm from "@/components/form/CreateStore";
import EditStoreForm from "@/components/form/EditStore";

const StoreManagerPage = () => {
  // Translation
  const { t } = useTranslation();

  // Ant Design message
  const [messageApi, contextHolder] = message.useMessage();

  // Zustand store
  const { stores, setStores } = useStoreStore();

  // State
  const [height, setHeight] = useState(window.innerHeight - 300);
  const [isShowModalCreate, setShowModalCreate] = useState(false);
  const [isShowModelEdit, setShowModalEdit] = useState(false);
  const [storeEditing, setStoreEditing] = useState(null);
  const [isLoadingData, setLoadingData] = useState(false);

  // Fetch data from firebase
  const fetchData = async () => {
    setLoadingData(true);

    const data = await getMyStores();
    if (data) {
      setStores(data);
    }

    setLoadingData(false);
  };

  const eventWindowResize = () => {
    // Set the height of the table
    const handleResize = () => {
      setHeight(window.innerHeight - 300);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  // Handlers
  const handleCreateOk = () => {
    setShowModalCreate(false);
    messageApi.success(t('TXT_STORE_ADDED'));
    fetchData();
  };
  const handleCancelCreate = () => {
    setShowModalCreate(false);
  };
  const handlerCreateOnFail = () => {
    messageApi.error(t('TXT_STORE_CREATION_FAILED'));
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
    messageApi.success(t('TXT_STORE_UPDATED_SUCCESS'));
    fetchData();
  };
  const handlerEditOnFail = () => {
    messageApi.error(t('TXT_STORE_UPDATE_FAILED'));
  };

  // Effect
  useEffect(() => {
    fetchData();
  }, []);

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
              <div key={store.id} className="mb-10">
                <div className="relative p-4 border bg-white border-gray-200 h-50 rounded-2xl shadow text-center">
                  <div className="flex flex-col items-center justify-center h-full">
                    <img
                      className="h-15 w-15 object-cover rounded-lg mb-4"
                      src={`${BASE_URL}${store.imageUrl}`}
                      alt={store.name}
                    />
                    <h3 className="text-lg font-semibold">{store.name}</h3>
                    <p className="line-clamp-2 min-h-[2.5em] overflow-hidden text-ellipsis">
                      {store.address}
                    </p>
                  </div>
                  <div className="absolute -top-2.5 -right-2.5"></div>
                  <div className="absolute top-[-10px] right-[-10px]">
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<EditOutlined />}
                      onClick={() => handlerClickEdit(store)}
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
    </div>
  );
};

export default StoreManagerPage;