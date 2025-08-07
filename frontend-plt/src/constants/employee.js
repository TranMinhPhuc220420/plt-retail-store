// Employee Role Constants
export const EMPLOYEE_ROLES = {
  MANAGER: 'manager',
  STAFF: 'staff'
};

export const EMPLOYEE_ROLE_LABELS = {
  [EMPLOYEE_ROLES.MANAGER]: 'Quản lý',
  [EMPLOYEE_ROLES.STAFF]: 'Nhân viên'
};

// Department Constants
export const DEPARTMENTS = {
  SALES: 'sales',
  KITCHEN: 'kitchen',
  CASHIER: 'cashier',
  INVENTORY: 'inventory',
  MANAGEMENT: 'management'
};

export const DEPARTMENT_LABELS = {
  [DEPARTMENTS.SALES]: 'Bán hàng',
  [DEPARTMENTS.KITCHEN]: 'Bếp',
  [DEPARTMENTS.CASHIER]: 'Thu ngân',
  [DEPARTMENTS.INVENTORY]: 'Kho',
  [DEPARTMENTS.MANAGEMENT]: 'Quản lý'
};

// Contract Type Constants
export const CONTRACT_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERN: 'intern'
};

export const CONTRACT_TYPE_LABELS = {
  [CONTRACT_TYPES.FULL_TIME]: 'Toàn thời gian',
  [CONTRACT_TYPES.PART_TIME]: 'Bán thời gian',
  [CONTRACT_TYPES.CONTRACT]: 'Hợp đồng',
  [CONTRACT_TYPES.INTERN]: 'Thực tập'
};

// Salary Type Constants
export const SALARY_TYPES = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  MONTHLY: 'monthly'
};

export const SALARY_TYPE_LABELS = {
  [SALARY_TYPES.HOURLY]: 'Theo giờ',
  [SALARY_TYPES.DAILY]: 'Theo ngày',
  [SALARY_TYPES.MONTHLY]: 'Theo tháng'
};

// Permission Constants
export const PERMISSION_MODULES = {
  EMPLOYEES: 'employees',
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  SALES: 'sales',
  REPORTS: 'reports'
};

export const PERMISSION_ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
};

export const PERMISSION_ACTION_LABELS = {
  [PERMISSION_ACTIONS.READ]: 'Xem',
  [PERMISSION_ACTIONS.CREATE]: 'Tạo',
  [PERMISSION_ACTIONS.UPDATE]: 'Sửa',
  [PERMISSION_ACTIONS.DELETE]: 'Xóa'
};

// Status Constants
export const EMPLOYEE_STATUS = {
  ACTIVE: true,
  INACTIVE: false
};

export const EMPLOYEE_STATUS_LABELS = {
  [EMPLOYEE_STATUS.ACTIVE]: 'Hoạt động',
  [EMPLOYEE_STATUS.INACTIVE]: 'Không hoạt động'
};

// Validation Constants
export const EMPLOYEE_VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_PATTERN: /^[+]?[\d\s\-\(\)]{10,15}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  EMPLOYEE_CODE_PATTERN: /^[A-Z0-9]{2,}-EMP-\d{4}$/
};

// Default Values
export const DEFAULT_EMPLOYEE_VALUES = {
  isActive: true,
  contractType: CONTRACT_TYPES.FULL_TIME,
  department: DEPARTMENTS.SALES,
  salary: {
    currency: 'VND',
    type: SALARY_TYPES.MONTHLY
  }
};

// Table Configuration
export const EMPLOYEE_TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: ['10', '20', '50', '100'],
  SCROLL_X: 1200
};

// Color Constants for UI
export const ROLE_COLORS = {
  [EMPLOYEE_ROLES.MANAGER]: 'blue',
  [EMPLOYEE_ROLES.STAFF]: 'green'
};

export const DEPARTMENT_COLORS = {
  [DEPARTMENTS.SALES]: 'cyan',
  [DEPARTMENTS.KITCHEN]: 'orange',
  [DEPARTMENTS.CASHIER]: 'purple',
  [DEPARTMENTS.INVENTORY]: 'geekblue',
  [DEPARTMENTS.MANAGEMENT]: 'red'
};

export const STATUS_COLORS = {
  [EMPLOYEE_STATUS.ACTIVE]: 'success',
  [EMPLOYEE_STATUS.INACTIVE]: 'error'
};
