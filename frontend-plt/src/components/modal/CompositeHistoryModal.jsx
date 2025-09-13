import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Table,
  Tag,
  Typography,
  Space,
  DatePicker,
  Select,
  Button,
  Card,
  Statistic,
  Row,
  Col,
  Empty,
  Spin,
  Alert,
  Tooltip,
  Timeline
} from 'antd';
import {
  ClockCircleOutlined,
  FireOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  HistoryOutlined,
  TrophyOutlined,
  ExperimentOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { formatPrice, parseDecimal } from '@/utils/numberUtils';
import { getCompositeProductHistory } from '@/request/compositeProduct';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import './CompositeHistoryModal.css';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const CompositeHistoryModal = ({
  visible,
  onClose,
  product
}) => {
  const { t } = useTranslation();
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [actionFilter, setActionFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'

  // Fetch history data
  const fetchHistory = async () => {
    if (!product?._id) return;
    
    setLoading(true);
    try {
      // Format dates properly for API
      const startDate = dateRange[0]?.startOf('day').toISOString();
      const endDate = dateRange[1]?.endOf('day').toISOString();
      
      console.log('Fetching history with params:', {
        productId: product._id,
        startDate,
        endDate,
        action: actionFilter
      });
      
      const response = await getCompositeProductHistory(product._id, {
        startDate,
        endDate,
        action: actionFilter !== 'all' ? actionFilter : undefined
      });
      
      console.log('History response:', response);
      setHistoryData(response.data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when modal opens or filters change
  useEffect(() => {
    if (visible && product) {
      console.log('useEffect triggered - fetching history', { visible, product: !!product, dateRange, actionFilter });
      fetchHistory();
    }
  }, [visible, product, dateRange, actionFilter]);

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    console.log('Date range changed:', dates);
    if (dates && dates.length === 2) {
      setDateRange(dates);
    } else {
      // Reset to default range if cleared
      setDateRange([
        dayjs().subtract(30, 'day'),
        dayjs()
      ]);
    }
  };

  // Calculate statistics
  const statistics = React.useMemo(() => {
    if (!historyData.length) return {};

    const preparedCount = historyData.filter(item => item.action === 'prepare').length;
    const servedCount = historyData.filter(item => item.action === 'serve').length;
    const totalPrepared = historyData
      .filter(item => item.action === 'prepare')
      .reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalServed = historyData
      .filter(item => item.action === 'serve')
      .reduce((sum, item) => sum + (item.quantity || 0), 0);

    return {
      preparedCount,
      servedCount,
      totalPrepared,
      totalServed,
      averagePreparedPerBatch: preparedCount > 0 ? Math.round(totalPrepared / preparedCount) : 0
    };
  }, [historyData]);

  // Get action icon and color
  const getActionDisplay = (action) => {
    const displays = {
      prepare: {
        icon: <FireOutlined />,
        color: 'processing',
        text: t('TXT_PREPARE', 'Chuẩn bị')
      },
      serve: {
        icon: <ShoppingOutlined />,
        color: 'success',
        text: t('TXT_SERVE', 'Phục vụ')
      },
      expire: {
        icon: <ClockCircleOutlined />,
        color: 'warning',
        text: t('TXT_EXPIRED', 'Hết hạn')
      }
    };
    return displays[action] || displays.prepare;
  };

  // Table columns
  const columns = [
    {
      title: t('TXT_TIME', 'Thời gian'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time) => (
        <div>
          <div className="font-medium">
            {dayjs(time).format('DD/MM/YYYY HH:mm')}
          </div>
          <div className="text-xs text-gray-500">
            {dayjs(time).fromNow()}
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: t('TXT_ACTION', 'Hành động'),
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action) => {
        const display = getActionDisplay(action);
        return (
          <Tag icon={display.icon} color={display.color}>
            {display.text}
          </Tag>
        );
      }
    },
    {
      title: t('TXT_QUANTITY', 'Số lượng'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity, record) => (
        <div className="text-center">
          <div className="font-medium">{quantity || 0}</div>
          <div className="text-xs text-gray-500">
            {record.unit || product?.compositeInfo?.capacity?.unit || 'phần'}
          </div>
        </div>
      )
    },
    {
      title: t('TXT_STOCK_AFTER', 'Tồn kho sau'),
      dataIndex: 'stockAfter',
      key: 'stockAfter',
      width: 120,
      render: (stockAfter) => (
        <div className="text-center font-medium text-blue-600">
          {stockAfter || 0} {product?.compositeInfo?.capacity?.unit || 'phần'}
        </div>
      )
    },
    {
      title: t('TXT_NOTES', 'Ghi chú'),
      dataIndex: 'notes',
      key: 'notes',
      render: (notes) => notes || '-'
    },
    {
      title: t('TXT_OPERATOR', 'Người thực hiện'),
      dataIndex: 'operator',
      key: 'operator',
      width: 150,
      render: (operator) => (
        <div>
          <div className="font-medium">{operator?.fullName || operator?.username || 'N/A'}</div>
          <div className="text-xs text-gray-500">{operator?.role || ''}</div>
        </div>
      )
    }
  ];

  // Timeline items
  const timelineItems = historyData.map(item => {
    const display = getActionDisplay(item.action);
    return {
      key: item._id,
      color: display.color,
      dot: display.icon,
      children: (
        <div className="pb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <Text strong>{display.text}</Text>
              <Text className="ml-2 text-gray-500">
                {item.quantity} {item.unit || product?.compositeInfo?.capacity?.unit || 'phần'}
              </Text>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</div>
              <div>{dayjs(item.createdAt).fromNow()}</div>
            </div>
          </div>
          {item.stockAfter !== undefined && (
            <Text type="secondary" className="text-sm">
              Tồn kho: {item.stockAfter} {product?.compositeInfo?.capacity?.unit || 'phần'}
            </Text>
          )}
          {item.notes && (
            <div className="mt-1">
              <Text type="secondary" className="text-sm">💬 {item.notes}</Text>
            </div>
          )}
          {item.operator && (
            <div className="mt-1">
              <Text type="secondary" className="text-xs">
                👤 {item.operator.fullName || item.operator.username}
              </Text>
            </div>
          )}
        </div>
      )
    };
  });

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <HistoryOutlined />
          <span>
            {t('TXT_PREPARATION_HISTORY', 'Lịch sử chuẩn bị')} - {product?.name}
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      className="composite-history-modal"
    >
      {/* Filters and Controls */}
      <Card size="small" className="mb-4">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Space direction="vertical" size="small" className="w-full">
              <Text type="secondary" className="text-xs">
                {t('TXT_DATE_RANGE', 'Khoảng thời gian')}
              </Text>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                size="small"
                allowClear={false}
                format="DD/MM/YYYY"
                className="w-full"
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space direction="vertical" size="small" className="w-full">
              <Text type="secondary" className="text-xs">
                {t('TXT_ACTION_FILTER', 'Lọc hành động')}
              </Text>
              <Select
                value={actionFilter}
                onChange={setActionFilter}
                size="small"
                className="w-full"
              >
                <Select.Option value="all">{t('TXT_ALL', 'Tất cả')}</Select.Option>
                <Select.Option value="prepare">
                  <FireOutlined /> {t('TXT_PREPARE', 'Chuẩn bị')}
                </Select.Option>
                <Select.Option value="serve">
                  <ShoppingOutlined /> {t('TXT_SERVE', 'Phục vụ')}
                </Select.Option>
              </Select>
            </Space>
          </Col>
          <Col span={6}>
            <Space direction="vertical" size="small" className="w-full">
              <Text type="secondary" className="text-xs">
                {t('TXT_VIEW_MODE', 'Chế độ xem')}
              </Text>
              <Select
                value={viewMode}
                onChange={setViewMode}
                size="small"
                className="w-full"
              >
                <Select.Option value="table">📋 {t('TXT_TABLE', 'Bảng')}</Select.Option>
                <Select.Option value="timeline">📅 {t('TXT_TIMELINE', 'Thời gian')}</Select.Option>
              </Select>
            </Space>
          </Col>
          <Col span={4}>
            <div className="flex justify-end pt-4">
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchHistory}
                loading={loading}
                size="small"
              >
                {t('TXT_REFRESH', 'Tải lại')}
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      {historyData.length > 0 && (
        <Card size="small" className="mb-4">
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title={t('TXT_PREPARE_TIMES', 'Số lần chuẩn bị')}
                value={statistics.preparedCount}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title={t('TXT_SERVE_TIMES', 'Số lần phục vụ')}
                value={statistics.servedCount}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title={t('TXT_TOTAL_PREPARED', 'Tổng đã chuẩn bị')}
                value={statistics.totalPrepared}
                suffix={product?.compositeInfo?.capacity?.unit || 'phần'}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title={t('TXT_TOTAL_SERVED', 'Tổng đã phục vụ')}
                value={statistics.totalServed}
                suffix={product?.compositeInfo?.capacity?.unit || 'phần'}
                prefix={<ExperimentOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title={t('TXT_CURRENT_STOCK', 'Tồn kho hiện tại')}
                value={product?.compositeInfo?.currentStock || 0}
                suffix={product?.compositeInfo?.capacity?.unit || 'phần'}
                valueStyle={{ 
                  color: (product?.compositeInfo?.currentStock || 0) > 0 ? '#52c41a' : '#f5222d' 
                }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title={t('TXT_AVG_PER_BATCH', 'Trung bình/lần')}
                value={statistics.averagePreparedPerBatch}
                suffix={product?.compositeInfo?.capacity?.unit || 'phần'}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Content */}
      <Spin spinning={loading}>
        {historyData.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <div className="text-gray-500 mb-2">
                  {t('MSG_NO_HISTORY_DATA', 'Chưa có dữ liệu lịch sử')}
                </div>
                <div className="text-xs text-gray-400">
                  {t('MSG_HISTORY_HELP', 'Lịch sử sẽ được ghi lại khi bạn chuẩn bị hoặc phục vụ sản phẩm')}
                </div>
              </div>
            }
          />
        ) : (
          <>
            {viewMode === 'table' ? (
              <Table
                columns={columns}
                dataSource={historyData}
                rowKey="_id"
                pagination={{
                  total: historyData.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} ${t('TXT_OF')} ${total} ${t('TXT_ITEMS')}`
                }}
                size="small"
                scroll={{ y: 400 }}
              />
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Timeline
                  items={timelineItems}
                  mode="left"
                  className="composite-history-timeline"
                />
              </div>
            )}
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default CompositeHistoryModal;