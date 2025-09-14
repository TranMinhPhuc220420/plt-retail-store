import React, { useEffect, useState } from 'react';

import clsx from 'clsx';

// React Router
import { useNavigate, useParams } from 'react-router';

// i18n
import { useTranslation } from 'react-i18next';

// Hook components
import useSalesAuth from "@/hooks/useSalesAuth";

// Ant Design
import { ShoppingCartOutlined, UserOutlined, FileDoneOutlined, LoadingOutlined, HomeOutlined, BlockOutlined, LogoutOutlined } from '@ant-design/icons';
import { Layout, Button, Dropdown, Space, Menu, message, Avatar, Typography, Tag } from 'antd';
const { Header } = Layout;
const { Text } = Typography;

const SalesHeaderApp = ({ isLoading }) => {

  // Ant Design message
  const [messageApi, contextHolder] = message.useMessage();

  // Use i18n
  const { t } = useTranslation();

  // Use navigate
  const navigate = useNavigate();
  const params = useParams();
  const storeCode = params.storeCode;

  // Hook components - using sales auth
  const {
    employee,
    storeInfo,
    currentShift,
    signOut,
    getEmployeeName,
    getEmployeeAvatar,
    isShiftActive
  } = useSalesAuth();

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
      setKeySelected(key);
    }
  };

  const handlerSignOut = async () => {
    try {
      await signOut();
      messageApi.success('Đăng xuất thành công!');
    } catch (error) {
      messageApi.error('Lỗi khi đăng xuất');
    }
  };

  // Menu items for sales staff
  const menuItems = [
    {
      key: 'employee_dashboard',
      icon: <HomeOutlined />,
      pathname: `/store/${storeCode}`,
      label: t('TXT_DASHBOARD'),
    },
    {
      key: 'employee_sell',
      icon: <ShoppingCartOutlined />,
      pathname: `/store/${storeCode}/ban-hang`,
      label: t('TXT_SELL'),
    },
    {
      key: 'employee_invoice',
      icon: <FileDoneOutlined />,
      pathname: `/store/${storeCode}/hoa-don`,
      label: t('TXT_INVOICE'),
    },
    {
      key: 'employee_client',
      icon: <UserOutlined />,
      pathname: `/store/${storeCode}/khach-hang`,
      label: t('TXT_CLIENT'),
    },
    {
      key: 'employee_shift_handover',
      icon: <BlockOutlined />,
      pathname: `/store/${storeCode}/giao-ca`,
      label: t('TXT_SHIFT_HANDOVER'),
    },
  ];

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate(`/store/${storeCode}/profile`),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handlerSignOut,
    },
  ];

  useEffect(() => {
    // Set active menu based on current path
    const currentPath = window.location.pathname;
    const activeItem = menuItems.find(item => currentPath === item.pathname);
    if (activeItem) {
      setKeySelected(activeItem.key);
    }
  }, []);

  return (
    <>
      {contextHolder}
      <Header className="shadow bg-white border-b border-gray-200 px-4 flex justify-between items-center h-16" style={{ backgroundColor: '#fff', paddingLeft: 10, paddingRight: 20 }}>
        {/* Left side - Navigation Menu */}
        <div className="flex items-center space-x-4">
          {/* Store Info */}
          <div className="flex items-center space-x-2">
            <Text strong className="text-lg">{storeInfo?.name || storeCode}</Text>
            {isShiftActive() && (
              <Tag color="green" size="small">Ca đang hoạt động</Tag>
            )}
          </div>

          {/* Navigation Menu */}
          <Menu
            mode="horizontal"
            selectedKeys={[keySelected]}
            items={menuItems}
            onSelect={handlerOnSelectMenuItem}
            className="border-none min-w-0"
            style={{ lineHeight: '64px' }}
          />
        </div>

        {/* Right side - User Info */}
        <div className="flex items-center space-x-4">
          {/* Employee Info */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <Text strong className="block">{getEmployeeName()} ({employee?.employeeCode} - {employee?.department})</Text>
            </div>

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Avatar
                size={40}
                src={getEmployeeAvatar()}
                icon={<UserOutlined />}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Dropdown>
          </div>
        </div>
      </Header>
    </>
  );
};

export default SalesHeaderApp;