import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";

import { 
  PlusOutlined, 
  DeleteOutlined, 
  ShoppingOutlined,
  ExperimentOutlined,
  FireOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import { 
  Breadcrumb, 
  Button, 
  Modal, 
  message, 
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Badge
} from "antd";

// Components
import CreateCompositeProductForm from "@/components/form/CreateCompositeProduct";
import EditCompositeProductForm from "@/components/form/EditCompositeProduct";
import CompositeProductTable from "@/components/table/CompositeProductTable";
import PrepareCompositeModal from "@/components/modal/PrepareCompositeModal";
import ServeCompositeModal from "@/components/modal/ServeCompositeModal";
import CompositeHistoryModal from "@/components/modal/CompositeHistoryModal";

// Requests
import { deleteCompositeProduct } from "@/request/compositeProduct";

// Stores
import useStoreApp from "@/store/app";
import useCompositeProductStore from "@/store/compositeProduct";

const CompositeProductManagerPage = () => {
  const { storeCode } = useParams();

  // Translation
  const { t } = useTranslation();

  // Zustand store
  const { storeActive } = useStoreApp((state) => state);
  const {
    compositeProducts,
    isLoading,
    fetchCompositeProducts,
    removeCompositeProduct,
    setDeletingProduct,
    isProductDeleting
  } = useCompositeProductStore();

  // State
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productEdit, setProductEdit] = useState(null);
  const [productToPrepare, setProductToPrepare] = useState(null);
  const [productToServe, setProductToServe] = useState(null);
  const [productHistory, setProductHistory] = useState(null);
  
  // Loading states
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  
  // Modal states
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [isModalPrepareOpen, setIsModalPrepareOpen] = useState(false);
  const [isModalServeOpen, setIsModalServeOpen] = useState(false);
  const [isModalHistoryOpen, setIsModalHistoryOpen] = useState(false);
  
  // Message API
  const [messageApi, contextHolder] = message.useMessage();

  // Statistics calculation
  const getStatistics = () => {
    const total = compositeProducts.length;
    const active = compositeProducts.filter(p => p.compositeInfo.currentStock > 0).length;
    const expired = compositeProducts.filter(p => {
      if (!p.statusInfo) return false;
      return p.statusInfo.status === 'expired';
    }).length;
    const expiringSoon = compositeProducts.filter(p => {
      if (!p.statusInfo) return false;
      return p.statusInfo.status === 'expiring_soon';
    }).length;
    const totalStock = compositeProducts.reduce((sum, p) => sum + p.compositeInfo.currentStock, 0);

    return { total, active, expired, expiringSoon, totalStock };
  };

  const stats = getStatistics();

  // Modal handlers
  const showModalCreate = () => {
    setIsModalCreateOpen(true);
  };

  const handleCreateOk = () => {
    fetchCompositeProducts(storeCode);
    setIsModalCreateOpen(false);
  };

  const handleCreateCancel = () => {
    setIsModalCreateOpen(false);
  };

  const handleEdit = (product) => {
    setProductEdit(product);
    setIsModalEditOpen(true);
  };

  const handleEditOk = () => {
    fetchCompositeProducts(storeCode);
    setIsModalEditOpen(false);
  };

  const handleEditCancel = () => {
    setIsModalEditOpen(false);
    setProductEdit(null);
  };

  // Prepare handlers
  const handlePrepare = (product) => {
    setProductToPrepare(product);
    setIsModalPrepareOpen(true);
  };

  const handlePrepareOk = () => {
    fetchCompositeProducts(storeCode);
    setIsModalPrepareOpen(false);
    setProductToPrepare(null);
  };

  const handlePrepareCancel = () => {
    setIsModalPrepareOpen(false);
    setProductToPrepare(null);
  };

  // Serve handlers
  const handleServe = (product) => {
    setProductToServe(product);
    setIsModalServeOpen(true);
  };

  const handleServeOk = () => {
    fetchCompositeProducts(storeCode);
    setIsModalServeOpen(false);
    setProductToServe(null);
  };

  const handleServeCancel = () => {
    setIsModalServeOpen(false);
    setProductToServe(null);
  };

  // History handlers
  const handleViewHistory = (product) => {
    setProductHistory(product);
    setIsModalHistoryOpen(true);
  };

  const handleHistoryClose = () => {
    setIsModalHistoryOpen(false);
    setProductHistory(null);
  };

  // Delete handlers
  const handleConfirmDeleteSelected = async () => {
    try {
      setIsDeletingLoading(true);

      selectedProducts.forEach(id => {
        setDeletingProduct(id, true);
      });
      
      const deletePromises = selectedProducts.map(id => 
        deleteCompositeProduct(id)
      );
      
      await Promise.all(deletePromises);
      
      messageApi.open({
        type: 'success',
        content: t('MSG_SUCCESS_DELETE_COMPOSITE_PRODUCTS_SELECTED'),
        duration: 3,
      });
      
      selectedProducts.forEach(id => {
        removeCompositeProduct(id);
      });
      
      setSelectedProducts([]);
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: t('MSG_ERROR_DELETE_COMPOSITE_PRODUCT'),
        duration: 3,
      });
    } finally {
      setIsDeletingLoading(false);
      selectedProducts.forEach(id => {
        setDeletingProduct(id, false);
      });
    }
  };

  const handleConfirmDeleteItem = async (record) => {
    try {
      setDeletingProduct(record._id, true);

      await deleteCompositeProduct(record._id);
      messageApi.open({
        type: 'success',
        content: t('MSG_SUCCESS_DELETE_COMPOSITE_PRODUCT'),
        duration: 3,
      });

      removeCompositeProduct(record._id);
    } catch (error) {
      messageApi.open({
        type: 'error',
        content: t('MSG_ERROR_DELETE_COMPOSITE_PRODUCT'),
        duration: 3,
      });
    } finally {
      setDeletingProduct(record._id, false);
    }
  };

  useEffect(() => {
    if (storeActive) {
      fetchCompositeProducts(storeCode);
    }
  }, [storeActive, storeCode]);

  if (!storeActive) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-gray-500">{t('MSG_NO_STORE_SELECTED')}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <div className="h-full w-full bg-white p-2 rounded-md shadow-sm overflow-hidden">
        {/* Statistics Cards */}
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Card>
              <Statistic
                title={t('TXT_TOTAL_COMPOSITE_PRODUCTS')}
                value={stats.total}
                prefix={<ExperimentOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('TXT_ACTIVE_PRODUCTS')}
                value={stats.active}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('TXT_EXPIRING_SOON')}
                value={stats.expiringSoon}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('TXT_TOTAL_STOCK')}
                value={stats.totalStock}
                prefix={<ShoppingOutlined />}
                suffix={t('TXT_SERVINGS')}
              />
            </Card>
          </Col>
        </Row>

        {/* Toolbar top */}
        <div className="flex align-items-center justify-between mb-4">
          <div className="flex align-items-center">
            <ExperimentOutlined className="text-2xl text-primary mr-2" />
            <h1 className="text-2xl text-gray-800 font-semibold">
              {t('TXT_COMPOSITE_PRODUCT_LIST')}
            </h1>
          </div>
          <div className="flex align-items-center">
            {selectedProducts && selectedProducts.length > 0 && (
              <Popconfirm
                placement="bottomRight"
                title={t('TITLE_CONFIRM_DELETE_SELECTED')}
                description={t('CONFIRM_DELETE_COMPOSITE_PRODUCTS_SELECTED')}
                onConfirm={handleConfirmDeleteSelected}
                okText={t('TXT_CONFIRM')}
                cancelText={t('TXT_CANCEL')}
              >
                <Button 
                  type="primary" 
                  danger 
                  icon={<DeleteOutlined />} 
                  className="ml-2"
                  disabled={isDeletingLoading}
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
              disabled={isDeletingLoading}
            >
              {t('TXT_ADD_NEW_COMPOSITE')}
            </Button>
          </div>
        </div>

        {/* Table */}
        <CompositeProductTable
          storeCode={storeCode}
          onEdit={handleEdit} 
          onDelete={handleConfirmDeleteItem}
          onPrepare={handlePrepare}
          onServe={handleServe}
          onViewHistory={handleViewHistory}
          onSelectionChange={setSelectedProducts}
          loading={isLoading}
        />

        {/* Modals */}
        {contextHolder}
        
        <Modal 
          title={t('TITLE_ADD_COMPOSITE_PRODUCT')} 
          open={isModalCreateOpen} 
          footer={false} 
          onCancel={handleCreateCancel}
          width={800}
        >
          {isModalCreateOpen && (
            <CreateCompositeProductForm
              storeId={storeActive._id}
              storeCode={storeCode}
              onCancel={handleCreateCancel}
              onOK={handleCreateOk}
            />
          )}
        </Modal>

        <Modal 
          title={t('TITLE_EDIT_COMPOSITE_PRODUCT')} 
          open={isModalEditOpen} 
          footer={false} 
          onCancel={handleEditCancel}
          width={800}
        >
          {productEdit && (
            <EditCompositeProductForm 
              compositeProductData={productEdit}
              storeId={storeActive._id}
              storeCode={storeCode}
              productData={productEdit}
              onCancel={handleEditCancel}
              onOK={handleEditOk}
            />
          )}
        </Modal>

        <PrepareCompositeModal
          open={isModalPrepareOpen}
          product={productToPrepare}
          storeCode={storeCode}
          onOk={handlePrepareOk}
          onCancel={handlePrepareCancel}
        />

        <ServeCompositeModal
          open={isModalServeOpen}
          product={productToServe}
          storeCode={storeCode}
          onOk={handleServeOk}
          onCancel={handleServeCancel}
        />

        <CompositeHistoryModal
          visible={isModalHistoryOpen}
          product={productHistory}
          onClose={handleHistoryClose}
        />
      </div>
    </div>
  );
};

export default CompositeProductManagerPage;
