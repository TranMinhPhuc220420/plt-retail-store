const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const employeeController = require('../../controllers/employeeController');
const { MANAGER_ROLE, STAFF_ROLE } = require('../../config/constant');

// Validation middleware
const validateEmployeeId = [
  param('id').isMongoId().withMessage('Invalid employee ID')
];

const validateStoreId = [
  param('storeId').isMongoId().withMessage('Invalid store ID')
];

const validateEmployeeCreation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  
  body('role')
    .isIn([MANAGER_ROLE, STAFF_ROLE])
    .withMessage(`Role must be either ${MANAGER_ROLE} or ${STAFF_ROLE}`),
  
  body('storeId')
    .isMongoId()
    .withMessage('Valid store ID is required'),
  
  // body('ownerId')
  //   .isMongoId()
  //   .withMessage('Valid owner ID is required'),
  
  body('department')
    .optional()
    .isIn(['sales', 'kitchen', 'cashier', 'inventory', 'management'])
    .withMessage('Invalid department'),
  
  // body('managerId')
  //   .optional()
  //   .isMongoId()
  //   .withMessage('Valid manager ID is required'),
  
  body('salary.amount')
    .optional()
    .isNumeric()
    .withMessage('Salary amount must be a number')
    .custom(value => value >= 0)
    .withMessage('Salary amount must be positive'),
  
  body('contractType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'intern'])
    .withMessage('Invalid contract type'),
  
  body('hireDate')
    .optional()
    .isISO8601()
    .withMessage('Valid hire date is required'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Valid date of birth is required')
];

const validateEmployeeUpdate = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  
  body('role')
    .optional()
    .isIn([MANAGER_ROLE, STAFF_ROLE])
    .withMessage(`Role must be either ${MANAGER_ROLE} or ${STAFF_ROLE}`),
  
  body('department')
    .optional()
    .isIn(['sales', 'kitchen', 'cashier', 'inventory', 'management'])
    .withMessage('Invalid department'),
  
  body('managerId')
    .optional()
    .isMongoId()
    .withMessage('Valid manager ID is required'),
  
  body('salary.amount')
    .optional()
    .isNumeric()
    .withMessage('Salary amount must be a number')
    .custom(value => value >= 0)
    .withMessage('Salary amount must be positive'),
  
  body('contractType')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'intern'])
    .withMessage('Invalid contract type'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const validateStatusUpdate = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Routes

// GET /api/employees - Get all employees (for admin dropdown)
router.get('/', 
  employeeController.getAllEmployees
);

// GET /api/employees/store/:storeId - Get all employees for a store
router.get('/store/:storeId', 
  validateStoreId,
  employeeController.getEmployees
);

// GET /api/employees/store/:storeId/stats - Get employee statistics for a store
router.get('/store/:storeId/stats',
  validateStoreId,
  employeeController.getEmployeeStats
);

// GET /api/employees/store/:storeId/role/:role - Get employees by role
router.get('/store/:storeId/role/:role',
  validateStoreId,
  param('role').isIn([MANAGER_ROLE, STAFF_ROLE]).withMessage('Invalid role'),
  employeeController.getEmployeesByRole
);

// GET /api/employees/store/:storeId/managers - Get all managers for a store
router.get('/store/:storeId/managers',
  validateStoreId,
  employeeController.getManagers
);

// GET /api/employees/manager/:managerId/staff - Get all staff under a manager
router.get('/manager/:managerId/staff',
  param('managerId').isMongoId().withMessage('Invalid manager ID'),
  employeeController.getStaffByManager
);

// GET /api/employees/:id - Get single employee
router.get('/:id',
  validateEmployeeId,
  employeeController.getEmployee
);

// POST /api/employees - Create new employee
router.post('/',
  validateEmployeeCreation,
  employeeController.createEmployee
);

// PUT /api/employees/:id - Update employee
router.put('/:id',
  validateEmployeeId,
  validateEmployeeUpdate,
  employeeController.updateEmployee
);

// PATCH /api/employees/:id/status - Update employee status (activate/deactivate)
router.patch('/:id/status',
  validateEmployeeId,
  validateStatusUpdate,
  employeeController.updateEmployeeStatus
);

// DELETE /api/employees/:id - Soft delete employee
router.delete('/:id',
  validateEmployeeId,
  employeeController.deleteEmployee
);

module.exports = router;
