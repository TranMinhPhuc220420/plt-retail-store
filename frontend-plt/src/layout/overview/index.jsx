import React, { useEffect, useState } from 'react';

import { Breadcrumb, Layout, Menu, theme } from 'antd';
const { Content, Footer } = Layout;

import { Outlet } from 'react-router';

import useAuth from '@/hooks/useAuth';

import HeaderApp from './HeaderApp';

const App = () => {
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
    <Layout className='flex flex-col h-screen'>

      <HeaderApp isLoading={isLoading} />

      <Content>
        {/* This is where the child routes will be rendered */}
        {!isLoading && <Outlet />}
      </Content>

      <Footer className='text-center'>
        Ant Design ©{new Date().getFullYear()} Created by Ant UED
      </Footer>
    </Layout>
  );
};
export default App;