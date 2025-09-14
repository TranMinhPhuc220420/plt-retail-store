import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';

import useSalesAuth from '@/hooks/useSalesAuth';

const SalesLoginPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { storeCode } = useParams();

  // Ant Design message
  const [messageApi, contextHolder] = message.useMessage();

  const {
    login,
    isLoading,
    isAuthenticated,
    isError,
    errorMessage,
    clearError
  } = useSalesAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/store/${storeCode}`, { replace: true });
    }
  }, [isAuthenticated, navigate, storeCode]);

  // Show error message
  useEffect(() => {
    if (isError && errorMessage) {
      message.error(errorMessage);
      clearError();
    }
  }, [isError, errorMessage, clearError]);

  const handleSubmit = async (values) => {
    const data = await login({
      username: values.username,
      password: values.password,
      storeCode
    });

    const { employee, store } = data;
    if (employee && store) {
      message.success('Đăng nhập thành công!');
      navigate(`/store/${storeCode}`, { replace: true });
    } else {
      // Error handling is done in the useEffect above
      message.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.');
    }
  };

  return (
    <Spin spinning={isLoading} tip="Đang đăng nhập...">

      {contextHolder}

      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Đăng nhập Bán hàng</h1>
            <p className="text-gray-600 mt-2">Dành cho nhân viên bán hàng</p>
            {storeCode && (
              <p className="text-blue-600 text-sm mt-1">Cửa hàng: {storeCode}</p>
            )}
          </div>

          <Form
            form={form}
            name="sales_login"
            onFinish={handleSubmit}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[
                { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập tên đăng nhập"
                size="large"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
                size="large"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                size="large"
                className="w-full"
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center text-gray-500">
            <p>Cần hỗ trợ? Liên hệ quản lý cửa hàng</p>
          </div>
        </Card>
      </div>
    </Spin>
  );
};

export default SalesLoginPage;