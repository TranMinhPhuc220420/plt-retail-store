import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  message,
  Spin,
  Avatar,
  Typography,
  Divider,
  Row,
  Col,
  Button,
  Space
} from 'antd';
import { UserOutlined, EditOutlined, LockOutlined, CameraOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import useAuth from "@/hooks/useAuth";
import EditProfileForm from '../../components/profile/EditProfileForm';
import ChangePasswordForm from '../../components/profile/ChangePasswordForm';
import AvatarUpload from '../../components/profile/AvatarUpload';
import { profileAPI } from '../../request/profile/index.js';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { user, loadProfile } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Initialize profile with user data from auth if available
    if (user) {
      setProfile({
        ...user,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || null,
        bio: user.bio || ''
      });
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { success, data } = await profileAPI.getProfile();
      setProfile(prevProfile => ({
        ...prevProfile,
        ...data
      }));
    } catch (error) {
      message.error(t('MSG_FAILED_TO_LOAD_PROFILE'));
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (values) => {
    try {
      setUpdating(true);
      const { success, data } = await profileAPI.updateProfile(values);
      setProfile(data);
      message.success(t('MSG_PROFILE_UPDATED_SUCCESS'));
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || t('MSG_PROFILE_UPDATE_FAILED'));
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (values) => {
    try {
      setUpdating(true);
      await profileAPI.changePassword(values);
      message.success(t('MSG_PASSWORD_CHANGED_SUCCESS'));
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || t('MSG_PASSWORD_CHANGE_FAILED'));
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpdate = async (file) => {
    if (!file) {
      // Handle remove avatar
      try {
        setUpdating(true);
        const response = await profileAPI.updateProfile({ avatar: null });
        setProfile(prev => ({
          ...prev,
          avatar: null
        }));
        message.success(t('MSG_AVATAR_REMOVED_SUCCESS'));
        return true;
      } catch (error) {
        message.error(error.response?.data?.message || t('MSG_AVATAR_REMOVE_FAILED'));
        return false;
      } finally {
        setUpdating(false);
      }
    }

    // Handle upload new avatar
    try {
      setUpdating(true);
      const response = await profileAPI.uploadAvatar(file);

      // Update avatar in profile
      const avatarUrl = response.avatar;
      const updateResponse = await profileAPI.updateProfile({ avatar: avatarUrl });

      setProfile(prev => ({
        ...prev,
        avatar: avatarUrl
      }));
      message.success(t('MSG_AVATAR_UPDATED_SUCCESS'));
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || t('MSG_AVATAR_UPDATE_FAILED'));
      return false;
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: '20px' }}>
        <Text type="danger">{t('MSG_FAILED_TO_LOAD_PROFILE')}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Row gutter={24}>
        <Col xs={24} lg={8}>
          {/* Profile Card */}
          <Card
            style={{ marginBottom: '24px', textAlign: 'center' }}
            styles={{ body: { padding: '32px 24px' } }}
          >
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
              <Avatar
                size={120}
                src={profile.avatar}
                icon={<UserOutlined />}
                style={{
                  border: '4px solid #fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<CameraOutlined />}
                size="small"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
                onClick={() => setActiveTab('avatar')}
              />
            </div>

            <Title level={3} style={{ margin: '0 0 8px 0', color: '#262626' }}>
              {profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username}
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>{profile.email}</Text>

            {profile.bio && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <Text italic>{profile.bio}</Text>
              </div>
            )}

            {/* Google OAuth info */}
            {profile.provider === 'google' && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '8px', border: '1px solid #91d5ff' }}>
                <Text style={{ fontSize: '12px', color: '#1890ff' }}>
                  🔒 {t('TXT_ACCOUNT_MANAGED_BY_GOOGLE')}
                </Text>
              </div>
            )}

            <Divider style={{ margin: '24px 0' }} />

            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                block
                onClick={() => setActiveTab('profile')}
              >
                {t('TXT_EDIT_PROFILE')}
              </Button>
              {/* Only show change password button for local users */}
              {profile.provider !== 'google' && (
                <Button
                  icon={<LockOutlined />}
                  block
                  onClick={() => setActiveTab('password')}
                >
                  {t('TXT_CHANGE_PASSWORD')}
                </Button>
              )}
            </Space>
          </Card>

          {/* Quick Info Card */}
          <Card title={t('TXT_QUICK_INFO')} size="small">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {profile.phoneNumber && (
                <div>
                  <Text type="secondary">{t('TXT_PHONE')}:</Text>
                  <br />
                  <Text strong>{profile.phoneNumber}</Text>
                </div>
              )}
              {profile.address && (
                <div>
                  <Text type="secondary">{t('TXT_ADDRESS')}:</Text>
                  <br />
                  <Text strong>{profile.address}</Text>
                </div>
              )}
              <div>
                <Text type="secondary">{t('TXT_MEMBER_SINCE')}:</Text>
                <br />
                <Text strong>{new Date(profile.createdAt).toLocaleDateString()}</Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          {/* Main Content Card */}
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="large"
              items={[
                {
                  key: 'profile',
                  label: (
                    <span>
                      <EditOutlined />
                      <span>
                        {t('TXT_PROFILE_INFORMATION')}
                      </span>
                    </span>
                  ),
                  children: (
                    <EditProfileForm
                      profile={profile}
                      onUpdate={handleProfileUpdate}
                      loading={updating}
                    />
                  )
                },
                {
                  key: 'avatar',
                  label: (
                    <span>
                      <CameraOutlined />
                      <span>
                        {t('TXT_AVATAR')}
                      </span>
                    </span>
                  ),
                  children: (
                    <AvatarUpload
                      currentAvatar={profile.avatar}
                      onUpload={handleAvatarUpdate}
                      loading={updating}
                    />
                  )
                },
                // Only show password tab for local users (not Google OAuth)
                ...(profile.provider !== 'google' ? [{
                  key: 'password',
                  label: (
                    <span>
                      <LockOutlined />
                      {t('TXT_SECURITY')}
                    </span>
                  ),
                  children: (
                    <ChangePasswordForm
                      onChange={handlePasswordChange}
                      loading={updating}
                    />
                  )
                }] : [])
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
