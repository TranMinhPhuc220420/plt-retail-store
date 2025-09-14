import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { 
  UserOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  LoginOutlined 
} from '@ant-design/icons';

const SalesAccountStats = ({ salesAccounts = [] }) => {
  // Calculate stats from salesAccounts array
  const totalAccounts = salesAccounts.length;
  const activeAccounts = salesAccounts.filter(account => account.isActive).length;
  const inactiveAccounts = totalAccounts - activeAccounts;
  
  // Count accounts that logged in today
  const today = new Date().toDateString();
  const todayLogins = salesAccounts.filter(account => {
    if (!account.salesCredentials?.lastSalesLogin) return false;
    const loginDate = new Date(account.salesCredentials.lastSalesLogin).toDateString();
    return loginDate === today;
  }).length;

  return (
    <Row gutter={16} className="mb-6">
      <Col span={6}>
        <Card>
          <Statistic
            title="Tổng tài khoản"
            value={totalAccounts}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Đang hoạt động"
            value={activeAccounts}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Đăng nhập hôm nay"
            value={todayLogins}
            prefix={<LoginOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Chưa kích hoạt"
            value={inactiveAccounts}
            prefix={<ExclamationCircleOutlined />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default SalesAccountStats;