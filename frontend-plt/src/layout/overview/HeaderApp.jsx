import React, { useEffect, useState } from 'react';

import clsx from 'clsx';

// React Router
import { useNavigate } from 'react-router';

// i18n
import { useTranslation } from 'react-i18next';

// Hook components
import useAuth from "@/hooks/useAuth";

// Ant Design
import { LoadingOutlined } from '@ant-design/icons';
import { Layout, Dropdown, message } from 'antd';
const { Header } = Layout;

const HeaderApp = ({ isLoading }) => {

  // Ant Design message
  const [messageApi, contextHolder] = message.useMessage();

  // Use i18n
  const { t } = useTranslation();

  // Use navigate
  const navigate = useNavigate();

  // Hook components
  const { user, signOut } = useAuth();

  // State
  const [keySelected, setKeySelected] = useState('employee_dashboard');

  // Classes - clsx
  const classes = {
    collapsedBtn: clsx('border-none', {
    }),
  };

  // Handler
  const handlerSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      const message = t(error);
      if (message == error) {
        message = t('TXT_SIGN_OUT_ERROR');
      }
      messageApi.error(message);
    }
  };

  // Constants
  const items = [];
  items.push({
    label: (<span>{t('TXT_LOGOUT')}</span>),
    key: '0',
    onClick: handlerSignOut,
  });
  
  useEffect(() => {
  }, []);

  return (
    <Header className='shadow' style={{ backgroundColor: '#fff', paddingLeft: 10, paddingRight: 20 }}>
      { contextHolder }
      
      <div className='flex items-center justify-between h-full'>

        <div className='flex items-center cursor-pointer' onClick={() => navigate('/overview')}>
          <img src="/favicon.ico" className='h-10' alt="Logo" />
          <span className='app-name text-lg font-bold ml-2'>{t('TXT_COMPANY_NAME')}</span>
        </div>

        <div>
          {!isLoading ?
            (
              <Dropdown menu={{ items }} trigger={['click']}>
                <div className='h-10 flex items-center justify-center cursor-pointer border border-gray-200 rounded-lg hover:bg-gray-100 pt-1 px-2'>
                  <span className='mr-3'>{user.displayName}</span>
                  <img src={user.avatar} style={{width: 25, height: 25}} alt="Avatar" className='h-full rounded-full' />
                </div>
              </Dropdown>
            )
            :
            <LoadingOutlined style={{ fontSize: 24 }} spin />
          }
        </div>

      </div>
    </Header>
  );
};


export default HeaderApp;