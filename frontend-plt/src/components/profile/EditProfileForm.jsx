import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Row, 
  Col, 
  DatePicker,
  message
} from 'antd';
import { UserOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

const { TextArea } = Input;

const EditProfileForm = ({ profile, onUpdate, loading }) => {
  const [form] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        displayName: profile.displayName || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        dateOfBirth: profile.dateOfBirth ? moment(profile.dateOfBirth) : null,
        bio: profile.bio || ''
      });
    }
  }, [profile, form]);

  const handleFieldsChange = () => {
    setHasChanges(true);
  };

  const handleSubmit = async (values) => {
    const submitData = {
      ...values,
      dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null
    };

    const success = await onUpdate(submitData);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setHasChanges(false);
  };

  return (
    <div className='flex justify-center items-center p-4'>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFieldsChange={handleFieldsChange}
        disabled={loading}
        size="large"
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={t('TXT_FIRST_NAME')}
              name="firstName"
              rules={[
                { max: 50, message: t('MSG_FIRST_NAME_MAX_LENGTH') }
              ]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder={t('PLACEHOLDER_FIRST_NAME')}
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item
              label={t('TXT_LAST_NAME')}
              name="lastName"
              rules={[
                { max: 50, message: t('MSG_LAST_NAME_MAX_LENGTH') }
              ]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder={t('PLACEHOLDER_LAST_NAME')}
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('TXT_DISPLAY_NAME')}
          name="displayName"
          rules={[
            { max: 50, message: t('MSG_DISPLAY_NAME_MAX_LENGTH') }
          ]}
        >
          <Input 
            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} 
            placeholder={t('PLACEHOLDER_DISPLAY_NAME')}
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={t('TXT_PHONE')}
              name="phoneNumber"
              rules={[
                { 
                  pattern: /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/,
                  message: t('MSG_PHONE_INVALID')
                }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder={t('PLACEHOLDER_PHONE')}
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item
              label={t('TXT_DATE_OF_BIRTH')}
              name="dateOfBirth"
            >
              <DatePicker 
                style={{ width: '100%', borderRadius: '8px' }}
                placeholder={t('PLACEHOLDER_BIRTH_DATE')}
                disabledDate={(current) => {
                  const today = moment();
                  const maxAge = moment().subtract(120, 'years');
                  const minAge = moment().subtract(13, 'years');
                  return current && (current > minAge || current < maxAge);
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('TXT_ADDRESS')}
          name="address"
          rules={[
            { max: 200, message: t('MSG_ADDRESS_MAX_LENGTH') }
          ]}
        >
          <Input 
            prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />} 
            placeholder={t('PLACEHOLDER_ADDRESS')}
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>

        <Form.Item
          label={t('TXT_BIO')}
          name="bio"
          rules={[
            { max: 500, message: t('MSG_BIO_MAX_LENGTH') }
          ]}
        >
          <TextArea 
            rows={4}
            placeholder={t('PLACEHOLDER_BIO')}
            showCount
            maxLength={500}
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button 
              onClick={handleReset}
              disabled={!hasChanges || loading}
              size="large"
              style={{ borderRadius: '8px', minWidth: '100px' }}
            >
              {t('TXT_RESET')}
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              disabled={!hasChanges}
              size="large"
              style={{ borderRadius: '8px', minWidth: '120px' }}
            >
              {t('TXT_UPDATE_PROFILE')}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EditProfileForm;
