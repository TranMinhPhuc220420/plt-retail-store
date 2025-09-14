import { useRef, useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router";

import SalesAuthContext from "@/provider/SalesAuthContext";
import { salesLogin, getSalesMe } from "@/request/auth";

const INITIALIZE = "INITIALIZE";
const SIGN_OUT = "SIGN_OUT";
const IS_CHECKING = "IS_CHECKING";
const IS_ERROR = "IS_ERROR";
const UPDATE_PERMISSIONS = "UPDATE_PERMISSIONS";
const START_SHIFT = "START_SHIFT";
const END_SHIFT = "END_SHIFT";

const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  employee: null,
  permissions: null,
  currentShift: null,
  storeInfo: null,
  storeCode: null,

  isChecking: true,
  isError: false,
  errorMessage: '',
};

const reducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case INITIALIZE:
      const { isAuthenticated, employee, permissions, storeInfo, storeCode } = payload;
      return {
        ...state,
        isAuthenticated,
        isInitialized: true,
        employee,
        permissions,
        storeInfo,
        storeCode,
      };
    case SIGN_OUT:
      return {
        ...state,
        isAuthenticated: false,
        employee: null,
        permissions: null,
        currentShift: null,
        storeInfo: null,
        storeCode: null,
        isChecking: false,
        isError: false,
        errorMessage: '',
      };
    case IS_CHECKING:
      return {
        ...state,
        isChecking: payload.isChecking,
      };
    case IS_ERROR:
      return {
        ...state,
        isError: payload.isError,
        errorMessage: payload.errorMessage,
      };
    case UPDATE_PERMISSIONS:
      return {
        ...state,
        permissions: payload.permissions,
      };
    case START_SHIFT:
      return {
        ...state,
        currentShift: payload.shiftData,
      };
    case END_SHIFT:
      return {
        ...state,
        currentShift: null,
      };
    default:
      return {
        ...state,
        isInitialized: true,
        isAuthenticated: false,
        employee: null,
        permissions: null,
        currentShift: null,
        storeInfo: null,
        storeCode: null,
        isChecking: false,
        isError: false,
        errorMessage: '',
      };
  }
};

function SalesAuthProvider({ children }) {
  const navigate = useNavigate();
  const { storeCode } = useParams();
  
  const [state, dispatch] = useReducer(reducer, initialState);

  const signOut = async () => {
    try {
      // Clear any stored tokens/cookies on server
      // await salesLogout(); // If you have this endpoint
      
      // Dispatch sign-out action
      dispatch({ type: SIGN_OUT });

      // Redirect to sales login page
      navigate(`/store/${storeCode}/sales-login`);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const login = async (credentials) => {
    dispatch({ type: IS_CHECKING, payload: { isChecking: true } });
    dispatch({ type: IS_ERROR, payload: { isError: false, errorMessage: '' } });

    try {
      const response = await salesLogin(credentials);
      
      if (response?.success) {
        const { employee, store } = response.data;
        // Extract permissions from employee object
        const permissions = employee.posPermissions;
        
        dispatch({
          type: INITIALIZE,
          payload: {
            isAuthenticated: true,
            employee,
            permissions,
            storeInfo: store,
            storeCode: credentials.storeCode
          }
        });

        return { success: true, data: response.data };
      } else {
        dispatch({
          type: IS_ERROR,
          payload: {
            isError: true,
            errorMessage: response?.message || 'Đăng nhập thất bại'
          }
        });
        
        return { success: false, message: response?.message };
      }
    } catch (error) {
      console.error('Sales login error:', error);
      dispatch({
        type: IS_ERROR,
        payload: {
          isError: true,
          errorMessage: 'Lỗi kết nối. Vui lòng thử lại.'
        }
      });
      
      return { success: false, message: error.message };
    } finally {
      dispatch({ type: IS_CHECKING, payload: { isChecking: false } });
    }
  };

  const loadProfile = async () => {
    dispatch({ type: IS_CHECKING, payload: { isChecking: true } });
    dispatch({ type: IS_ERROR, payload: { isError: false, errorMessage: '' } });

    try {
      const data = await getSalesMe();
      console.log('SalesAuth loadProfile response:', data);
      if (data) {
        const { employee, store } = data;
        // Extract permissions from employee object
        const permissions = employee.posPermissions;
        
        console.log('SalesAuth extracted data:', { employee, permissions, store });
        
        dispatch({
          type: INITIALIZE,
          payload: {
            isAuthenticated: true,
            employee,
            permissions,
            storeInfo: store,
            storeCode
          }
        });
      } else {
        console.log('SalesAuth loadProfile failed - invalid response');
        // Token invalid, redirect to login
        dispatch({
          type: INITIALIZE,
          payload: {
            isAuthenticated: false,
            employee: null,
            permissions: null,
            storeInfo: null,
            storeCode: null
          }
        });
      }
    } catch (error) {
      console.error('Load profile error:', error);
      dispatch({
        type: INITIALIZE,
        payload: {
          isAuthenticated: false,
          employee: null,
          permissions: null,
          storeInfo: null,
          storeCode: null
        }
      });
    } finally {
      dispatch({ type: IS_CHECKING, payload: { isChecking: false } });
    }
  };

  const updatePermissions = (newPermissions) => {
    dispatch({
      type: UPDATE_PERMISSIONS,
      payload: { permissions: newPermissions }
    });
  };

  const startShift = (shiftData) => {
    dispatch({
      type: START_SHIFT,
      payload: {
        shiftData: {
          startTime: new Date().toISOString(),
          initialCash: shiftData.initialCash || 0,
          ...shiftData
        }
      }
    });
  };

  const endShift = () => {
    dispatch({ type: END_SHIFT });
  };

  // Helper functions
  const hasPermission = (permission) => {
    return state.permissions?.[permission] === true;
  };

  const getMaxDiscount = () => {
    return state.permissions?.maxDiscountPercent || 0;
  };

  const isShiftActive = () => {
    return !!state.currentShift;
  };

  const getEmployeeName = () => {
    if (!state.employee) return '';
    return state.employee.fullName;
  };

  const getEmployeeAvatar = () => {
    if (!state.employee?.avatar) return null;
    return state.employee.avatar;
  };

  const isDepartment = (dept) => {
    return state.employee?.department === dept;
  };

  useEffect(() => {
    if (storeCode) {
      loadProfile();
    }
  }, [storeCode]);

  useEffect(() => {
    // Redirect logic after initialization
    if (state.isInitialized && !state.isChecking && !state.isAuthenticated && storeCode) {
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath.includes('/sales-login');
      
      if (!isLoginPage) {
        navigate(`/store/${storeCode}/sales-login`);
      }
    }
  }, [state.isInitialized, state.isAuthenticated, navigate, storeCode]);

  return (
    <SalesAuthContext.Provider
      value={{
        // State
        ...state,
        isLoading: state.isChecking, // For backward compatibility
        
        // Actions
        login,
        signOut,
        logout: signOut, // Alias for backward compatibility
        loadProfile,
        updatePermissions,
        startShift,
        endShift,
        
        // Helper functions
        hasPermission,
        getMaxDiscount,
        isShiftActive,
        getEmployeeName,
        getEmployeeAvatar,
        isDepartment,
        
        // Permission checkers
        canApplyDiscount: () => hasPermission('canApplyDiscount'),
        canProcessReturn: () => hasPermission('canProcessReturn'),
        canVoidTransaction: () => hasPermission('canVoidTransaction'),
        canOpenCashDrawer: () => hasPermission('canOpenCashDrawer'),
        
        // Clear error
        clearError: () => dispatch({ type: IS_ERROR, payload: { isError: false, errorMessage: '' } }),
      }}
    >
      {children}
    </SalesAuthContext.Provider>
  );
}

export default SalesAuthProvider;