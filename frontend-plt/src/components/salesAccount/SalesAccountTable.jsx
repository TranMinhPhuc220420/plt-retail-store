import React, { useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Badge,
  Card,
  Typography,
  Modal,
  message
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import useSalesAccountStore from '@/store/salesAccount';
import useStoreApp from '@/store/app';
import SalesAccountActions from './SalesAccountActions';
import SalesAccountForm from './SalesAccountForm';

const { Option } = Select;
const { Title, Text } = Typography;

const SalesAccountTable = () => {
  const { storeActive } = useStoreApp();
  
  const {
    salesAccounts,
    isLoading,
    pagination,
    filters,
    showCreateModal,
    showEditModal,
    editingAccount,
    error,
    success,
    
    // Actions
    fetchSalesAccounts,
    createSalesAccount,
    updateSalesAccount,
    toggleAccountStatus,
    resetPassword,
    deleteSalesAccount,
    
    // UI state setters
    setFilters,
    setPagination,
    setShowCreateModal,
    setEditingAccount,
    
    // Clear functions
    clearError,
    clearSuccess
  } = useSalesAccountStore();

  useEffect(() => {
    if (storeActive?._id) {
      fetchSalesAccounts(storeActive._id);
    }
  }, [storeActive?._id, fetchSalesAccounts]);

  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    if (success) {
      message.success(success);
      clearSuccess();
    }
  }, [success, clearSuccess]);

  const handleSearch = (value) => {
    setFilters({ search: value });
    setPagination({ current: 1 });
    if (storeActive?._id) {
      fetchSalesAccounts(storeActive._id);
    }
  };

  const handleStatusFilter = (status) => {
    setFilters({ status });
    setPagination({ current: 1 });
    if (storeActive?._id) {
      fetchSalesAccounts(storeActive._id);
    }
  };

  const handleDepartmentFilter = (department) => {
    setFilters({ department });
    setPagination({ current: 1 });
    if (storeActive?._id) {
      fetchSalesAccounts(storeActive._id);
    }
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({ current: page, pageSize });
    if (storeActive?._id) {
      fetchSalesAccounts(storeActive._id);
    }
  };

  const handleRefresh = () => {
    if (storeActive?._id) {
      fetchSalesAccounts(storeActive._id);
    }
  };

  const handleCreateSuccess = async (formData) => {
    if (storeActive?._id) {
      await createSalesAccount(storeActive._id, formData);
    }
  };

  const handleEditSuccess = async (formData) => {
    if (storeActive?._id && editingAccount?._id) {
      await updateSalesAccount(storeActive._id, editingAccount._id, {
        posPermissions: formData.posPermissions
      });
    }
  };

  const handleToggleStatus = async (employeeId) => {
    if (storeActive?._id) {
      await toggleAccountStatus(storeActive._id, employeeId);
    }
  };

  const handleResetPassword = async (employeeId, newPassword) => {
    if (storeActive?._id) {
      await resetPassword(storeActive._id, employeeId, newPassword);
    }
  };

  const handleDelete = async (employeeId) => {
    if (storeActive?._id) {
      await deleteSalesAccount(storeActive._id, employeeId);
    }
  };

  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.fullName}</div>
          <div className="text-sm text-gray-500">{record.employeeCode}</div>
        </div>
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (username) => (
        <Tag color="blue">{username}</Tag>
      ),
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      render: (department) => {
        const colorMap = {
          sales: 'green',
          cashier: 'blue',
          management: 'purple',
          kitchen: 'orange',
          inventory: 'cyan'
        };
        return <Tag color={colorMap[department] || 'default'}>{department}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Badge 
          status={isActive ? 'success' : 'default'} 
          text={isActive ? 'Hoạt động' : 'Vô hiệu hóa'} 
        />
      ),
    },
    {
      title: 'Quyền POS',
      key: 'permissions',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.posPermissions?.canApplyDiscount && (
            <Tag color="green" size="small">
              Giảm giá {record.posPermissions.maxDiscountPercent}%
            </Tag>
          )}
          {record.posPermissions?.canProcessReturn && (
            <Tag color="orange" size="small">Trả hàng</Tag>
          )}
          {record.posPermissions?.canVoidTransaction && (
            <Tag color="red" size="small">Hủy GD</Tag>
          )}
          {record.posPermissions?.canOpenCashDrawer && (
            <Tag color="purple" size="small">Mở két</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Lần cuối đăng nhập',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (lastLogin) => (
        <Text type="secondary">{lastLogin}</Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <SalesAccountActions
          account={record}
          onEdit={setEditingAccount}
          onToggleStatus={handleToggleStatus}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
        />
      ),
    },
  ];

  return (
    <Card>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <Title level={4} className="mb-1">Tài khoản Bán hàng</Title>
          <Text type="secondary">Quản lý tài khoản đăng nhập cho nhân viên bán hàng</Text>
        </div>
        <Space>
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isLoading}
          >
            Làm mới
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            Tạo tài khoản mới
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <div className="mb-4 flex space-x-4">
        <Input.Search 
          placeholder="Tìm theo tên, mã NV, username..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          onSearch={handleSearch}
          style={{ width: 300 }}
          allowClear
        />
        <Select 
          placeholder="Trạng thái"
          value={filters.status}
          onChange={handleStatusFilter}
          allowClear
          style={{ width: 150 }}
        >
          <Option value={true}>Hoạt động</Option>
          <Option value={false}>Vô hiệu hóa</Option>
        </Select>
        <Select 
          placeholder="Phòng ban"
          value={filters.department}
          onChange={handleDepartmentFilter}
          allowClear
          style={{ width: 150 }}
        >
          <Option value="sales">Bán hàng</Option>
          <Option value="cashier">Thu ngân</Option>
          <Option value="management">Quản lý</Option>
          <Option value="kitchen">Bếp</Option>
          <Option value="inventory">Kho</Option>
        </Select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={salesAccounts}
        loading={isLoading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} của ${total} tài khoản`,
          onChange: handlePageChange,
          onShowSizeChange: handlePageChange,
        }}
        scroll={{ x: 1200 }}
      />

      {/* Create Modal */}
      <Modal
        title="Tạo tài khoản bán hàng mới"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <SalesAccountForm
          mode="create"
          storeId={storeActive?._id}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
          loading={isLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Cập nhật quyền tài khoản"
        open={showEditModal}
        onCancel={() => setEditingAccount(null)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <SalesAccountForm
          mode="edit"
          account={editingAccount}
          storeId={storeActive?._id}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingAccount(null)}
          loading={isLoading}
        />
      </Modal>
    </Card>
  );
};

export default SalesAccountTable;