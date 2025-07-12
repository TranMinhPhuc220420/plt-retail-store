import React, { useEffect } from 'react';
import { useNavigate } from "react-router";

// Redux
import { useSelector, } from "react-redux";

// i18n
import { useTranslation } from "react-i18next";

// Ant Design
import {
  AuditOutlined, TeamOutlined, HomeOutlined, DashboardFilled, BarChartOutlined,
  ProductOutlined, ContainerOutlined,
  ShopOutlined
} from '@ant-design/icons';

import { Layout, Menu } from 'antd';
const { Sider } = Layout;

const SiderApp = ({ isLoading }) => {
  // Router
  const navigate = useNavigate();
  // i18n
  const { t } = useTranslation();
  // Redux
  const collapsed = useSelector((state) => state.app.collapsedSider);

  // State
  const [keySelected, setKeySelected] = React.useState(false);

  // Classes - clsx
  const classes = {
    wrapLogo: 'flex items-center justify-center h-16 bg-white shadow-sm',
    logo: 'h-10',
    wrapMenu: 'h-full',
  };

  // Process func

  // Handler func
  const handlerOnSelectMenuItem = (event) => {
    const { key, item } = event;
    const { pathname } = item.props;

    if (key && pathname) {
      navigate(pathname);
    }
  };

  // Menu items
  const menuItems = [
    {
      key: 'admin_dashboard',
      icon: <HomeOutlined />,
      pathname: '/admin/dashboard',
      label: t('TXT_DASHBOARD'),
    },
    // {
    //   key: 'admin_revenue',
    //   icon: <AuditOutlined />,
    //   pathname: '/admin/doanh-thu',
    //   label: t('TXT_REVENUE'),
    // },
    {
      key: 'admin_product_management',
      icon: <ProductOutlined />,
      pathname: '/admin/quan-ly-san-pham',
      label: t('TXT_PRODUCT_MANAGEMENT'),
    },
    {
      key: 'admin_inventory_management',
      icon: <ContainerOutlined />,
      pathname: '/admin/quan-ly-kho',
      label: t('TXT_INVENTORY_MANAGEMENT'),
    },

    {
      key: 'admin_employee',
      icon: <TeamOutlined />,
      label: t('TXT_EMPLOYEE'),
      children: [
        {
          key: 'admin_employee_manager',
          pathname: '/admin/nhan-vien/quan-ly',
          label: t('TXT_MANAGER'),
        },
        {
          key: 'admin_employee_skill_categorization',
          pathname: '/admin/nhan-vien/phan-loai-ky-nang',
          label: t('TXT_SKILL_CATEGORIZATION'),
        },
        {
          key: 'admin_employee_track_work_hours',
          pathname: '/admin/nhan-vien/theo-doi-thoi-gian-lam-viec',
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
          pathname: '/admin/toi-uu-hoa-ca/sap-xep-ca-lam-viec',
          label: t('TXT_SHIFT_SCHEDULING'),
        },
        {
          key: 'admin_shift_setup',
          pathname: '/admin/toi-uu-hoa-ca/thiet-lap-sap-xep-ca',
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
          pathname: '/admin/du-doan-doanh-thu/du-doan-doanh-thu',
          label: t('TXT_REVENUE_FORECAST'),
        },
        {
          key: 'admin_historical_analysis',
          pathname: '/admin/du-doan-doanh-thu/phan-tich-lich-su',
          label: t('TXT_HISTORICAL_ANALYSIS'),
        },
      ],
    },

    {
      key: 'go_to_sale_member_screen',
      icon: <ShopOutlined />,
      pathname: '/',
      label: t('TXT_GO_TO_SALE_MEMBER_SCREEN'),
    },
  ];

  useEffect(() => {
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
    } else {
      // Default to first item
      setKeySelected(menuItems[0].key);
    }
    
  }, []);

  if (!keySelected) return <></>;

  return (
    <div>
      {/* Logo */}
      <div className={classes.wrapLogo}>
        <img src="/favicon.ico" className={classes.logo} />
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