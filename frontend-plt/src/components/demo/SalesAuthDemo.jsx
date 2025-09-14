import React from 'react';
import { Card, Button, Typography, Avatar, Space, Tag, Descriptions, message } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import useSalesAuth from '@/hooks/useSalesAuth';

const { Title, Text } = Typography;

const SalesAuthDemo = () => {
  const {
    employee,
    permissions,
    storeInfo,
    storeCode,
    currentShift,
    signOut,
    getEmployeeName,
    getEmployeeAvatar,
    canApplyDiscount,
    canProcessReturn,
    canVoidTransaction,
    canOpenCashDrawer,
    getMaxDiscount,
    isShiftActive
  } = useSalesAuth();

  const handleLogout = async () => {
    await signOut();
    message.success('Đăng xuất thành công!');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Avatar 
                size={64}
                src={getEmployeeAvatar()}
                icon={<UserOutlined />}
              />
              <div>
                <Title level={3} className="mb-1">Chào mừng, {getEmployeeName()}!</Title>
                <Text type="secondary">
                  {employee?.employeeCode} - {employee?.department}
                </Text>
                <div className="mt-2">
                  <Tag color="blue">Cửa hàng: {storeCode}</Tag>
                  {isShiftActive() ? (
                    <Tag color="green">Ca làm việc đang hoạt động</Tag>
                  ) : (
                    <Tag color="orange">Chưa bắt đầu ca</Tag>
                  )}
                </div>
              </div>
            </div>
            <Button 
              type="primary" 
              danger 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Đăng xuất
            </Button>
          </div>
        </Card>

        {/* Permissions */}
        <Card title="Quyền hạn POS">
          <Space direction="vertical" className="w-full">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text strong>Áp dụng giảm giá: </Text>
                {canApplyDiscount() ? (
                  <Tag color="green">Có (tối đa {getMaxDiscount()}%)</Tag>
                ) : (
                  <Tag color="red">Không</Tag>
                )}
              </div>
              
              <div>
                <Text strong>Xử lý trả hàng: </Text>
                {canProcessReturn() ? (
                  <Tag color="green">Có</Tag>
                ) : (
                  <Tag color="red">Không</Tag>
                )}
              </div>
              
              <div>
                <Text strong>Hủy giao dịch: </Text>
                {canVoidTransaction() ? (
                  <Tag color="green">Có</Tag>
                ) : (
                  <Tag color="red">Không</Tag>
                )}
              </div>
              
              <div>
                <Text strong>Mở ngăn kéo tiền: </Text>
                {canOpenCashDrawer() ? (
                  <Tag color="green">Có</Tag>
                ) : (
                  <Tag color="red">Không</Tag>
                )}
              </div>
            </div>
          </Space>
        </Card>

        {/* Store Info */}
        <Card title="Thông tin cửa hàng">
          <Descriptions column={2}>
            <Descriptions.Item label="Mã cửa hàng">{storeCode}</Descriptions.Item>
            <Descriptions.Item label="Tên cửa hàng">{storeInfo?.name}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{storeInfo?.address}</Descriptions.Item>
            <Descriptions.Item label="Điện thoại">{storeInfo?.phone}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Current Shift */}
        {currentShift && (
          <Card title="Ca làm việc hiện tại">
            <Descriptions column={2}>
              <Descriptions.Item label="Bắt đầu lúc">
                {new Date(currentShift.startTime).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Tiền mặt ban đầu">
                {currentShift.initialCash?.toLocaleString('vi-VN')} VND
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Debug Info */}
        <Card title="Debug Information" className="bg-gray-50">
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              employee,
              permissions,
              storeInfo,
              currentShift
            }, null, 2)}
          </pre>
        </Card>
      </div>
    </div>
  );
};

export default SalesAuthDemo;