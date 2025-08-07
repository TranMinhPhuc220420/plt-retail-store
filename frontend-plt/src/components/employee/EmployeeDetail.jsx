import React from 'react';
import {
  Descriptions,
  Tag,
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Space,
  Divider,
  Badge
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  HomeOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;

const EmployeeDetail = ({ employee }) => {
  if (!employee) return null;

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager': return 'blue';
      case 'staff': return 'green';
      default: return 'default';
    }
  };

  const getDepartmentColor = (department) => {
    const colors = {
      'sales': 'cyan',
      'kitchen': 'orange',
      'cashier': 'purple',
      'inventory': 'geekblue',
      'management': 'red'
    };
    return colors[department] || 'default';
  };

  const formatCurrency = (amount, currency = 'VND') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatSalaryType = (type) => {
    switch (type) {
      case 'hourly': return 'Theo giờ';
      case 'daily': return 'Theo ngày';
      case 'monthly': return 'Theo tháng';
      default: return type;
    }
  };

  const formatContractType = (type) => {
    switch (type) {
      case 'full-time': return 'Toàn thời gian';
      case 'part-time': return 'Bán thời gian';
      case 'contract': return 'Hợp đồng';
      case 'intern': return 'Thực tập';
      default: return type;
    }
  };

  const formatDepartment = (department) => {
    switch (department) {
      case 'sales': return 'Bán hàng';
      case 'kitchen': return 'Bếp';
      case 'cashier': return 'Thu ngân';
      case 'inventory': return 'Kho';
      case 'management': return 'Quản lý';
      default: return department;
    }
  };

  return (
    <div className="employee-detail">
      <Row gutter={24}>
        {/* Basic Information Card */}
        <Col span={24}>
          <Card style={{ marginBottom: 16 }}>
            <Row align="middle" gutter={24}>
              <Col span={4}>
                <Avatar 
                  size={80} 
                  src={employee.avatar} 
                  icon={<UserOutlined />}
                />
              </Col>
              <Col span={20}>
                <Space direction="vertical" size="small">
                  <Title level={3} style={{ margin: 0 }}>
                    {employee.fullName || `${employee.firstName} ${employee.lastName}`}
                  </Title>
                  <Space>
                    <Tag color={getRoleColor(employee.role)}>
                      {employee.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                    </Tag>
                    <Tag color={getDepartmentColor(employee.department)}>
                      {formatDepartment(employee.department)}
                    </Tag>
                    <Badge 
                      status={employee.isActive ? 'success' : 'error'} 
                      text={employee.isActive ? 'Hoạt động' : 'Không hoạt động'} 
                    />
                  </Space>
                  <Text strong>{employee.employeeCode}</Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Personal Information */}
        <Col span={12}>
          <Card title="Thông tin cá nhân" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item 
                label={<Space><MailOutlined /> Email</Space>}
              >
                {employee.email}
              </Descriptions.Item>
              <Descriptions.Item 
                label={<Space><PhoneOutlined /> Số điện thoại</Space>}
              >
                {employee.phone}
              </Descriptions.Item>
              <Descriptions.Item 
                label={<Space><CalendarOutlined /> Ngày sinh</Space>}
              >
                {employee.dateOfBirth ? 
                  moment(employee.dateOfBirth).format('DD/MM/YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item 
                label={<Space><HomeOutlined /> Địa chỉ</Space>}
              >
                {employee.address ? (
                  <div>
                    {employee.address.street && <div>{employee.address.street}</div>}
                    {employee.address.city && <span>{employee.address.city}</span>}
                    {employee.address.zipCode && <span>, {employee.address.zipCode}</span>}
                    {employee.address.country && <div>{employee.address.country}</div>}
                  </div>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Employment Information */}
        <Col span={12}>
          <Card title="Thông tin công việc" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Chức vụ">
                {employee.position || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày vào làm">
                {employee.hireDate ? 
                  moment(employee.hireDate).format('DD/MM/YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Loại hợp đồng">
                {formatContractType(employee.contractType)}
              </Descriptions.Item>
              <Descriptions.Item 
                label={<Space><TeamOutlined /> Quản lý trực tiếp</Space>}
              >
                {employee.managerId ? (
                  <div>
                    {employee.managerId.fullName || 
                     `${employee.managerId.firstName} ${employee.managerId.lastName}`}
                    <br />
                    <Text type="secondary">{employee.managerId.employeeCode}</Text>
                  </div>
                ) : (
                  employee.role === 'manager' ? 'Không có' : 'Chưa phân công'
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Salary Information */}
        <Col span={12}>
          <Card title="Thông tin lương" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item 
                label={<Space><DollarOutlined /> Mức lương</Space>}
              >
                {employee.salary?.amount ? 
                  formatCurrency(employee.salary.amount, employee.salary.currency) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Loại lương">
                {employee.salary?.type ? formatSalaryType(employee.salary.type) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Emergency Contact */}
        <Col span={12}>
          <Card title="Người liên hệ khẩn cấp" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Tên">
                {employee.emergencyContact?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Mối quan hệ">
                {employee.emergencyContact?.relationship || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {employee.emergencyContact?.phone || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Store Information */}
        <Col span={12}>
          <Card title="Thông tin cửa hàng" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Tên cửa hàng">
                {employee.storeId?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Mã cửa hàng">
                {employee.storeId?.storeCode || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ cửa hàng">
                {employee.storeId?.address || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* System Information */}
        <Col span={12}>
          <Card title="Thông tin hệ thống" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Ngày tạo">
                {moment(employee.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {moment(employee.updatedAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Đăng nhập lần cuối">
                {employee.lastLoginAt ? 
                  moment(employee.lastLoginAt).format('DD/MM/YYYY HH:mm') : 'Chưa đăng nhập'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Work Schedule (if available) */}
        {employee.workSchedule && (
          <Col span={24}>
            <Card title="Lịch làm việc" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                {Object.entries(employee.workSchedule).map(([day, schedule]) => (
                  <Col span={8} key={day} style={{ marginBottom: 8 }}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Text strong>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                        <br />
                        {schedule.isWorkDay ? (
                          <Space>
                            <Text>{schedule.start}</Text>
                            <Text>-</Text>
                            <Text>{schedule.end}</Text>
                          </Space>
                        ) : (
                          <Text type="secondary">Nghỉ</Text>
                        )}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}

        {/* Notes */}
        {employee.notes && (
          <Col span={24}>
            <Card title="Ghi chú" style={{ marginBottom: 16 }}>
              <Text>{employee.notes}</Text>
            </Card>
          </Col>
        )}

        {/* Permissions (if available) */}
        {employee.permissions && employee.permissions.length > 0 && (
          <Col span={24}>
            <Card title="Quyền hạn" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                {employee.permissions.map((permission, index) => (
                  <Col span={12} key={index} style={{ marginBottom: 8 }}>
                    <Card size="small">
                      <Text strong>{permission.module}</Text>
                      <br />
                      <Space wrap>
                        {permission.actions.map(action => (
                          <Tag key={action} size="small">
                            {action === 'read' ? 'Xem' :
                             action === 'create' ? 'Tạo' :
                             action === 'update' ? 'Sửa' :
                             action === 'delete' ? 'Xóa' : action}
                          </Tag>
                        ))}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default EmployeeDetail;
