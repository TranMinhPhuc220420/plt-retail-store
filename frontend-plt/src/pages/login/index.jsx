import React, { useState } from 'react';

import { Form, Input, Button, message } from "antd";

// i18n
import { useTranslation } from 'react-i18next';

import GoogleIcon from "@/assets/images/google-icon.png";

// Hook components
import useAuth from "@/hooks/useAuth";

import Logo from "@/assets/favicon.ico";

// Styles
import styles from './index.module.css';

// Request module
import {  } from "@/request/auth";
import { DOMAIN_EMAIL_DEFAULT } from '@/constant';

const LoginPage = () => {
  // Use hooks state
  const { signInWithGoogle, signInWithUsernamePassword, registerWithUsernamePassword } = useAuth();
  
  // i18n
  const { t } = useTranslation();

  // Message API for notifications
  const [messageApi, contextHolder] = message.useMessage();

  // State
  const [isShowFormRegister, setIsShowFormRegister] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingUsernamePassword, setIsLoadingUsernamePassword] = useState(false);
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);

  const handlerLoginWithGoogle = async (event) => {
    event.preventDefault();

    // Set loading state for Google login
    setIsLoadingGoogle(true);

    // Call signInWithGoogle function from auth provider
    await signInWithGoogle();
  };

  const handlerLoginWithUsernamePassword = async (data) => {
    setIsLoadingUsernamePassword(true);

    // Additional params
    data.username = `${data.username}${DOMAIN_EMAIL_DEFAULT}`;

    await signInWithUsernamePassword(data);

    setIsLoadingUsernamePassword(false);
  };

  const handlerShowFormRegister = () => {
    setIsShowFormRegister(true);
  };
  const handlerHideFormRegister = () => {
    setIsShowFormRegister(false);
  };
  const handlerSubmitFormRegister = async (form) => {
    setIsLoadingRegister(true);

    // Additional params
    form.username = `${form.username}${DOMAIN_EMAIL_DEFAULT}`;

    await registerWithUsernamePassword(form);

    setIsLoadingRegister(false);
  };

  return (
    <div className={`flex flex-col items-center justify-center h-screen ${styles.page_login}`}>
      {contextHolder}

      {/* Card container login */}
      <div className="flex flex-col items-center justify-between bg-white shadow-md rounded-lg p-8 w-96">

        {/* Header */}
        <div className="flex items-center justify-center flex-col">

          {/* Logo */}
          <div className='flex items-center justify-center mb-4 w-24 h-24 p-3 rounded-full overflow-hidden shadow-md bg-white'>
            <img src={Logo} alt="Logo" className="w-full h-full object-cover" />
          </div>
          {/* Title and description */}
          <h1 className="text-2xl font-bold">
            {t('TXT_APP_NAME')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('TXT_APP_DESCRIPTION')}
          </p>
        </div>

        {/* Title and description */}
        <div className="content h-20 flex items-center justify-center flex-col">
          <Button className="flex items-center" 
            disabled={isLoadingGoogle || isLoadingUsernamePassword || isLoadingRegister} 
            loading={isLoadingGoogle}
            onClick={handlerLoginWithGoogle}
            style={{
              height: 45
            }}
          >
            {!isLoadingGoogle && <img src={GoogleIcon} alt="Google" className="w-8 h-8" />}
            <span className="ml-2">
              {isShowFormRegister ? t('TXT_REGISTER_WITH_GOOGLE') : t('TXT_LOGIN_WITH_GOOGLE')}
            </span>
          </Button>
        </div>

        <div className="flex justify-between items-center w-full my-4">
          {/* Line */}
          <div className="w-full border-t border-gray-300"></div>

          {/* Or */} 
          <p className="text-gray-500 mx-2 text-sm"> {t('TXT_OR')} </p>

          {/* Line */}
          <div className="w-full border-t border-gray-300"></div>
        </div>

        {/* Login by username password */}
        {!isShowFormRegister && (
          <Form name="login" className="w-full flex flex-col items-center justify-center mt-5"
            autoComplete="off"
            initialValues={{ remember: true }}
            onFinish={handlerLoginWithUsernamePassword}
          >
            
            <Form.Item name="username" rules={[
              { required: true, message: 'Username is required' }
            ]} 
              className="w-full"
              style={{ marginBottom: '10px' }}
            >
              <Input type="text" placeholder={t('TXT_USERNAME')}/>
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: 'Password is required' }]}
              className="w-full"
            >
              <Input.Password placeholder={t('TXT_PASSWORD')} />
            </Form.Item>

            <Form.Item shouldUpdate 
              style={{ marginTop: '10px' }}
            >
              <Button type="primary" htmlType="submit" className="w-full" 
                disabled={isLoadingGoogle || isLoadingUsernamePassword || isLoadingRegister} 
                loading={isLoadingUsernamePassword}
                style={{
                  height: 45
                }}
              >
                {t('TXT_LOGIN')}
              </Button>
            </Form.Item>

            <p className="text-gray-500 text-sm mt-8">
              {t('TXT_DONT_HAVE_ACCOUNT')}
              <span className="ml-1 text-blue-500 hover:underline cursor-pointer" onClick={handlerShowFormRegister}>
                {t('TXT_REGISTER')}
              </span>
            </p>

          </Form>
        )}
        {isShowFormRegister && (
          <div className="w-full flex flex-col items-center justify-center">

            <h2 className="text-xl font-semibold mb-4">
              {t('TXT_CREATE_ACCOUNT')}
            </h2>

            <Form name="register" className="w-full flex flex-col items-center justify-center mt-5"
              autoComplete="off"
              initialValues={{ remember: true }}
              onFinish={handlerSubmitFormRegister}
            >
              {/* Username */}
              <Form.Item name="username" rules={[
                { required: true, message: t('MSG_USERNAME_IS_REQUIRED') },
                ({ getFieldValue }) => ({ validator(_, value) {
                  let regex = /^[a-zA-Z0-9._-]+$/;
                  if (!value || regex.test(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('MSG_USERNAME_INVALID')));
                  },
                }),
              ]}
                className="w-full"
              >
                <Input type="text" placeholder={t('TXT_USERNAME')} />
              </Form.Item>

              {/* Password */}
              <Form.Item name="password" rules={[{ required: true, message: t('MSG_PASSWORD_IS_REQUIRED') }]}
                className="w-full"
                style={{ marginTop: '10px' }}
              >
                <Input.Password placeholder={t('TXT_PASSWORD')} />
              </Form.Item>

              {/* Confirm password */}
              <Form.Item name="confirmPassword" dependencies={['password']} 
                rules={[
                  { required: true, message: t('MSG_CONFIRM_PASSWORD_IS_REQUIRED') },
                  ({ getFieldValue }) => ({ validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('MSG_PASSWORD_MISMATCH')));
                    },
                  }),
                ]}
                style={{ marginTop: '10px' }}
                className="w-full"
              >
                <Input.Password placeholder={t('TXT_CONFIRM_PASSWORD')} />
              </Form.Item>

              {/* Fullname */}
              <Form.Item name="fullname" rules={[{ required: true, message: t('MSG_FULLNAME_IS_REQUIRED') }]}
                className="w-full"
                style={{ marginTop: '10px' }}
              >
                <Input type="text" placeholder={t('TXT_FULLNAME')} />
              </Form.Item>

              {/* email */}
              <Form.Item name="email" rules={[
                { type: 'email', message: t('MSG_EMAIL_INVALID') },
              ]}
                className="w-full"
                style={{ marginTop: '10px' }}
              >
                <Input type="email" placeholder={t('TXT_EMAIL')} />
              </Form.Item>

              <Form.Item shouldUpdate 
                style={{ marginTop: '10px' }}
              >
                <Button type="primary" htmlType="submit" className="w-full"
                  disabled={isLoadingGoogle || isLoadingUsernamePassword || isLoadingRegister}
                  loading={isLoadingRegister}
                  style={{
                    height: 45
                  }}
                >
                  {t('TXT_REGISTER')}
                </Button>
              </Form.Item>
            </Form>

            <p className="text-gray-500 text-sm mt-8">
              {t('TXT_ALREADY_HAVE_ACCOUNT')}
              <span className="ml-1 text-blue-500 hover:underline cursor-pointer" onClick={handlerHideFormRegister}>
                {t('TXT_BACK_TO_LOGIN')}
              </span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginPage;