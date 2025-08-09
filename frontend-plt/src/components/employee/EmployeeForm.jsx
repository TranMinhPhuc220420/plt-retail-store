import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  DatePicker,
  InputNumber,
  Switch,
  Card,
  Typography,
  Space,
  message,
  Divider,
  Upload,
  TimePicker
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import moment from 'moment';
import {
  createEmployee,
  updateEmployee,
  getManagers,
  uploadEmployeeAvatar
} from '@/request/employee';

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

const EmployeeForm = ({ employee, storeId, mode, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (storeId) {
      fetchManagers();
    }
  }, [storeId]);

  useEffect(() => {
    if (employee && mode === 'edit') {
      const formData = {
        ...employee,
        hireDate: employee.hireDate ? moment(employee.hireDate) : null,
        dateOfBirth: employee.dateOfBirth ? moment(employee.dateOfBirth) : null,
        'address.street': employee.address?.street,
        'address.city': employee.address?.city,
        'address.zipCode': employee.address?.zipCode,
        'address.country': employee.address?.country || 'Việt Nam',
        'salary.amount': employee.salary?.amount,
        'salary.currency': employee.salary?.currency || 'VND',
        'salary.type': employee.salary?.type || 'monthly',
        'emergencyContact.name': employee.emergencyContact?.name,
        'emergencyContact.relationship': employee.emergencyContact?.relationship,
        'emergencyContact.phone': employee.emergencyContact?.phone,
        managerId: employee.managerId?._id
      };
      form.setFieldsValue(formData);
      setImageUrl(employee.avatar || '');
    } else {
      form.resetFields();
      setImageUrl('');
      // Set default values for create mode
      form.setFieldsValue({
        isActive: true,
        contractType: 'full-time',
        department: 'sales',
        'salary.currency': 'VND',
        'salary.type': 'monthly',
        'address.country': 'Việt Nam'
      });
    }
  }, [employee, mode, form]);

  const fetchManagers = async () => {
    try {
      const response = await getManagers(storeId);
      setManagers(response.data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleAvatarChange = async (info) => {
    const file = info.file;

    if (file) {
      setIsUploadingImage(true);
      try {
        const uploadedImageUrl = await uploadEmployeeAvatar(file);
        setImageUrl(uploadedImageUrl);
        message.success('Tải ảnh đại diện thành công');
      } catch (error) {
        message.error('Tải ảnh đại diện thất bại');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Transform form data
      const employeeData = {
        ...values,
        storeId,
        ownerId: localStorage.getItem('userId'), // Assuming user ID is stored in localStorage
        hireDate: values.hireDate ? values.hireDate.toISOString() : undefined,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : undefined,
        avatar: imageUrl, // Use the uploaded image URL
        address: {
          street: values['address.street'],
          city: values['address.city'],
          zipCode: values['address.zipCode'],
          country: values['address.country']
        },
        salary: {
          amount: values['salary.amount'],
          currency: values['salary.currency'],
          type: values['salary.type']
        },
        emergencyContact: {
          name: values['emergencyContact.name'],
          relationship: values['emergencyContact.relationship'],
          phone: values['emergencyContact.phone']
        }
      };

      // Remove dotted notation fields to prevent conflicts
      delete employeeData['address.street'];
      delete employeeData['address.city'];
      delete employeeData['address.zipCode'];
      delete employeeData['address.country'];
      delete employeeData['salary.amount'];
      delete employeeData['salary.currency'];
      delete employeeData['salary.type'];
      delete employeeData['emergencyContact.name'];
      delete employeeData['emergencyContact.relationship'];
      delete employeeData['emergencyContact.phone'];

      // Remove undefined/null address fields
      Object.keys(employeeData.address).forEach(key => {
        if (!employeeData.address[key]) {
          delete employeeData.address[key];
        }
      });

      // Remove undefined/null emergency contact fields
      Object.keys(employeeData.emergencyContact).forEach(key => {
        if (!employeeData.emergencyContact[key]) {
          delete employeeData.emergencyContact[key];
        }
      });

      if (mode === 'create') {
        await createEmployee(employeeData);
        message.success('Tạo nhân viên thành công');
      } else {
        await updateEmployee(employee._id, employeeData);
        message.success('Cập nhật nhân viên thành công');
      }

      onSuccess();
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    if (role === 'manager') {
      form.setFieldsValue({ managerId: undefined });
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        isActive: true,
        contractType: 'full-time',
        department: 'sales',
        'salary.currency': 'VND',
        'salary.type': 'monthly',
        'address.country': 'Việt Nam'
      }}
    >
      <Row gutter={16}>
        {/* Basic Information */}
        <Col span={24}>
          <Card title="Thông tin cơ bản" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={20}>
              <Col span={24}>
                <Form.Item
                  name="avatar"
                >
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
                    <Upload
                      listType="picture-circle"
                      showUploadList={false}
                      beforeUpload={() => false}
                      accept="image/*"
                      disabled={isUploadingImage}
                      onChange={handleAvatarChange}
                    >
                      {imageUrl ? (
                        <img
                          style={{
                            cursor: 'pointer',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                          src={imageUrl}
                          alt="Avatar"
                        />
                      ) : (
                        <div style={{ cursor: 'pointer', padding: '20px' }}>
                          <UploadOutlined />
                          <div style={{ marginTop: 8 }}>
                            {isUploadingImage ? 'Đang tải...' : 'Tải ảnh lên'}
                          </div>
                        </div>
                      )}
                    </Upload>
                  </div>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="firstName"
                  label="Tên"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên' },
                    { min: 2, max: 50, message: 'Tên phải từ 2-50 ký tự' }
                  ]}
                >
                  <Input placeholder="Nhập tên" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lastName"
                  label="Họ"
                  rules={[
                    { required: true, message: 'Vui lòng nhập họ' },
                    { min: 2, max: 50, message: 'Họ phải từ 2-50 ký tự' }
                  ]}
                >
                  <Input placeholder="Nhập họ" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' }
                  ]}
                >
                  <Input placeholder="Nhập email" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' }
                  ]}
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dateOfBirth"
                  label="Ngày sinh"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="Chọn ngày sinh"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Address Information */}
        <Col span={24}>
          <Card title="Địa chỉ" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="address.street"
                  label="Địa chỉ"
                >
                  <Input placeholder="Số nhà, tên đường" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="address.city"
                  label="Thành phố"
                >
                  <Input placeholder="Thành phố" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="address.zipCode"
                  label="Mã bưu điện"
                >
                  <Input placeholder="Mã bưu điện" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="address.country"
                  label="Quốc gia"
                >
                  <Input placeholder="Quốc gia" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Employment Information */}
        <Col span={24}>
          <Card title="Thông tin công việc" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="role"
                  label="Vai trò"
                  rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                >
                  <Select
                    placeholder="Chọn vai trò"
                    onChange={handleRoleChange}
                  >
                    <Option value="manager">Quản lý</Option>
                    <Option value="staff">Nhân viên</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="department"
                  label="Bộ phận"
                  rules={[{ required: true, message: 'Vui lòng chọn bộ phận' }]}
                >
                  <Select placeholder="Chọn bộ phận">
                    <Option value="sales">Bán hàng</Option>
                    <Option value="kitchen">Bếp</Option>
                    <Option value="cashier">Thu ngân</Option>
                    <Option value="inventory">Kho</Option>
                    <Option value="management">Quản lý</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="contractType"
                  label="Loại hợp đồng"
                >
                  <Select placeholder="Chọn loại hợp đồng">
                    <Option value="full-time">Toàn thời gian</Option>
                    <Option value="part-time">Bán thời gian</Option>
                    <Option value="contract">Hợp đồng</Option>
                    <Option value="intern">Thực tập</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
                  noStyle
                >
                  {({ getFieldValue }) => (
                    <Form.Item
                      name="managerId"
                      label="Quản lý trực tiếp"
                    >
                      <Select
                        placeholder="Chọn quản lý trực tiếp"
                        allowClear
                        disabled={getFieldValue('role') === 'manager'}
                      >
                        {managers.map(manager => (
                          <Option key={manager._id} value={manager._id}>
                            {manager.fullName || `${manager.firstName} ${manager.lastName}`} ({manager.employeeCode})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="hireDate"
                  label="Ngày vào làm"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="Chọn ngày vào làm"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="position"
                  label="Chức vụ"
                >
                  <Input placeholder="Nhập chức vụ" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Salary Information */}
        <Col span={24}>
          <Card title="Thông tin lương" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="salary.amount"
                  label="Mức lương"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Nhập mức lương"
                    min={0}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="salary.currency"
                  label="Đơn vị tiền tệ"
                >
                  <Select placeholder="Chọn đơn vị tiền tệ">
                    <Option value="VND">VND</Option>
                    <Option value="USD">USD</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="salary.type"
                  label="Loại lương"
                >
                  <Select placeholder="Chọn loại lương">
                    <Option value="hourly">Theo giờ</Option>
                    <Option value="daily">Theo ngày</Option>
                    <Option value="monthly">Theo tháng</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Emergency Contact */}
        <Col span={24}>
          <Card title="Người liên hệ khẩn cấp" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="emergencyContact.name"
                  label="Tên người liên hệ"
                >
                  <Input placeholder="Nhập tên người liên hệ" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="emergencyContact.relationship"
                  label="Mối quan hệ"
                >
                  <Input placeholder="Ví dụ: Bố mẹ, vợ/chồng" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="emergencyContact.phone"
                  label="Số điện thoại"
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Status and Notes */}
        <Col span={24}>
          <Card title="Trạng thái và ghi chú" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="isActive"
                  label="Trạng thái hoạt động"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Hoạt động"
                    unCheckedChildren="Không hoạt động"
                  />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  name="notes"
                  label="Ghi chú"
                >
                  <TextArea
                    rows={3}
                    placeholder="Nhập ghi chú về nhân viên"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <Row justify="end" style={{ marginTop: 16 }}>
        <Space>
          <Button onClick={onCancel}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {mode === 'create' ? 'Tạo nhân viên' : 'Cập nhật'}
          </Button>
        </Space>
      </Row>
    </Form>
  );
};

export default EmployeeForm;
