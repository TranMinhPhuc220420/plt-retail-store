
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router';

// Hook components
import useAuth from "@/hooks/useAuth";

import { Layout } from 'antd';
const { Content } = Layout;

import SiderApp from './SiderApp';
import HeaderApp from './HeaderApp';

const LayoutApp = () => {
  // Use hooks state
  const { user } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(true);

  // Effect
  useEffect(() => {
    if (user && user.id) {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <Layout className='h-screen'>

      {/* Sider */}
      <SiderApp isLoading={isLoading} />

      <Layout>

        {/* Header */}
        <HeaderApp isLoading={isLoading} />

        {/* Content */}
        <Content>

          {/* This is where the child routes will be rendered */}
          {!isLoading && <Outlet />}

        </Content>

      </Layout>
    </Layout>
  );
};
export default LayoutApp;