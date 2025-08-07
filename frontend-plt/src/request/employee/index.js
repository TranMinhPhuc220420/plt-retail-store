import { deleteApi, get, getApi, post, postApi, putApi, patchApi } from "@/request";

// Fetch all employees for a store
export const getEmployees = async (storeId, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = `/employees/store/${storeId}${queryParams ? `?${queryParams}` : ''}`;
    const response = await getApi(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    throw error;
  }
};

// Get single employee
export const getEmployee = async (id) => {
  try {
    const response = await getApi(`/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch employee details for ID ${id}:`, error);
    throw error;
  }
};

// Create a new employee
export const createEmployee = async (employeeData) => {
  try {
    const response = await postApi('/employees', employeeData);
    return response.data;
  } catch (error) {
    console.error('Failed to create employee:', error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create employee';
    throw new Error(errorMessage);
  }
};

// Update employee
export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await putApi(`/employees/${id}`, employeeData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update employee with ID ${id}:`, error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update employee';
    throw new Error(errorMessage);
  }
};

// Update employee status (activate/deactivate)
export const updateEmployeeStatus = async (id, isActive) => {
  try {
    const response = await patchApi(`/employees/${id}/status`, { isActive });
    return response.data;
  } catch (error) {
    console.error(`Failed to update employee status for ID ${id}:`, error);
    throw error;
  }
};

// Delete employee (soft delete)
export const deleteEmployee = async (id) => {
  try {
    const response = await deleteApi(`/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete employee with ID ${id}:`, error);
    throw error;
  }
};

// Get employees by role
export const getEmployeesByRole = async (storeId, role) => {
  try {
    const response = await getApi(`/employees/store/${storeId}/role/${role}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch employees by role ${role}:`, error);
    throw error;
  }
};

// Get managers for a store
export const getManagers = async (storeId) => {
  try {
    const response = await getApi(`/employees/store/${storeId}/managers`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch managers:', error);
    throw error;
  }
};

// Get staff under a manager
export const getStaffByManager = async (managerId) => {
  try {
    const response = await getApi(`/employees/manager/${managerId}/staff`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch staff for manager ${managerId}:`, error);
    throw error;
  }
};

// Get employee statistics
export const getEmployeeStats = async (storeId) => {
  try {
    const response = await getApi(`/employees/store/${storeId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch employee statistics:', error);
    throw error;
  }
};

// Upload employee avatar
export const uploadEmployeeAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await post('/upload/employees', formData, {
      'Content-Type': 'multipart/form-data',
    });

    let imageUrl;
    if (response.data && response.data.url) {
      imageUrl = response.data.url;
    } else {
      throw 'Failed to upload avatar';
    }

    return imageUrl;
  } catch (error) {
    console.error('Failed to upload employee avatar:', error);
    throw error;
  }
};

// Create multiple employees from an Excel file (keep for backward compatibility)
export const createEmployeeBulk = async (storeId, employees) => {
  try {
    const response = await post('/employees/bulk', { storeId, employees });
    return response.data;
  } catch (error) {
    console.error('Failed to create employees in bulk:', error);
    throw error;
  }
};

// Legacy functions for backward compatibility
export const getMyEmployees = (storeCode) => getEmployees(storeCode);
export const createMyEmployee = (employeeData) => createEmployee(employeeData);
export const createMyEmployeeTypeBulk = (storeCode, employees) => createEmployeeBulk(storeCode, employees);
export const getMyEmployeeDetail = (id) => getEmployee(id);
export const updateMyEmployee = (id, employeeData) => updateEmployee(id, employeeData);
export const deleteMyEmployee = (id) => deleteEmployee(id);