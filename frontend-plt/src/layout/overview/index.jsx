import React, { useRef, useEffect, useState } from 'react';

import { Breadcrumb, Layout, Menu, theme } from 'antd';
const { Content, Footer } = Layout;

import { Outlet } from 'react-router';

import useAuth from '@/hooks/useAuth';

import HeaderApp from './HeaderApp';

const App = () => {
  // Use hooks state
  const { user, isChecking, isError } = useAuth();

  // State

  // Effect
  useEffect(() => {
  }, []);

  return (
    <Layout className='flex flex-col h-screen'>

      <HeaderApp isLoading={isChecking} />

      <Content>
        {/* This is where the child routes will be rendered */}
        {!isChecking && <Outlet />}
        {isError && <div className='text-red-500 text-center'>Error: {isError}</div>}
      </Content>

      <Footer className='text-center'>
        Ant Design ©{new Date().getFullYear()} Created by Ant UED
      </Footer>
    </Layout>
  );
};
export default App;