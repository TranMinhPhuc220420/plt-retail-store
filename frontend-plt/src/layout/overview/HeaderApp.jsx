import React, { useEffect, useState } from 'react';

import clsx from 'clsx';

// React Router
import { useNavigate } from 'react-router';

// i18n
import { useTranslation } from 'react-i18next';

// Hook components
import useAuth from "@/hooks/useAuth";

// Ant Design
import { LoadingOutlined, UserOutlined } from '@ant-design/icons';
import { Layout, Dropdown, message, Avatar } from 'antd';
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
      let msgError = t(error);
      if (msgError == error) {
        msgError = t('TXT_SIGN_OUT_ERROR');
      }
      messageApi.error(msgError);
    }
  };

  // Constants
  const items = [
    {
      label: (
        <span>
          <UserOutlined style={{ marginRight: '8px' }} />
          Quản lý Profile
        </span>
      ),
      key: 'profile',
      onClick: () => {
        const currentPath = window.location.pathname;
        navigate('/profile');
      },
    },
    {
      type: 'divider',
    },
    {
      label: (<span>Đăng Xuất</span>),
      key: '0',
      onClick: handlerSignOut,
    },
  ];

  useEffect(() => {
  }, []);

  return (
    <Header className='shadow' style={{ backgroundColor: '#fff', paddingLeft: 10, paddingRight: 20 }}>
      {contextHolder}

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
                  <Avatar
                    size={25}
                    src={user.avatar}
                    icon={<UserOutlined />}
                    style={{
                      border: '4px solid #f0f0f0',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                    }}
                  />
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