import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Popconfirm,
  Switch,
  message,
  Modal,
  Tooltip,
  Badge,
  Dropdown,
  Menu
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  EyeOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { 
  getEmployees, 
  deleteEmployee, 
  updateEmployeeStatus,
  getEmployeeStats 
} from '@/request/employee';
import EmployeeForm from './EmployeeForm';
import EmployeeDetail from './EmployeeDetail';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const EmployeeList = ({ storeId, storeName }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    department: '',
    isActive: ''
  });
  const [stats, setStats] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'

  useEffect(() => {
    if (storeId) {
      fetchEmployees();
      fetchStats();
    }
  }, [storeId, pagination.current, pagination.pageSize, filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const data = await getEmployees(storeId, params);
      
      setEmployees(data.docs || []);
      setPagination(prev => ({
        ...prev,
        total: data.totalDocs || 0
      }));
    } catch (error) {
      message.error('Không thể tải danh sách nhân viên');
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getEmployeeStats(storeId);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (newPagination) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    }));
  };

  const handleCreate = () => {
    setSelectedEmployee(null);
    setFormMode('create');
    setModalVisible(true);
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormMode('edit');
    setModalVisible(true);
  };

  const handleView = (employee) => {
    setSelectedEmployee(employee);
    setDetailVisible(true);
  };

  const handleDelete = async (employeeId) => {
    try {
      await deleteEmployee(employeeId);
      message.success('Xóa nhân viên thành công');
      fetchEmployees();
      fetchStats();
    } catch (error) {
      message.error('Không thể xóa nhân viên');
    }
  };

  const handleStatusChange = async (employeeId, isActive) => {
    try {
      await updateEmployeeStatus(employeeId, isActive);
      message.success(isActive ? 'Kích hoạt nhân viên thành công' : 'Vô hiệu hóa nhân viên thành công');
      fetchEmployees();
      fetchStats();
    } catch (error) {
      message.error('Không thể cập nhật trạng thái nhân viên');
    }
  };

  const handleFormSuccess = () => {
    setModalVisible(false);
    fetchEmployees();
    fetchStats();
  };

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

  const getActionMenuItems = (record) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Xem chi tiết',
      onClick: () => handleView(record)
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Chỉnh sửa',
      onClick: () => handleEdit(record)
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Xóa',
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: 'Xác nhận xóa',
          content: `Bạn có chắc chắn muốn xóa nhân viên "${record.fullName}"?`,
          onOk: () => handleDelete(record._id)
        });
      }
    }
  ];

  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 120,
      fixed: 'left'
    },
    {
      title: 'Họ tên',
      key: 'fullName',
      width: 200,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <span>{record.fullName || `${record.firstName} ${record.lastName}`}</span>
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {role === 'manager' ? 'Quản lý' : 'Nhân viên'}
        </Tag>
      )
    },
    {
      title: 'Bộ phận',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (department) => (
        <Tag color={getDepartmentColor(department)}>
          {department === 'sales' ? 'Bán hàng' :
           department === 'kitchen' ? 'Bếp' :
           department === 'cashier' ? 'Thu ngân' :
           department === 'inventory' ? 'Kho' :
           department === 'management' ? 'Quản lý' : department}
        </Tag>
      )
    },
    {
      title: 'Quản lý',
      key: 'manager',
      width: 150,
      render: (_, record) => {
        if (record.managerId && record.managerId.fullName) {
          return (
            <Text>{record.managerId.fullName}</Text>
          );
        }
        return record.role === 'manager' ? <Text type="secondary">-</Text> : <Text type="secondary">Chưa phân công</Text>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          size="small"
          onChange={(checked) => handleStatusChange(record._id, checked)}
        />
      )
    },
    {
      title: 'Ngày vào làm',
      dataIndex: 'hireDate',
      key: 'hireDate',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown menu={{ items: getActionMenuItems(record) }}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  return (
    <div className="employee-list">
      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <div className="stat-card">
                <div className="stat-number">{stats.overview.total}</div>
                <div className="stat-label">Tổng nhân viên</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="stat-card">
                <div className="stat-number" style={{ color: '#52c41a' }}>
                  {stats.overview.active}
                </div>
                <div className="stat-label">Đang hoạt động</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="stat-card">
                <div className="stat-number" style={{ color: '#1890ff' }}>
                  {stats.overview.managers}
                </div>
                <div className="stat-label">Quản lý</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="stat-card">
                <div className="stat-number" style={{ color: '#13c2c2' }}>
                  {stats.overview.staff}
                </div>
                <div className="stat-label">Nhân viên</div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Danh sách nhân viên - {storeName}
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Thêm nhân viên
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchEmployees}>
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="Tìm kiếm theo tên, email, mã NV..."
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Vai trò"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('role', value)}
            >
              <Option value="manager">Quản lý</Option>
              <Option value="staff">Nhân viên</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Bộ phận"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('department', value)}
            >
              <Option value="sales">Bán hàng</Option>
              <Option value="kitchen">Bếp</Option>
              <Option value="cashier">Thu ngân</Option>
              <Option value="inventory">Kho</Option>
              <Option value="management">Quản lý</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('isActive', value)}
            >
              <Option value="true">Hoạt động</Option>
              <Option value="false">Không hoạt động</Option>
            </Select>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} nhân viên`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={formMode === 'create' ? 'Thêm nhân viên mới' : 'Chỉnh sửa nhân viên'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <EmployeeForm
          employee={selectedEmployee}
          storeId={storeId}
          mode={formMode}
          onSuccess={handleFormSuccess}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Thông tin chi tiết nhân viên"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="edit" type="primary" onClick={() => {
            setDetailVisible(false);
            handleEdit(selectedEmployee);
          }}>
            Chỉnh sửa
          </Button>,
          <Button key="close" onClick={() => setDetailVisible(false)}>
            Đóng
          </Button>
        ]}
        width={1000}
      >
        {selectedEmployee && (
          <EmployeeDetail employee={selectedEmployee} />
        )}
      </Modal>

      <style>{`
        .stat-card {
          text-align: center;
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #1890ff;
        }
        .stat-label {
          color: #666;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default EmployeeList;
