import { useState, useEffect } from 'react';
import { Drawer, Button, Menu } from 'antd';
import { MenuOutlined, DashboardOutlined, BarChartOutlined, ShoppingOutlined, BellOutlined } from '@ant-design/icons';

const MobileDashboard = ({ children }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const menuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: 'Overview',
    },
    {
      key: 'revenue',
      icon: <BarChartOutlined />,
      label: 'Revenue',
    },
    {
      key: 'products',
      icon: <ShoppingOutlined />,
      label: 'Products',
    },
    {
      key: 'alerts',
      icon: <BellOutlined />,
      label: 'Alerts',
    },
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      setDrawerVisible(false);
    }
  };

  if (!isMobile) {
    return children;
  }

  return (
    <div className="relative">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Sales Dashboard</h1>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerVisible(true)}
        />
      </div>

      {/* Navigation Drawer */}
      <Drawer
        title="Dashboard Sections"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={250}
      >
        <Menu
          mode="vertical"
          selectedKeys={[activeSection]}
          items={menuItems}
          onClick={({ key }) => scrollToSection(key)}
        />
      </Drawer>

      {/* Dashboard Content with Section IDs */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default MobileDashboard;
