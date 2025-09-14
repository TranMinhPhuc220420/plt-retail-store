import { getApi, postApi, putApi, patchApi, deleteApi } from "@/request";

// Get all sales accounts for a store
export const getSalesAccounts = async (storeId, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = `/sales-accounts/stores/${storeId}/accounts${queryParams ? `?${queryParams}` : ''}`;
    const response = await getApi(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sales accounts:', error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch sales accounts';
    throw new Error(errorMessage);
  }
};

// Create new sales account
export const createSalesAccount = async (storeId, accountData) => {
  try {
    const response = await postApi(`/sales-accounts/stores/${storeId}/accounts`, accountData);
    return response.data;
  } catch (error) {
    console.error('Failed to create sales account:', error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create sales account';
    throw new Error(errorMessage);
  }
};

// Update sales account permissions
export const updateSalesAccount = async (storeId, employeeId, updateData) => {
  try {
    const response = await putApi(`/sales-accounts/stores/${storeId}/accounts/${employeeId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update sales account for employee ${employeeId}:`, error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update sales account';
    throw new Error(errorMessage);
  }
};

// Toggle sales account status (active/inactive)
export const toggleSalesAccountStatus = async (storeId, employeeId) => {
  try {
    const response = await patchApi(`/sales-accounts/stores/${storeId}/accounts/${employeeId}/toggle-status`);
    return response.data;
  } catch (error) {
    console.error(`Failed to toggle sales account status for employee ${employeeId}:`, error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to toggle account status';
    throw new Error(errorMessage);
  }
};

// Reset sales account password
export const resetSalesPassword = async (storeId, employeeId, newPassword) => {
  try {
    const response = await patchApi(`/sales-accounts/stores/${storeId}/accounts/${employeeId}/reset-password`, {
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to reset password for employee ${employeeId}:`, error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to reset password';
    throw new Error(errorMessage);
  }
};

// Delete sales account (remove sales access)
export const deleteSalesAccount = async (storeId, employeeId) => {
  try {
    const response = await deleteApi(`/sales-accounts/stores/${storeId}/accounts/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete sales account for employee ${employeeId}:`, error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete sales account';
    throw new Error(errorMessage);
  }
};

// Get available employees (employees without sales accounts)
export const getAvailableEmployees = async (storeId) => {
  try {
    const response = await getApi(`/employees/store/${storeId}?hasSalesAccess=false`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch available employees:', error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch available employees';
    throw new Error(errorMessage);
  }
};