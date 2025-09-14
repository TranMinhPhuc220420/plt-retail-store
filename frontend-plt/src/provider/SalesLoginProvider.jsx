import React from 'react';
import { useParams } from 'react-router';
import SalesAuthContext from '@/provider/SalesAuthContext';
import { salesLogin } from '@/request/auth';

// Simple provider chỉ cho login page - không có redirect logic
const SalesLoginProvider = ({ children }) => {
  const { storeCode } = useParams();

  const login = async (credentials) => {
    try {
      const data = await salesLogin(credentials);
      return data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <SalesAuthContext.Provider
      value={{
        login,
        storeCode,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
        isError: false,
        errorMessage: '',
        clearError: () => { }
      }}
    >
      {children}
    </SalesAuthContext.Provider>
  );
};

export default SalesLoginProvider;