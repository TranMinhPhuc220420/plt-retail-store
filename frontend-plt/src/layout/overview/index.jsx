import React, {  } from 'react';

import { Layout } from 'antd';
const { Content, Footer } = Layout;

import { Outlet } from 'react-router';

import useAuth from '@/hooks/useAuth';

import HeaderApp from './HeaderApp';

const App = () => {
  // Use hooks state
  const { isAuthenticated, isChecking, isError } = useAuth();

  // State

  // Effect

  return (
    <Layout className='flex flex-col h-screen'>

      {!isChecking && isAuthenticated && <HeaderApp isLoading={isChecking} /> }

      <Content>
        {/* This is where the child routes will be rendered */}
        {!isChecking && isAuthenticated && <Outlet />}
        {isError && <div className='text-red-500 text-center'>Error: {isError}</div>}
      </Content>

      {/* <Footer className='text-center'>
        Ant Design ©{new Date().getFullYear()} Created by Ant UED
      </Footer> */}
    </Layout>
  );
};
export default App;