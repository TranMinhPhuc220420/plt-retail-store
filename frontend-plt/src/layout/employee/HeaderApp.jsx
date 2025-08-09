import React, { useEffect, useState } from 'react';

import clsx from 'clsx';

// React Router
import { useNavigate } from 'react-router';

// i18n
import { useTranslation } from 'react-i18next';

// Hook components
import useAuth from "@/hooks/useAuth";

// Ant Design
import { ShoppingCartOutlined, UserOutlined, FileDoneOutlined, LoadingOutlined, HomeOutlined, BlockOutlined } from '@ant-design/icons';
import { Layout, Button, Dropdown, Space, Menu, message, Avatar } from 'antd';
const { Header } = Layout;

const SiderApp = ({ isLoading }) => {

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
  const handlerOnSelectMenuItem = (event) => {
    const { key, item } = event;
    const { pathname } = item.props;

    if (key && pathname) {
      navigate(pathname);
    }
  };
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
  const items = [];
  if (user && (user.isAdmin || user.isStaff)) {
    // Staff can access limited admin functions, admins can access all
    if (user.isAdmin) {
      items.push({
        label: (<span>{t('TXT_GO_TO_ADMIN_SCREEN')}</span>),
        key: '1',
        onClick: () => navigate('/admin'),
      });
    }
    // Staff gets a different menu item for their accessible admin functions
    if (user.isStaff) {
      items.push({
        label: (<span>{t('TXT_VIEW_PRODUCTS')}</span>),
        key: '2',
        onClick: () => navigate('/store/default'),
      });
    }
  }
  items.push({
    label: (<span>{t('TXT_LOGOUT')}</span>),
    key: '0',
    onClick: handlerSignOut,
  },
  );

  const menuItems = [
    {
      key: 'employee_dashboard',
      icon: <HomeOutlined />,
      pathname: '/',
      label: t('TXT_DASHBOARD'),
    },
    {
      key: 'sale_dashboard',
      icon: <ShoppingCartOutlined />,
      pathname: '/ban-hang',
      label: t('TXT_SELL'),
    },
    {
      key: 'client_dashboard',
      icon: <UserOutlined />,
      pathname: '/khach-hang',
      label: t('TXT_CLIENT'),
    },
    {
      key: 'invoice_dashboard',
      icon: <FileDoneOutlined />,
      pathname: '/hoa-don',
      label: t('TXT_INVOICE'),
    },
    {
      key: 'shift_handover_dashboard',
      icon: <BlockOutlined />,
      pathname: '/giao-ca',
      label: t('TXT_SHIFT_HANDOVER'),
    },
    {
      key: 'profile_dashboard',
      icon: <UserOutlined />,
      pathname: '/profile',
      label: 'Profile',
    }
  ];

  useEffect(() => {
    const path = window.location.pathname;

    // Check if path is in menuItems
    let item;
    for (let i = 0; i < menuItems.length; i++) {
      const element = menuItems[i];
      if (element.pathname === path) {
        item = element;
        break;
      } else if (element.children) {
        const child = element.children.find(child => child.pathname === path);
        if (child) {
          item = child;
          break;
        }
      }
    }

    // Set selected key based on path
    if (item) {
      setKeySelected(item.key);
    } else {
      // Default to first item
      setKeySelected(menuItems[0].key);
    }

  }, []);

  return (
    <Header className='shadow' style={{ backgroundColor: '#fff', paddingLeft: 10, paddingRight: 20 }}>
      {contextHolder}

      <div className='flex items-center justify-between h-full'>

        <Menu mode="horizontal" style={{ flex: 1, minWidth: 0 }}
          defaultSelectedKeys={[keySelected]}
          items={menuItems}
          onSelect={handlerOnSelectMenuItem}
        />

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


export default SiderApp;