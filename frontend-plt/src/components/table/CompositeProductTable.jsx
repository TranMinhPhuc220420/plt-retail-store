import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Table, 
  Button, 
  Popconfirm, 
  Tag, 
  Space, 
  Tooltip,
  Badge,
  Progress,
  Typography
} from "antd";
import { 
  EditOutlined, 
  DeleteOutlined, 
  FireOutlined,
  ShoppingOutlined,
  ExperimentOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";

// Stores
import useCompositeProductStore from "@/store/compositeProduct";
import { parseDecimal, formatPrice } from "@/utils/numberUtils";

const { Text } = Typography;

const CompositeProductTable = ({ 
  storeCode, 
  onEdit, 
  onDelete, 
  onPrepare,
  onServe,
  onSelectionChange,
  loading 
}) => {
  const { t } = useTranslation();
  
  const {
    compositeProducts,
    isProductDeleting,
    isProductPreparing,
    isProductServing
  } = useCompositeProductStore();

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'fresh':
        return 'green';
      case 'expiring_soon':
        return 'orange';
      case 'expired':
        return 'red';
      default:
        return 'default';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status) => {
    switch (status) {
      case 'fresh':
        return <FireOutlined />;
      case 'expiring_soon':
        return <ClockCircleOutlined />;
      case 'expired':
        return <ExclamationCircleOutlined />;
      default:
        return null;
    }
  };

  // Calculate stock percentage
  const getStockPercentage = (current, capacity) => {
    if (capacity === 0) return 0;
    return Math.round((current / capacity) * 100);
  };

  // Format hours elapsed
  const formatHoursElapsed = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${Math.round(hours)}h`;
  };

  const columns = [
    {
      title: t('TXT_PRODUCT_CODE'),
      dataIndex: 'productCode',
      key: 'productCode',
      width: 150,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: t('TXT_PRODUCT_NAME'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">
            {t('TXT_CAPACITY')}: {record.compositeInfo.capacity.quantity} {record.compositeInfo.capacity.unit}
          </div>
        </div>
      )
    },
    {
      title: t('TXT_CHILD_PRODUCTS'),
      dataIndex: 'compositeInfo',
      key: 'childProducts',
      width: 200,
      render: (compositeInfo, record) => (
        <div>
          <div className="text-sm">
            {compositeInfo.childProducts?.length || 0} {t('TXT_PRODUCTS')}
          </div>
          <div className="text-xs text-gray-400">
            {compositeInfo.childProducts?.slice(0, 2).map((child, index) => (
              <span key={index}>
                {child.productId?.name || 'N/A'}
                {index < Math.min(1, compositeInfo.childProducts.length - 1) && ', '}
              </span>
            ))}
            {compositeInfo.childProducts?.length > 2 && (
              <span>... +{compositeInfo.childProducts.length - 2}</span>
            )}
          </div>
        </div>
      )
    },
    {
      title: t('TXT_STOCK_STATUS'),
      dataIndex: 'compositeInfo',
      key: 'stock',
      width: 150,
      render: (compositeInfo, record) => {
        const percentage = getStockPercentage(
          compositeInfo.currentStock, 
          compositeInfo.capacity.quantity
        );
        
        return (
          <div>
            <div className="flex items-center space-x-2">
              <Progress 
                percent={percentage} 
                size="small" 
                status={percentage === 0 ? 'exception' : 'active'}
                className="flex-1"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {compositeInfo.currentStock}/{compositeInfo.capacity.quantity} {compositeInfo.capacity.unit}
            </div>
          </div>
        );
      }
    },
    {
      title: t('TXT_STATUS'),
      dataIndex: 'statusInfo',
      key: 'status',
      width: 120,
      render: (statusInfo, record) => {
        if (!statusInfo || !record.compositeInfo.lastPreparedAt) {
          return <Tag color="default">{t('TXT_NOT_PREPARED')}</Tag>;
        }

        const status = statusInfo.status;
        const hoursElapsed = statusInfo.hoursElapsed;

        return (
          <div>
            <Tag 
              color={getStatusColor(status)} 
              icon={getStatusIcon(status)}
            >
              {t(`TXT_STATUS_${status.toUpperCase()}`)}
            </Tag>
            <div className="text-xs text-gray-500 mt-1">
              {formatHoursElapsed(hoursElapsed)} {t('TXT_AGO')}
            </div>
          </div>
        );
      }
    },
    {
      title: t('TXT_COST_PRICE'),
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 120,
      render: (price) => (
        <Text className="text-sm">{formatPrice(parseDecimal(price))}</Text>
      )
    },
    {
      title: t('TXT_RETAIL_PRICE'),
      dataIndex: 'retailPrice',
      key: 'retailPrice',
      width: 120,
      render: (price) => (
        <Text className="text-sm font-medium">{formatPrice(parseDecimal(price))}</Text>
      )
    },
    {
      title: t('TXT_ACTIONS'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('TXT_PREPARE_COMPOSITE')}>
            <Button
              type="primary"
              size="small"
              icon={<FireOutlined />}
              onClick={() => onPrepare(record)}
              loading={isProductPreparing(record._id)}
              disabled={isProductDeleting(record._id)}
            />
          </Tooltip>
          
          <Tooltip title={t('TXT_SERVE_COMPOSITE')}>
            <Button
              type="default"
              size="small"
              icon={<ShoppingOutlined />}
              onClick={() => onServe(record)}
              loading={isProductServing(record._id)}
              disabled={
                isProductDeleting(record._id) || 
                record.compositeInfo.currentStock === 0 ||
                (record.statusInfo && record.statusInfo.status === 'expired')
              }
            />
          </Tooltip>
          
          <Tooltip title={t('TXT_EDIT')}>
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              disabled={isProductDeleting(record._id)}
            />
          </Tooltip>
          
          <Popconfirm
            title={t('TITLE_CONFIRM_DELETE')}
            description={t('CONFIRM_DELETE_COMPOSITE_PRODUCT')}
            onConfirm={() => onDelete(record)}
            okText={t('TXT_CONFIRM')}
            cancelText={t('TXT_CANCEL')}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={isProductDeleting(record._id)}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
      onSelectionChange?.(newSelectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: isProductDeleting(record._id),
    }),
  };

  // Transform data for table
  const tableData = compositeProducts.map(product => ({
    ...product,
    key: product._id
  }));

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      rowSelection={rowSelection}
      loading={loading}
      scroll={{ x: 1200, y: 400 }}
      size="small"
      pagination={{
        total: tableData.length,
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} ${t('TXT_OF')} ${total} ${t('TXT_ITEMS')}`
      }}
      className="composite-product-table"
    />
  );
};

export default CompositeProductTable;
