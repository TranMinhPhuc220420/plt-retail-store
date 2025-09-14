import React from 'react';
import { Navigate, useParams } from 'react-router';
import { Spin, Result, Button } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import useSalesAuth from '@/hooks/useSalesAuth';

const ProtectedSalesRoute = ({ children }) => {
  const { storeCode } = useParams();
  
  const {
    isAuthenticated,
    isInitialized,
    isLoading,
    isError,
    errorMessage,
    employee,
    loadProfile,
    clearError
  } = useSalesAuth();

  // Show loading spinner while checking auth
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
          tip="Đang xác thực..."
        />
      </div>
    );
  }

  // Show error if auth verification failed
  if (isError && errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Result
          status="error"
          icon={<ExclamationCircleOutlined />}
          title="Lỗi xác thực"
          subTitle={errorMessage}
          extra={[
            <Button 
              type="primary" 
              key="retry"
              onClick={() => {
                clearError();
                loadProfile();
              }}
            >
              Thử lại
            </Button>,
            <Button 
              key="login"
              onClick={() => {
                clearError();
                window.location.href = `/store/${storeCode}/sales-login`;
              }}
            >
              Đăng nhập lại
            </Button>
          ]}
        />
      </div>
    );
  }

  // Redirect to login if not authenticated
  // if (!isAuthenticated || !employee) {
  //   return <Navigate to={`/store/${storeCode}/sales-login`} replace />;
  // }

  // Render protected content
  return children;
};

export default ProtectedSalesRoute;