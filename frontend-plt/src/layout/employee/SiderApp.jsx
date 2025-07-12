import React, { useEffect } from 'react';
import { useNavigate } from "react-router";

// Redux
import { useSelector, } from "react-redux";

// i18n
import { useTranslation } from "react-i18next";

// Ant Design
import {
  AuditOutlined,
  TeamOutlined,
  HomeOutlined,
  DashboardFilled,
  BarChartOutlined
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
  const getItem = (label, pathname, key, icon, children) => {
    return { key, icon, pathname, children, label, };
  }

  // Handler func
  const handlerOnSelectMenuItem = (event) => {
    const { key, item } = event;
    const { pathname } = item.props;

    if (key && pathname) {
      navigate(pathname);
    }
  };

  // Menu items
  const items = [
    getItem(t('TXT_DASHBOARD'), '/dashboard', '1', <HomeOutlined />),
    getItem(t('TXT_REPORT'), '/bao-cao', '2', <BarChartOutlined />),
    getItem(t('TXT_REVENUE'), '/doanh-thu', '10', <AuditOutlined />),

    getItem(t('TXT_EMPLOYEE'), '', 'sub1', <TeamOutlined />, [
      getItem(t('TXT_MANAGER'), '/nhan-vien/quan-ly', '3'),
      getItem(t('TXT_SKILL_CATEGORIZATION'), '/nhan-vien/phan-loai-ky-nang', '4'),
      getItem(t('TXT_TRACK_WORK_HOURS'), '/nhan-vien/theo-doi-thoi-gian-lam-viec', '5'),
    ]),

    getItem(t('TXT_SHIFT_OPTIMIZATION'), '', 'sub2', <DashboardFilled />, [
      getItem(t('TXT_SHIFT_SCHEDULING'), '/toi-uu-hoa-ca/sap-xep-ca-lam-viec', '6'),
      getItem(t('TXT_SHIFT_SETUP'), '/toi-uu-hoa-ca/thiet-lap-sap-xep-ca', '7'),
    ]),

    getItem(t('TXT_REVENUE_FORECAST'), '', 'sub3', <AuditOutlined />, [
      getItem(t('TXT_REVENUE_FORECAST'), '/du-doan-doanh-thu/du-doan-doanh-thu', '8'),
      getItem(t('TXT_HISTORICAL_ANALYSIS'), '/du-doan-doanh-thu/phan-tich-lich-su', '9'),
    ]),
  ];

  useEffect(() => {
    const path = window.location.pathname;
    
    // Check if path is in items
    let item;
    for (let i = 0; i < items.length; i++) {
      const element = items[i];
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
      setKeySelected(items[0].key);
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
          <Menu defaultSelectedKeys={[keySelected]} mode="inline" items={items} onSelect={handlerOnSelectMenuItem} />
        }
      </Sider>
    </div>
  );
};


export default SiderApp;