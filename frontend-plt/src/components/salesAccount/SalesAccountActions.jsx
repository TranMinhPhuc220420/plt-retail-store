import React, { useState } from 'react';
import { 
  Button, 
  Dropdown, 
  Menu, 
  Modal, 
  Form,
  Input,
  message,
  Popconfirm 
} from 'antd';
import { 
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined
} from '@ant-design/icons';

const SalesAccountActions = ({ 
  account, 
  onEdit, 
  onToggleStatus, 
  onResetPassword, 
  onDelete,
  loading = false 
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleResetPassword = async (values) => {
    setPasswordLoading(true);
    try {
      await onResetPassword(account._id, values.newPassword);
      setShowPasswordModal(false);
      passwordForm.resetFields();
      message.success('Mật khẩu đã được đặt lại thành công');
    } catch (error) {
      message.error(error.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setPasswordLoading(false);
    }
  };

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Chỉnh sửa quyền',
      onClick: () => onEdit(account),
    },
    {
      key: 'toggle',
      icon: account.isActive ? <LockOutlined /> : <UnlockOutlined />,
      label: account.isActive ? 'Vô hiệu hóa' : 'Kích hoạt',
      onClick: () => onToggleStatus(account._id),
    },
    {
      key: 'reset-password',
      icon: <KeyOutlined />,
      label: 'Đặt lại mật khẩu',
      onClick: () => setShowPasswordModal(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Xóa tài khoản',
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: 'Xác nhận xóa tài khoản',
          content: (
            <div>
              <p>Bạn có chắc chắn muốn xóa tài khoản bán hàng của:</p>
              <p><strong>{account.firstName} {account.lastName}</strong></p>
              <p className="text-red-500">Hành động này không thể hoàn tác!</p>
            </div>
          ),
          okText: 'Xóa',
          okType: 'danger',
          cancelText: 'Hủy',
          onOk: () => onDelete(account._id),
        });
      },
    },
  ];

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Button 
          icon={<MoreOutlined />} 
          size="small"
          loading={loading}
        />
      </Dropdown>

      {/* Reset Password Modal */}
      <Modal
        title="Đặt lại mật khẩu"
        open={showPasswordModal}
        onCancel={() => {
          setShowPasswordModal(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <div className="mb-4">
          <p><strong>Nhân viên:</strong> {account.firstName} {account.lastName}</p>
          <p><strong>Username:</strong> {account.salesCredentials?.username}</p>
        </div>

        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleResetPassword}
        >
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
              { max: 100, message: 'Mật khẩu tối đa 100 ký tự' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới..." />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới..." />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end space-x-2">
              <Button onClick={() => {
                setShowPasswordModal(false);
                passwordForm.resetFields();
              }}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={passwordLoading}
              >
                Đặt lại mật khẩu
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SalesAccountActions;