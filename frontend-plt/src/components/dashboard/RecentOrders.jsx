import { Card, Table, Tag, Avatar, Button, Space, Tooltip } from 'antd';
import { ShoppingOutlined, EyeOutlined, UserOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import moment from 'moment';

const RecentOrders = ({ data, onViewOrder, onViewCustomer }) => {
  const columns = [
    {
      title: 'Order',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      render: (text, record) => (
        <div>
          <div className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
            #{text}
          </div>
          <div className="text-xs text-gray-500 flex items-center mt-1">
            <CalendarOutlined className="mr-1" />
            {moment(record.orderDate).format('MMM DD, HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            size={40}
            src={record.customerAvatar}
            icon={<UserOutlined />}
            className="flex-shrink-0 border-2 border-gray-200"
            style={{ backgroundColor: '#f0f0f0' }}
          />
          <div>
            <div className="font-semibold text-gray-900">{text}</div>
            <div className="text-sm text-gray-500">{record.customerEmail}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      width: 100,
      render: (items) => (
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{items?.length || 0}</div>
          <div className="text-xs text-gray-500">
            {items?.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      render: (value) => (
        <div className="text-right">
          <div className="text-lg font-bold text-green-600 flex items-center justify-end">
            <DollarOutlined className="mr-1 text-sm" />
            {value?.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }) || '0.00'}
          </div>
          <div className="text-xs text-gray-500">USD</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const getStatusConfig = (status) => {
          switch (status?.toLowerCase()) {
            case 'pending':
              return { color: 'orange', text: 'PENDING' };
            case 'processing':
              return { color: 'blue', text: 'PROCESSING' };
            case 'shipped':
              return { color: 'cyan', text: 'SHIPPED' };
            case 'delivered':
              return { color: 'green', text: 'DELIVERED' };
            case 'cancelled':
              return { color: 'red', text: 'CANCELLED' };
            default:
              return { color: 'default', text: status?.toUpperCase() || 'UNKNOWN' };
          }
        };
        
        const config = getStatusConfig(status);
        return (
          <Tag 
            color={config.color}
            className="font-medium px-3 py-1"
          >
            {config.text}
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
          <Tooltip title="View Order Details">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewOrder && onViewOrder(record)}
              className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
            >
              View
            </Button>
          </Tooltip>
          <Tooltip title="View Customer Profile">
            <Button
              type="text"
              size="small"
              icon={<UserOutlined />}
              onClick={() => onViewCustomer && onViewCustomer(record)}
              className="text-gray-600 hover:text-gray-800"
            >
              Customer
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const getRowClassName = (record) => {
    const status = record.status?.toLowerCase();
    switch (status) {
      case 'pending':
        return 'bg-orange-50 border-l-4 border-l-orange-500';
      case 'processing':
        return 'bg-blue-50 border-l-4 border-l-blue-500';
      case 'delivered':
        return 'bg-green-50 border-l-4 border-l-green-500';
      case 'cancelled':
        return 'bg-red-50 border-l-4 border-l-red-500';
      default:
        return '';
    }
  };

  const totalRevenue = data.reduce((sum, order) => sum + (order.total || 0), 0);

  return (
    <Card 
      className="mb-8 shadow-md border-0"
      styles={{ body: { padding: '24px' } }}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
              <ShoppingOutlined className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                Recent Orders
                <Tag 
                  color="green" 
                  className="ml-3 font-semibold px-2 py-1"
                >
                  {data.length} orders
                </Tag>
              </h3>
              <p className="text-gray-600 text-sm">Latest customer orders and their status</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-xl font-bold text-green-600">
              ${totalRevenue.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
          </div>
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
            `${range[0]}-${range[1]} of ${total} orders`
        }}
        scroll={{ x: 900 }}
        size="middle"
        rowKey="id"
        rowClassName={getRowClassName}
        locale={{
          emptyText: (
            <div className="py-8 text-center">
              <div className="text-gray-400 mb-2">
                <ShoppingOutlined style={{ fontSize: '48px' }} />
              </div>
              <div className="text-gray-600 font-medium">No recent orders</div>
              <div className="text-gray-500 text-sm">Orders will appear here once customers start placing them.</div>
            </div>
          )
        }}
      />
    </Card>
  );
};

export default RecentOrders;
