import useAuth from './useAuth';
import useStoreApp from '@/store/app';

/**
 * Custom hook to get current user and store context for orders
 * @returns {Object} User and store information for order processing
 */
const useOrderContext = () => {
  const { user, isAuthenticated } = useAuth();
  const { storeActive } = useStoreApp();

  const getOrderContext = () => {
    if (!isAuthenticated || !user) {
      throw new Error('User must be authenticated to create orders');
    }

    if (!storeActive) {
      throw new Error('Store must be selected to create orders');
    }

    return {
      employeeId: user._id || user.id,
      employeeName: user.displayName || user.username,
      storeId: storeActive._id || storeActive.id,
      storeCode: storeActive.storeCode || storeActive.code,
      storeName: storeActive.name,
      userId: user._id || user.id,
      userRole: user.role
    };
  };

  return {
    user,
    storeActive,
    isAuthenticated,
    getOrderContext,
    isReady: isAuthenticated && user && storeActive
  };
};

export default useOrderContext;