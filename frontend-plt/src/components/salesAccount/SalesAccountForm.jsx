import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  InputNumber,
  Switch,
  Typography,
  Space,
  message,
  Divider,
  Spin,
  Avatar
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getAvailableEmployees } from '@/request/salesAccount';

const { Option } = Select;
const { Title, Text } = Typography;

const SalesAccountForm = ({ 
  mode = 'create', 
  account = null, 
  storeId, 
  onSuccess, 
  onCancel, 
  loading = false 
}) => {
  const [form] = Form.useForm();
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    if (mode === 'create' && storeId) {
      fetchAvailableEmployees();
    }
  }, [mode, storeId]);

  useEffect(() => {
    if (account && mode === 'edit') {
      // Populate form with existing account data
      const formData = {
        employeeId: account._id,
        username: account.salesCredentials?.username,
        'posPermissions.canApplyDiscount': account.posPermissions?.canApplyDiscount || false,
        'posPermissions.maxDiscountPercent': account.posPermissions?.maxDiscountPercent || 0,
        'posPermissions.canProcessReturn': account.posPermissions?.canProcessReturn || false,
        'posPermissions.canVoidTransaction': account.posPermissions?.canVoidTransaction || false,
        'posPermissions.canOpenCashDrawer': account.posPermissions?.canOpenCashDrawer || false,
      };
      form.setFieldsValue(formData);
    } else {
      // Reset form for create mode
      form.resetFields();
      form.setFieldsValue({
        'posPermissions.canApplyDiscount': false,
        'posPermissions.maxDiscountPercent': 0,
        'posPermissions.canProcessReturn': false,
        'posPermissions.canVoidTransaction': false,
        'posPermissions.canOpenCashDrawer': false,
      });
    }
  }, [account, mode, form]);

  const fetchAvailableEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await getAvailableEmployees(storeId);
      console.log(response);
      
      setAvailableEmployees(response.docs || []);
    } catch (error) {
      console.error('Error fetching available employees:', error);
      message.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const formData = {
        ...values,
        posPermissions: {
          canApplyDiscount: values.posPermissions?.canApplyDiscount || false,
          maxDiscountPercent: values.posPermissions?.maxDiscountPercent || 0,
          canProcessReturn: values.posPermissions?.canProcessReturn || false,
          canVoidTransaction: values.posPermissions?.canVoidTransaction || false,
          canOpenCashDrawer: values.posPermissions?.canOpenCashDrawer || false,
        }
      };

      if (onSuccess) {
        await onSuccess(formData);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const formLayout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };

  return (
    <Spin spinning={loading}>
      <Form
        {...formLayout}
        form={form}
        onFinish={handleSubmit}
        layout="horizontal"
      >
        {mode === 'create' && (
          <Form.Item
            name="employeeId"
            label="Chọn nhân viên"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
          >
            <Select 
              placeholder="Chọn nhân viên để tạo tài khoản..."
              showSearch
              loading={loadingEmployees}
              optionLabelProp="label"
              filterOption={(input, option) => {
                const searchText = input.toLowerCase();
                const employeeData = option.employeeData;
                if (!employeeData) return false;
                
                const fullName = `${employeeData.firstName} ${employeeData.lastName}`.toLowerCase();
                const employeeCode = employeeData.employeeCode?.toLowerCase() || '';
                const department = employeeData.department?.toLowerCase() || '';
                
                return fullName.includes(searchText) || 
                       employeeCode.includes(searchText) || 
                       department.includes(searchText);
              }}
            >
              {availableEmployees.map(emp => (
                <Option 
                  key={emp._id} 
                  value={emp._id}
                  label={`${emp.firstName} ${emp.lastName} (${emp.employeeCode})`}
                  employeeData={emp}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar 
                      size="small"
                      src={emp.avatar ? emp.avatar : null}
                      icon={!emp.avatar ? <UserOutlined /> : null}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {emp.employeeCode} - {emp.department}
                      </div>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {mode === 'edit' && (
          <Form.Item label="Nhân viên">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar 
                size={40}
                src={account?.avatar ? `/upload/employees/${account.avatar}` : null}
                icon={!account?.avatar ? <UserOutlined /> : null}
              />
              <div>
                <Text strong>{account?.firstName} {account?.lastName}</Text>
                <div className="text-sm text-gray-500">
                  {account?.employeeCode} - {account?.department}
                </div>
              </div>
            </div>
          </Form.Item>
        )}

        <Form.Item
          name="username"
          label="Tên đăng nhập"
          rules={[
            { required: mode === 'create', message: 'Vui lòng nhập tên đăng nhập' },
            { min: 3, message: 'Tên đăng nhập tối thiểu 3 ký tự' },
            { max: 50, message: 'Tên đăng nhập tối đa 50 ký tự' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: 'Chỉ được sử dụng chữ, số và dấu gạch dưới' }
          ]}
        >
          <Input 
            placeholder="Ví dụ: nhanvien01" 
            disabled={mode === 'edit'}
          />
        </Form.Item>

        {mode === 'create' && (
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
              { max: 100, message: 'Mật khẩu tối đa 100 ký tự' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu..." />
          </Form.Item>
        )}

        <Divider>Phân quyền POS</Divider>

        <Form.Item
          name={['posPermissions', 'canApplyDiscount']}
          label="Được phép giảm giá"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['posPermissions', 'maxDiscountPercent']}
          label="% giảm giá tối đa"
          dependencies={[['posPermissions', 'canApplyDiscount']]}
        >
          <InputNumber 
            min={0} 
            max={100} 
            style={{ width: '100%' }}
            formatter={value => `${value}%`}
            parser={value => value.replace('%', '')}
            disabled={!form.getFieldValue(['posPermissions', 'canApplyDiscount'])}
          />
        </Form.Item>

        <Form.Item
          name={['posPermissions', 'canProcessReturn']}
          label="Xử lý trả hàng"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['posPermissions', 'canVoidTransaction']}
          label="Hủy giao dịch"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['posPermissions', 'canOpenCashDrawer']}
          label="Mở ngăn kéo tiền"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {mode === 'create' ? 'Tạo tài khoản' : 'Cập nhật'}
            </Button>
            <Button onClick={onCancel}>
              Hủy
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Spin>
  );
};

export default SalesAccountForm;