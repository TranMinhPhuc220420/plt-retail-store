import { Card, List, Badge, Button, Tag, Avatar, Space, Divider } from 'antd';
import { 
  BellOutlined, 
  ExclamationCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined,
  EyeOutlined,
  CloseOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

const NotificationsAlerts = ({ data, onMarkAsRead, onDismiss, onViewDetails }) => {
  const { t } = useTranslation();
  const getNotificationIcon = (type, priority) => {
    const iconStyle = { fontSize: '16px' };
    
    switch (type) {
      case 'low_stock':
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#fa8c16' }} />;
      case 'order':
        return <ShoppingCartOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'user':
        return <UserOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'payment':
        return <DollarOutlined style={{ ...iconStyle, color: '#13c2c2' }} />;
      case 'system':
        return <InfoCircleOutlined style={{ ...iconStyle, color: '#722ed1' }} />;
      case 'warning':
        return <WarningOutlined style={{ ...iconStyle, color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ ...iconStyle, color: '#f5222d' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      default:
        return <BellOutlined style={{ ...iconStyle, color: '#8c8c8c' }} />;
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { color: 'red', text: t('TXT_HIGH_PRIORITY'), bgColor: 'bg-red-50 border-l-red-500' };
      case 'medium':
        return { color: 'orange', text: t('TXT_MEDIUM_PRIORITY'), bgColor: 'bg-orange-50 border-l-orange-500' };
      case 'low':
        return { color: 'blue', text: t('TXT_LOW_PRIORITY'), bgColor: 'bg-blue-50 border-l-blue-500' };
      default:
        return { color: 'default', text: t('TXT_NORMAL_PRIORITY'), bgColor: '' };
    }
  };

  const getTimeAgo = (timestamp) => {
    return moment(timestamp).fromNow();
  };

  const unreadCount = data.filter(item => !item.read).length;
  const highPriorityCount = data.filter(item => item.priority === 'high').length;

  return (
    <Card 
      className="mb-8 shadow-md border-0"
      styles={{ body: { padding: '24px' } }}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
              <Badge count={unreadCount} size="small">
                <BellOutlined className="text-white text-lg" />
              </Badge>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                {t('TXT_NOTIFICATIONS_ALERTS')}
                <Tag 
                  color="purple" 
                  className="ml-3 font-semibold px-2 py-1"
                >
                  {data.length} {t('TXT_TOTAL')}
                </Tag>
                {unreadCount > 0 && (
                  <Tag 
                    color="red" 
                    className="ml-2 font-semibold px-2 py-1"
                  >
                    {unreadCount} {t('TXT_UNREAD')}
                  </Tag>
                )}
              </h3>
              <p className="text-gray-600 text-sm">{t('TXT_IMPORTANT_UPDATES')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {highPriorityCount > 0 && (
              <div className="text-right">
                <div className="text-sm text-red-500">{t('TXT_HIGH_PRIORITY')}</div>
                <div className="text-xl font-bold text-red-600">{highPriorityCount}</div>
              </div>
            )}
            <Button type="link" className="text-blue-600 font-medium">
              {t('TXT_VIEW_ALL')} →
            </Button>
          </div>
        </div>
      }
    >
      <List
        itemLayout="vertical"
        dataSource={data}
        pagination={{
          pageSize: 6,
          size: 'small',
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} ${t('TXT_OF')} ${total} ${t('TXT_NOTIFICATIONS')}`
        }}
        renderItem={(item, index) => {
          const priorityConfig = getPriorityConfig(item.priority);
          
          return (
            <List.Item
              key={item.id}
              className={`
                ${!item.read ? 'bg-blue-50' : 'bg-white'} 
                ${priorityConfig.bgColor ? `border-l-4 ${priorityConfig.bgColor}` : ''} 
                rounded-lg mb-3 p-4 border border-gray-200 hover:shadow-sm transition-all duration-200
              `}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-start space-x-3 flex-1">
                  <Avatar
                    size={40}
                    icon={getNotificationIcon(item.type, item.priority)}
                    className="flex-shrink-0 border-2 border-gray-200"
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 text-base truncate flex-1">
                        {item.title}
                      </h4>
                      <div className="flex items-center space-x-2 ml-3">
                        <Tag 
                          color={priorityConfig.color}
                          className="font-medium px-2 py-1 text-xs"
                        >
                          {priorityConfig.text}
                        </Tag>
                        {!item.read && (
                          <Badge 
                            status="processing" 
                            text={<span className="text-xs font-medium text-blue-600">{t('TXT_NEW')}</span>}
                          />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {item.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 flex items-center">
                        <InfoCircleOutlined className="mr-1" />
                        {getTimeAgo(item.timestamp)}
                      </span>
                      
                      <Space size="small">
                        {!item.read && (
                          <Button
                            type="text"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={() => onMarkAsRead && onMarkAsRead(item.id)}
                            className="text-green-600 hover:text-green-700 text-xs"
                          >
                            {t('TXT_MARK_READ')}
                          </Button>
                        )}
                        
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => onViewDetails && onViewDetails(item)}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                        >
                          {t('TXT_DETAILS')}
                        </Button>
                        
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => onDismiss && onDismiss(item.id)}
                          className="text-gray-500 hover:text-gray-700 text-xs"
                        >
                          {t('TXT_DISMISS')}
                        </Button>
                      </Space>
                    </div>
                  </div>
                </div>
              </div>
              
              {index < data.length - 1 && <Divider className="my-0 mt-4" />}
            </List.Item>
          );
        }}
        locale={{
          emptyText: (
            <div className="py-8 text-center">
              <div className="text-gray-400 mb-2">
                <BellOutlined style={{ fontSize: '48px' }} />
              </div>
              <div className="text-gray-600 font-medium">{t('TXT_NO_NOTIFICATIONS')}</div>
              <div className="text-gray-500 text-sm">{t('TXT_NO_NOTIFICATIONS_DESC')}</div>
            </div>
          )
        }}
      />
    </Card>
  );
};

export default NotificationsAlerts;
