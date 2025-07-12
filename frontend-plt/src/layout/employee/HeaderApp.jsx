import React, { useEffect, useState } from 'react';

import clsx from 'clsx';

// React Router
import { useNavigate } from 'react-router';

// i18n
import { useTranslation } from 'react-i18next';

// Hook components
import useAuth from "@/hooks/useAuth";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { toggleSider } from '@/store/features/app';

// Ant Design
import { ShoppingCartOutlined, UserOutlined, FileDoneOutlined, LoadingOutlined, HomeOutlined, BlockOutlined } from '@ant-design/icons';
import { Layout, Button, Dropdown, Space, Menu } from 'antd';
const { Header } = Layout;

const SiderApp = ({ isLoading }) => {
  // Use i18n
  const { t } = useTranslation();

  // Use navigate
  const navigate = useNavigate();

  // Hook components
  const { user, signOut } = useAuth();

  // Redux
  const dispatch = useDispatch();

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

  // Constants
  const items = [];
  if (user && user.isAdmin) {
    items.push({
      label: (<span>{t('TXT_GO_TO_ADMIN_SCREEN')}</span>),
      key: '1',
      onClick: () => navigate('/admin'),
    });
  }
  items.push({
    label: (<span>{t('TXT_LOGOUT')}</span>),
    key: '0',
    onClick: signOut,
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


export default SiderApp;