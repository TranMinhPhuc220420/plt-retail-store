import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Table,
  Progress,
  Tag,
  Space,
  Alert,
  Spin,
  Typography,
  Divider,
  Modal,
  message,
  Tooltip
} from 'antd';
import {
  ReloadOutlined,
  BarChartOutlined,
  ClearOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useRealTimeCostUpdates from '@/hooks/useRealTimeCostUpdates';
import useCostAnalysisStore from '@/store/costAnalysis';
import { getAuthToken } from '@/utils/auth';

const { Title, Text } = Typography;

const CostAnalysisDashboard = ({ storeId, storeCode }) => {
  const { t } = useTranslation();
  const [recalculationModalVisible, setRecalculationModalVisible] = useState(false);

  // Store integration
  const {
    isLoading,
    isCacheClearing,
    isRecalculating,
    error,
    success,
    cacheStats,
    profitabilityReport,
    queueStatus,
    fetchCacheStats,
    fetchProfitabilityReport,
    clearCaches,
    massRecalculate,
    updateRealTimeData,
    clearMessages
  } = useCostAnalysisStore();

  // Real-time WebSocket connection
  const {
    isConnected,
    connectionError,
    lastUpdate,
    queueStatus: wsQueueStatus,
    connect,
    disconnect
  } = useRealTimeCostUpdates(getAuthToken(), [storeId]);

  // Handle real-time updates
  useEffect(() => {
    if (lastUpdate) {
      // Update store with real-time data
      updateRealTimeData(lastUpdate);
      
      const { type } = lastUpdate;
      
      // Refresh data when significant changes occur
      if (['CACHE_CLEARED', 'MASS_RECALCULATION_STARTED'].includes(type)) {
        setTimeout(() => {
          fetchCacheStats();
          if (storeId) {
            fetchProfitabilityReport(storeId);
          }
        }, 1000);
      }
    }
  }, [lastUpdate]);

  // Initial data fetch
  useEffect(() => {
    fetchCacheStats();
    if (storeId) {
      fetchProfitabilityReport(storeId);
    }
  }, [storeId]);

  // Handle WebSocket queue status updates
  useEffect(() => {
    if (wsQueueStatus) {
      updateRealTimeData({ type: 'QUEUE_STATUS', queueStatus: wsQueueStatus });
    }
  }, [wsQueueStatus]);

  // Clear messages after display
  useEffect(() => {
    if (success) {
      message.success(success);
      setTimeout(() => clearMessages(), 3000);
    }
    if (error) {
      message.error(error);
      setTimeout(() => clearMessages(), 5000);
    }
  }, [success, error]);

  const profitabilityColumns = [
    {
      title: t('TXT_PRODUCT_NAME'),
      dataIndex: 'productName',
      key: 'productName',
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {record.isComposite && <Tag color="purple">Composite</Tag>}
        </Space>
      )
    },
    {
      title: t('TXT_COST_PRICE'),
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (value) => `${value.toLocaleString()} VND`,
      align: 'right'
    },
    {
      title: t('TXT_RETAIL_PRICE'),
      dataIndex: 'retailPrice',
      key: 'retailPrice',
      render: (value) => `${value.toLocaleString()} VND`,
      align: 'right'
    },
    {
      title: t('TXT_MARGIN'),
      dataIndex: 'margin',
      key: 'margin',
      render: (value, record) => (
        <Space>
          <Text>{value.toLocaleString()} VND</Text>
          <Text type="secondary">({record.marginPercent.toFixed(1)}%)</Text>
        </Space>
      ),
      align: 'right'
    },
    {
      title: t('TXT_PROFITABILITY'),
      dataIndex: 'profitabilityRating',
      key: 'profitabilityRating',
      render: (rating) => {
        const colors = { high: 'green', medium: 'orange', low: 'red' };
        const labels = { high: 'High', medium: 'Medium', low: 'Low' };
        return <Tag color={colors[rating]}>{labels[rating]}</Tag>;
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2}>
            <BarChartOutlined /> {t('TXT_COST_ANALYSIS_DASHBOARD')}
          </Title>
          <Text type="secondary">
            {storeCode ? `Store: ${storeCode}` : 'All Stores'}
          </Text>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                fetchCacheStats();
                fetchProfitabilityReport();
              }}
              loading={isLoading}
            >
              {t('TXT_REFRESH')}
            </Button>
            <Button 
              icon={<ClearOutlined />} 
              onClick={clearCaches}
              type="default"
            >
              {t('TXT_CLEAR_CACHE')}
            </Button>
            <Button 
              icon={<SyncOutlined />} 
              onClick={() => setRecalculationModalVisible(true)}
              type="primary"
            >
              {t('TXT_RECALCULATE_ALL')}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Connection Status */}
      <Alert
        message={
          <Space>
            {isConnected ? (
              <>
                {/* <ConnectionOutlined style={{ color: '#52c41a' }} /> */}
                <Text>Real-time updates connected</Text>
              </>
            ) : (
              <>
                {/* <DisconnectedOutlined style={{ color: '#ff4d4f' }} /> */}
                <Text>Real-time updates disconnected</Text>
                {connectionError && <Text type="danger">({connectionError})</Text>}
              </>
            )}
          </Space>
        }
        type={isConnected ? 'success' : 'warning'}
        showIcon={false}
        style={{ marginBottom: '24px' }}
        action={
          !isConnected ? (
            <Button size="small" onClick={connect}>
              Reconnect
            </Button>
          ) : null
        }
      />

      {/* System Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Cache Hit Rate"
              value={cacheStats ? 
                Math.round((cacheStats.cache.recipe.hits / 
                (cacheStats.cache.recipe.hits + cacheStats.cache.recipe.misses)) * 100) || 0 : 0
              }
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Update Queue"
              value={queueStatus.queueLength}
              prefix={queueStatus.isProcessing ? <SyncOutlined spin /> : null}
              valueStyle={{ color: queueStatus.isProcessing ? '#1890ff' : '#000' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Connected Clients"
              value={queueStatus.connectedClients}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Cached Recipes"
              value={cacheStats?.cache.recipe.keys || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Cache Details */}
      {cacheStats && (
        <Card title="Cache Statistics" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            {Object.entries(cacheStats.cache).map(([type, stats]) => (
              <Col xs={24} sm={12} md={6} key={type}>
                <Card size="small" title={type.charAt(0).toUpperCase() + type.slice(1)}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Keys: </Text>
                      <Text strong>{stats.keys}</Text>
                    </div>
                    <div>
                      <Text type="secondary">Hits: </Text>
                      <Text strong style={{ color: '#52c41a' }}>{stats.hits}</Text>
                    </div>
                    <div>
                      <Text type="secondary">Misses: </Text>
                      <Text strong style={{ color: '#ff4d4f' }}>{stats.misses}</Text>
                    </div>
                    <Progress
                      percent={Math.round((stats.hits / (stats.hits + stats.misses)) * 100) || 0}
                      size="small"
                      format={(percent) => `${percent}% hit rate`}
                    />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Profitability Report */}
      {profitabilityReport && (
        <Card 
          title="Profitability Analysis" 
          extra={
            <Space>
              <Text type="secondary">
                Generated: {new Date(profitabilityReport.generatedAt).toLocaleString()}
              </Text>
            </Space>
          }
        >
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Average Margin"
                value={profitabilityReport.summary.averageMargin}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: profitabilityReport.summary.averageMargin > 30 ? '#3f8600' : '#cf1322' 
                }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="High Profit Products"
                value={profitabilityReport.summary.highProfitProducts}
                suffix={`/ ${profitabilityReport.summary.totalProducts}`}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Low Profit Products"
                value={profitabilityReport.summary.lowProfitProducts}
                suffix={`/ ${profitabilityReport.summary.totalProducts}`}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
          </Row>

          <Table
            columns={profitabilityColumns}
            dataSource={profitabilityReport.products}
            rowKey="productId"
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
            size="small"
          />
        </Card>
      )}

      {/* Mass Recalculation Modal */}
      <Modal
        title="Mass Cost Recalculation"
        open={recalculationModalVisible}
        onCancel={() => setRecalculationModalVisible(false)}
        onOk={() => massRecalculate({ storeId })}
        okText="Start Recalculation"
        okType="primary"
        cancelText="Cancel"
      >
        <Alert
          message="Warning"
          description="This will recalculate costs for all recipes and products in the selected store. This process may take several minutes and will clear all cached data."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <p>Are you sure you want to proceed with mass cost recalculation?</p>
      </Modal>

      {isLoading && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(255,255,255,0.8)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          zIndex: 9999
        }}>
          <Spin size="large" />
        </div>
      )}
    </div>
  );
};

export default CostAnalysisDashboard;
