import React, { useState } from 'react';
import { 
  Upload, 
  Avatar, 
  Button, 
  message,
  Modal,
  Typography,
  Card
} from 'antd';
import { 
  UserOutlined, 
  UploadOutlined, 
  DeleteOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const AvatarUpload = ({ currentAvatar, onUpload, loading }) => {
  const [preview, setPreview] = useState({
    visible: false,
    image: '',
    title: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const { t } = useTranslation();

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error(t('MSG_ONLY_IMAGE_FILES'));
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(t('MSG_IMAGE_TOO_LARGE'));
      return false;
    }

    return false; // Prevent auto upload, we'll handle it manually
  };

  const handleChange = async (info) => {
    const file = info.file;

    if (file && file.status !== 'removed') {
      setIsUploading(true);
      try {
        const success = await onUpload(file);
        if (success) {
          message.success(t('MSG_AVATAR_UPLOADED_SUCCESS'));
        }
      } catch (error) {
        message.error(t('MSG_AVATAR_UPLOAD_FAILED'));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      const success = await onUpload(file);
      if (success) {
        onSuccess(file);
      } else {
        onError(new Error('Upload failed'));
      }
    } catch (error) {
      onError(error);
    }
  };

  const handlePreview = () => {
    setPreview({
      visible: true,
      image: currentAvatar,
      title: t('TXT_CURRENT_AVATAR')
    });
  };

  const handleCancel = () => {
    setPreview({ ...preview, visible: false });
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <Card styles={{ body: { padding: '32px' } }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
            <Avatar 
              size={150} 
              src={currentAvatar} 
              icon={<UserOutlined />}
              style={{ 
                border: '4px solid #f0f0f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }}
            />
            {currentAvatar && (
              <Button 
                shape="circle"
                icon={<EyeOutlined />}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderColor: 'transparent',
                  color: 'white'
                }}
                onClick={handlePreview}
                size="small"
              />
            )}
          </div>
          
          <div>
            <Title level={4} style={{ marginBottom: '8px' }}>{t('TXT_PROFILE_AVATAR')}</Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {t('TXT_AVATAR_DESCRIPTION')}
            </Text>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            disabled={loading || isUploading}
          >
            <Button 
              icon={<UploadOutlined />}
              loading={loading || isUploading}
              type="primary"
              size="large"
            >
              {t('TXT_UPLOAD_NEW_AVATAR')}
            </Button>
          </Upload>

          {currentAvatar && (
            <Button 
              icon={<DeleteOutlined />}
              danger
              size="large"
              disabled={loading || isUploading}
              onClick={() => {
                Modal.confirm({
                  title: t('TXT_REMOVE_AVATAR'),
                  content: t('MSG_REMOVE_AVATAR_CONFIRM'),
                  onOk: () => onUpload(null),
                  okText: t('TXT_REMOVE'),
                  cancelText: t('TXT_CANCEL')
                });
              }}
            >
              {t('TXT_REMOVE')}
            </Button>
          )}
        </div>

        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            <strong>📋 {t('TXT_AVATAR_GUIDELINES')}:</strong><br />
            • <strong>{t('TXT_AVATAR_FORMATS')}:</strong> {t('TXT_AVATAR_GUIDELINES_FORMATS')}<br />
            • <strong>{t('TXT_AVATAR_SIZE')}:</strong> {t('TXT_AVATAR_GUIDELINES_SIZE')}<br />
            • <strong>{t('TXT_AVATAR_DIMENSIONS')}:</strong> {t('TXT_AVATAR_GUIDELINES_DIMENSIONS')}<br />
            • <strong>{t('TXT_AVATAR_QUALITY')}:</strong> {t('TXT_AVATAR_GUIDELINES_QUALITY')}
          </Text>
        </div>
      </Card>

      <Modal
        open={preview.visible}
        title={preview.title}
        footer={null}
        onCancel={handleCancel}
        centered
        width={600}
      >
        <img 
          alt="avatar preview" 
          style={{ width: '100%', borderRadius: '8px' }} 
          src={preview.image} 
        />
      </Modal>
    </div>
  );
};

export default AvatarUpload;
