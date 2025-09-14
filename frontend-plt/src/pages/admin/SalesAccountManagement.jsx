import React from 'react';
import { Row, Col } from 'antd';
import SalesAccountStats from '@/components/salesAccount/SalesAccountStats';
import SalesAccountTable from '@/components/salesAccount/SalesAccountTable';

const SalesAccountManagement = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <SalesAccountStats />
          </Col>
        </Row>

        {/* Main Table */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <SalesAccountTable />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SalesAccountManagement;