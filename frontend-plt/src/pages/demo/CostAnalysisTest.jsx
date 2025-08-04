import React from 'react';
import CostAnalysisDashboard from '@/components/CostAnalysis/CostAnalysisDashboard';
import { Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

const CostAnalysisTestPage = () => {
  // Use the demo store ID (you can get this from the demo output)
  const demoStoreId = '688e65e8d6508d6d3d27ccc0'; // This should match the demo store
  const demoStoreCode = 'DEMO_VN_RESTAURANT';

  return (
    <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical">
          <Title level={2}>🍜 PLT Cost Analysis System Demo</Title>
          <Text>
            This demo shows the complete cost calculation flow for a Vietnamese restaurant.
          </Text>
          <Text type="secondary">
            Demo data includes: Bún Nước Lèo recipe (23,170 VND/bowl) with 5 ingredients
          </Text>
        </Space>
      </Card>
      
      <CostAnalysisDashboard 
        storeId={demoStoreId}
        storeCode={demoStoreCode}
      />
    </div>
  );
};

export default CostAnalysisTestPage;
