import useSalesAuth from './useSalesAuth';
import useStoreApp from '@/store/app';

/**
 * Custom hook to get current user and store context for orders
 * @returns {Object} User and store information for order processing
 */
const useOrderContext = () => {
  const { employee, isAuthenticated } = useSalesAuth();
  const { storeActive } = useStoreApp();

  const getOrderContext = () => {
    if (!isAuthenticated || !employee) {
      throw new Error('User must be authenticated to create orders');
    }

    if (!storeActive) {
      throw new Error('Store must be selected to create orders');
    }

    return {
      employeeId: employee._id || employee.id,
      employeeName: employee.displayName || employee.username,
      storeId: storeActive._id || storeActive.id,
      storeCode: storeActive.storeCode || storeActive.code,
      storeName: storeActive.name,
      userId: employee._id || employee.id,
      userRole: employee.role
    };
  };

  return {
    employee,
    storeActive,
    isAuthenticated,
    getOrderContext,
    isReady: isAuthenticated && employee && storeActive
  };
};

export default useOrderContext;