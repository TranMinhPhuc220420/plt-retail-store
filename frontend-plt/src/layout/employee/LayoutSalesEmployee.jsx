import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Outlet } from 'react-router';

import { useTranslation } from "react-i18next";

// Hook components
import useSalesAuth from "@/hooks/useSalesAuth";

import { Layout } from 'antd';
const { Content } = Layout;

// Zustand store
import useStoreApp from '@/store/app';

// Request
import { getMyStoreByCode, validateStoreCode } from '@/request/store';

import HeaderApp from './SalesHeaderApp';

const LayoutSalesEmployee = () => {
  // I18n
  const { t } = useTranslation();

  // Use sales auth instead of regular auth
  const { employee, storeInfo, isAuthenticated, isInitialized } = useSalesAuth();

  // Params
  const { storeCode } = useParams();

  // Zustand store
  const { setStoreActive, clearStoreActive,
    setStoreActiveIsLoading, setIsFetchingStoreActiveError, setMessageStoreActiveError
  } = useStoreApp();

  // State
  const [isLoading, setIsLoading] = useState(true);

  const handlerLoadStore = async () => {
    clearStoreActive();
    setStoreActiveIsLoading(true);
    setIsFetchingStoreActiveError(false);
    setMessageStoreActiveError('');

    try {
      // For sales, we already have store info from auth
      if (storeInfo) {
        setStoreActive(storeInfo);
      } else {
        // Fallback to API call if needed
        const store = await getMyStoreByCode(storeCode);
        setStoreActive(store);
      }
    } catch (error) {
      setIsFetchingStoreActiveError(true);
      setMessageStoreActiveError(error.message || 'Failed to load store');
      console.error('Error loading store:', error);
    } finally {
      setStoreActiveIsLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (storeCode && isAuthenticated && isInitialized) {
      handlerLoadStore();
    } else if (isInitialized && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [storeCode, isAuthenticated, isInitialized, storeInfo]);

  // Classes
  const classes = {
    wrapContent: 'h-full overflow-hidden',
  };

  if (isLoading || !isInitialized) {
    return (
      <Layout className="min-h-screen">
        <Content className="flex items-center justify-center">
          <div>Đang tải...</div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="h-screen overflow-hidden">
      {/* Header */}
      <HeaderApp />
      
      {/* Content */}
      <Content className={classes.wrapContent}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default LayoutSalesEmployee;