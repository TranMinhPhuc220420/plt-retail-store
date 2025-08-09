import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Progress,
  Typography,
  Alert
} from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const ChangePasswordForm = ({ onChange, loading }) => {
  const [form] = Form.useForm();
  const [password, setPassword] = useState('');
  const { t } = useTranslation();

  const handleSubmit = async (values) => {
    const success = await onChange(values);
    if (success) {
      form.resetFields();
      setPassword('');
    }
  };

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return score;

    // Length check
    if (pwd.length >= 6) score += 40;
    if (pwd.length >= 8) score += 20;

    // Character variety checks
    if (/[a-zA-Z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 20;

    return Math.min(score, 100);
  };

  const getPasswordStrengthText = (score) => {
    if (score < 40) return { text: t('TXT_PASSWORD_WEAK'), color: '#ff4d4f' };
    if (score < 80) return { text: t('TXT_PASSWORD_GOOD'), color: '#faad14' };
    return { text: t('TXT_PASSWORD_STRONG'), color: '#52c41a' };
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <div style={{ maxWidth: '500px' }}>
      <Alert
        message={t('TXT_PASSWORD_REQUIREMENTS')}
        description={
          <div style={{ marginTop: '8px' }}>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>{t('TXT_PASSWORD_REQUIREMENT_LENGTH')}</li>
              <li>{t('TXT_PASSWORD_REQUIREMENT_PATTERN')}</li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: '32px', borderRadius: '8px' }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={loading}
        size="large"
      >
        <Form.Item
          label={t('TXT_CURRENT_PASSWORD')}
          name="currentPassword"
          rules={[
            { required: true, message: t('MSG_CURRENT_PASSWORD_REQUIRED') }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder={t('PLACEHOLDER_CURRENT_PASSWORD')}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>

        <Form.Item
          label={t('TXT_NEW_PASSWORD')}
          name="newPassword"
          rules={[
            { required: true, message: t('MSG_NEW_PASSWORD_REQUIRED') },
            { min: 6, message: t('MSG_PASSWORD_MIN_LENGTH') },
            {
              pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
              message: t('MSG_PASSWORD_PATTERN')
            }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder={t('PLACEHOLDER_NEW_PASSWORD')}
            onChange={(e) => setPassword(e.target.value)}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>

        {password && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>{t('TXT_PASSWORD_STRENGTH')}</Text>
              <Text style={{ color: strengthInfo.color, fontWeight: 'bold', fontSize: '14px' }}>
                {strengthInfo.text}
              </Text>
            </div>
            <Progress 
              percent={passwordStrength} 
              strokeColor={strengthInfo.color}
              showInfo={false}
              size="small"
              style={{ height: '8px' }}
            />
          </div>
        )}

        <Form.Item
          label={t('TXT_CONFIRM_NEW_PASSWORD')}
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: t('MSG_CONFIRM_NEW_PASSWORD_REQUIRED') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('MSG_PASSWORDS_NOT_MATCH')));
              },
            }),
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder={t('PLACEHOLDER_CONFIRM_PASSWORD')}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: '32px' }}>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{ borderRadius: '8px', height: '48px', fontSize: '16px' }}
          >
            {t('TXT_CHANGE_PASSWORD')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ChangePasswordForm;
