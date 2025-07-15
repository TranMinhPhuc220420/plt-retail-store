import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router";

// Redux

// i18n
import { useTranslation } from "react-i18next";

// Ant Design
import {
  AuditOutlined, TeamOutlined, HomeOutlined, DashboardFilled, BarChartOutlined,
  ProductOutlined, ContainerOutlined, ApartmentOutlined, ShopOutlined
} from '@ant-design/icons';

import { Layout, Menu } from 'antd';
const { Sider } = Layout;

const SiderApp = ({ isLoading }) => {
  // Router
  const navigate = useNavigate();
  const { storeCode } = useParams();
  // i18n
  const { t } = useTranslation();

  // State
  const [collapsed, setCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [keySelected, setKeySelected] = useState(false);

  // Classes - clsx
  const classes = {
    wrapLogo: 'flex items-center justify-center h-16 bg-white shadow-sm',
    logo: 'h-10',
    wrapMenu: 'h-full',
  };

  // Process func
  const processSetItemActiveMenuByPath = () => {
    const path = window.location.pathname;
    
    // Check if path is in items
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
    } else if (menuItems.length > 0) {
      // Default to first item
      setKeySelected(menuItems[0].key);
    }
  };
  const processSetMenuItems = () => {
    // Define menu items
    let items = [];

    if (storeCode) {
      items = [
        {
          key: 'admin_dashboard',
          icon: <HomeOutlined />,
          pathname: `/store/${storeCode}/admin`,
          label: t('TXT_DASHBOARD'),
        },
        {
          key: 'admin_product_types_management',
          icon: <ApartmentOutlined />,
          pathname: `/store/${storeCode}/admin/loai-san-pham`,
          label: t('TXT_PRODUCT_TYPES_MANAGEMENT'),
        },
        {
          key: 'admin_product_management',
          icon: <ProductOutlined />,
          pathname: `/store/${storeCode}/admin/san-pham`,
          label: t('TXT_PRODUCT_MANAGEMENT'),
        },
        {
          key: 'admin_inventory_management',
          icon: <ContainerOutlined />,
          pathname: `/store/${storeCode}/admin/kho`,
          label: t('TXT_INVENTORY_MANAGEMENT'),
        },
  
        {
          key: 'admin_employee',
          icon: <TeamOutlined />,
          label: t('TXT_EMPLOYEE'),
          children: [
            {
              key: 'admin_employee_manager',
              pathname: `/store/${storeCode}/admin/nhan-vien`,
              label: t('TXT_MANAGER'),
            },
            {
              key: 'admin_employee_skill_categorization',
              pathname: `/store/${storeCode}/admin/nhan-vien/phan-loai-ky-nang`,
              label: t('TXT_SKILL_CATEGORIZATION'),
            },
            {
              key: 'admin_employee_track_work_hours',
              pathname: `/store/${storeCode}/admin/nhan-vien/theo-doi-gio-lam`,
              label: t('TXT_TRACK_WORK_HOURS'),
            },
          ],
        },
        {
          key: 'admin_shift_optimization',
          icon: <DashboardFilled />,
          label: t('TXT_SHIFT_OPTIMIZATION'),
          children: [
            {
              key: 'admin_shift_scheduling',
              pathname: `/store/${storeCode}/admin/toi-uu-hoa-ca/sap-xep-ca`,
              label: t('TXT_SHIFT_SCHEDULING'),
            },
            {
              key: 'admin_shift_setup',
              pathname: `/store/${storeCode}/admin/toi-uu-hoa-ca/thiet-lap-ca`,
              label: t('TXT_SHIFT_SETUP'),
            },
          ],
        },
        {
          key: 'admin_revenue_forecast',
          icon: <AuditOutlined />,
          label: t('TXT_REVENUE_FORECAST'),
          children: [
            {
              key: 'admin_revenue_forecast_main',
              pathname: `/store/${storeCode}/admin/du-doan-doanh-thu`,
              label: t('TXT_REVENUE_FORECAST'),
            },
            {
              key: 'admin_historical_analysis',
              pathname: `/store/${storeCode}/admin/phan-tich-lich-su`,
              label: t('TXT_HISTORICAL_ANALYSIS'),
            },
          ],
        },
  
        {
          key: 'go_to_sale_member_screen',
          icon: <ShopOutlined />,
          pathname: `/store/${storeCode}/sale`,
          label: t('TXT_GO_TO_SALE_MEMBER_SCREEN'),
        },
      ];
    }

    // Set menu items
    setMenuItems(items);
  };

  // Handler func
  const handlerOnSelectMenuItem = (event) => {
    const { key, item } = event;
    const { pathname } = item.props;

    if (key && pathname) {
      navigate(pathname);
    }
  };

  useEffect(() => {
    processSetMenuItems();
  }, [storeCode]);

  useEffect(() => {
    processSetItemActiveMenuByPath();
  }, [storeCode, menuItems]);

  if (!keySelected) return <></>;

  return (
    <div>
      {/* Logo */}
      <div className={classes.wrapLogo}>
        <div className='flex items-center cursor-pointer' onClick={() => navigate('/overview')}>
          <img src="/favicon.ico" className='h-10' alt="Logo" />
          <span className='app-name text-lg font-bold ml-2'>{t('TXT_COMPANY_NAME')}</span>
        </div>
      </div>

      {/* Sider */}
      <Sider collapsed={collapsed} className={classes.wrapMenu} width={220} style={{ backgroundColor: '#fff' }}>
        {!isLoading &&
          <Menu defaultSelectedKeys={[keySelected]} mode="inline" items={menuItems} onSelect={handlerOnSelectMenuItem} />
        }
      </Sider>
    </div>
  );
};


export default SiderApp;