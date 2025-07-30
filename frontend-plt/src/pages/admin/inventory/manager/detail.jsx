import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { } from "@ant-design/icons";
import { Breadcrumb, message } from "antd";

// Components

// Requests

// use zustand
import useStoreApp from "@/store/app";
import useWarehouseType from "@/store/warehouse";

const InventoryDetailPage = () => {
  const { storeCode, warehouseId } = useParams();

  // Navigate
  const navigate = useNavigate();

  // Ref
  const inputRef = useRef(null);

  // Translation
  const { t } = useTranslation();

  // Zustand store
  const { storeActive } = useStoreApp((state) => state);
  const { warehouseDetail } = useWarehouseType((state) => state);
  const { fetchWarehouseDetail } = useWarehouseType();

  // Message API
  const [messageApi, contextHolder] = message.useMessage();

  // State

  // Loading states

  // Modal states

  // Handlers
  const handleBack = () => {
    navigate(`/store/${storeCode}/admin/kho`);
  };

  useEffect(() => {
    if (warehouseId) {
      fetchWarehouseDetail(warehouseId);
    } else {
      messageApi.error(t('TXT_WAREHOUSE_NOT_FOUND'));
    }
    return () => {
    }
  }, [warehouseId]);

  if (!warehouseDetail) {
    return (
      <div className="h-full w-full px-4 pt-4 pb-10">
        {/* Loading */}
        <div className="h-full w-full bg-white p-2 rounded-md shadow-sm overflow-hidden">
          <p>{t('TXT_LOADING_WAREHOUSE_DETAIL')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full px-4 pt-4 pb-10">
      <div className="mb-2">
        <Breadcrumb items={[
          { title: t('TXT_INVENTORY_MANAGEMENT') },
          {
            title: t('TXT_MANAGER'),
            className: "cursor-pointer hover:text-blue-500",
            onClick: () => navigate(`/store/${storeCode}/admin/kho`), 
          },
          { title: warehouseDetail.name }
        ]
        } />
      </div>

      <div className="h-full w-full bg-white p-2 rounded-md shadow-sm overflow-hidden">
      </div>
    </div>
  );
};

export default InventoryDetailPage;