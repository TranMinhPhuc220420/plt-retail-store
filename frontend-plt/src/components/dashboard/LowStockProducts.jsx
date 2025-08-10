import { Card, Table, Tag, Progress, Button, Space, Avatar } from 'antd';
import { ExclamationCircleOutlined, ShoppingCartOutlined, WarningOutlined, StopOutlined } from '@ant-design/icons';

const LowStockProducts = ({ data, onReorder, onViewProduct }) => {
  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            size={48}
            src={record.image}
            icon={<ShoppingCartOutlined />}
            className="flex-shrink-0 border-2 border-gray-200"
            style={{ backgroundColor: '#f0f0f0' }}
          />
          <div>
            <div className="font-semibold text-gray-900">{text}</div>
            <div className="text-sm text-gray-500 font-mono">{record.sku}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Stock Level',
      dataIndex: 'stockLevel',
      key: 'stockLevel',
      width: 200,
      render: (_, record) => {
        const percentage = (record.currentStock / record.minStock) * 100;
        let status = 'normal';
        let strokeColor = '#52c41a';
        
        if (percentage <= 0) {
          status = 'exception';
          strokeColor = '#ff4d4f';
        } else if (percentage <= 25) {
          status = 'exception';
          strokeColor = '#ff7a45';
        } else if (percentage <= 50) {
          status = 'active';
          strokeColor = '#faad14';
        }
        
        return (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {record.currentStock} / {record.minStock}
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(percentage)}%
              </span>
            </div>
            <Progress 
              percent={Math.min(percentage, 100)} 
              status={status}
              strokeColor={strokeColor}
              size="small"
              showInfo={false}
              className="mb-0"
            />
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const percentage = (record.currentStock / record.minStock) * 100;
        
        if (percentage <= 0) {
          return (
            <Tag 
              color="red" 
              icon={<StopOutlined />}
              className="font-medium px-3 py-1"
            >
              OUT OF STOCK
            </Tag>
          );
        } else if (percentage <= 25) {
          return (
            <Tag 
              color="volcano" 
              icon={<ExclamationCircleOutlined />}
              className="font-medium px-3 py-1"
            >
              CRITICAL
            </Tag>
          );
        } else if (percentage <= 50) {
          return (
            <Tag 
              color="orange" 
              icon={<WarningOutlined />}
              className="font-medium px-3 py-1"
            >
              LOW STOCK
            </Tag>
          );
        }
        return (
          <Tag 
            color="green"
            className="font-medium px-3 py-1"
          >
            IN STOCK
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<ShoppingCartOutlined />}
            onClick={() => onReorder && onReorder(record)}
            className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
          >
            Reorder
          </Button>
          <Button
            type="text"
            size="small"
            onClick={() => onViewProduct && onViewProduct(record)}
            className="text-gray-600 hover:text-gray-800"
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const getRowClassName = (record) => {
    const percentage = (record.currentStock / record.minStock) * 100;
    if (percentage <= 0) return 'bg-red-50 border-l-4 border-l-red-500';
    if (percentage <= 25) return 'bg-orange-50 border-l-4 border-l-orange-500';
    if (percentage <= 50) return 'bg-yellow-50 border-l-4 border-l-yellow-500';
    return '';
  };

  return (
    <Card 
      className="mb-8 shadow-md border-0"
      styles={{ body: { padding: '24px' } }}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
              <ExclamationCircleOutlined className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                Low Stock Products
                <Tag 
                  color="orange" 
                  className="ml-3 font-semibold px-2 py-1"
                >
                  {data.length} items
                </Tag>
              </h3>
              <p className="text-gray-600 text-sm">Products that need immediate attention</p>
            </div>
          </div>
          <Button type="link" className="text-blue-600 font-medium">
            View All Inventory →
          </Button>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        pagination={{ 
          pageSize: 8, 
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} products`
        }}
        scroll={{ x: 800 }}
        size="middle"
        rowKey="id"
        rowClassName={getRowClassName}
        locale={{
          emptyText: (
            <div className="py-8 text-center">
              <div className="text-gray-400 mb-2">
                <ShoppingCartOutlined style={{ fontSize: '48px' }} />
              </div>
              <div className="text-gray-600 font-medium">All products are well stocked!</div>
              <div className="text-gray-500 text-sm">No low stock alerts at this time.</div>
            </div>
          )
        }}
      />
    </Card>
  );
};

export default LowStockProducts;
