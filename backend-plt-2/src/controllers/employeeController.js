const Employee = require('../models/Employee');
const Store = require('../models/Store');
const { MANAGER_ROLE, STAFF_ROLE } = require('../config/constant');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Move getDefaultPermissions outside the class
function getDefaultPermissions(role) {
  const permissions = {
    [MANAGER_ROLE]: [
      { module: 'employees', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'products', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'inventory', actions: ['read', 'create', 'update'] },
      { module: 'sales', actions: ['read', 'create', 'update'] },
      { module: 'reports', actions: ['read'] }
    ],
    [STAFF_ROLE]: [
      { module: 'products', actions: ['read'] },
      { module: 'inventory', actions: ['read'] },
      { module: 'sales', actions: ['read', 'create'] }
    ]
  };

  return permissions[role] || [];
}

class EmployeeController {
  // Get all employees for a store
  async getEmployees(req, res) {
    try {
      const { storeId } = req.params;
      const { 
        role, 
        department, 
        isActive, 
        page = 1, 
        limit = 10,
        search 
      } = req.query;

      // Build filter
      const filter = { 
        storeId, 
        deleted: false 
      };

      if (role) filter.role = role;
      if (department) filter.department = department;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeCode: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const employees = await Employee.find(filter)
        .populate([
          { path: 'storeId', select: 'name storeCode' },
          { path: 'managerId', select: 'firstName lastName employeeCode' }
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Employee.countDocuments(filter);
      
      res.json({
        success: true,
        data: {
          docs: employees,
          totalDocs: total,
          limit: parseInt(limit),
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching employees',
        error: error.message
      });
    }
  }

  // Get single employee
  async getEmployee(req, res) {
    try {
      const { id } = req.params;
      
      const employee = await Employee.findOne({ 
        _id: id, 
        deleted: false 
      })
      .populate('storeId', 'name storeCode address')
      .populate('managerId', 'firstName lastName employeeCode role')
      .populate('ownerId', 'username displayName email');

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching employee',
        error: error.message
      });
    }
  }

  // Create new employee
  async createEmployee(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const employeeData = req.body;
      employeeData.ownerId = req.user._id; // Assuming user ID is available in req
      
      // randomly generate employee code if not provided
      if (!employeeData.employeeCode) {
        const store = await Store.findById(employeeData.storeId);
        if (store) {
          const count = await Employee.countDocuments({ storeId: employeeData.storeId });
          employeeData.employeeCode = `EMP-${(count + 1).toString().padStart(4, '0')}`;
        }
      }

      // Verify store exists and user has permission
      const store = await Store.findOne({ 
        _id: employeeData.storeId, 
        deleted: false 
      });
      
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Set default permissions based on role
      if (!employeeData.permissions) {
        employeeData.permissions = getDefaultPermissions(employeeData.role);
      }

      const employee = new Employee(employeeData);
      await employee.save();

      // Update store's employees array
      await Store.findByIdAndUpdate(
        employeeData.storeId,
        { $push: { employees: employee._id } }
      );

      const populatedEmployee = await Employee.findById(employee._id)
        .populate('storeId', 'name storeCode')
        .populate('managerId', 'firstName lastName employeeCode');

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: populatedEmployee
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Employee code or email already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error creating employee',
        error: error.message
      });
    }
  }

  // Update employee
  async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      // Don't allow updating certain fields
      delete updateData.employeeCode;
      delete updateData.ownerId;
      delete updateData.createdAt;

      const employee = await Employee.findOneAndUpdate(
        { _id: id, deleted: false },
        updateData,
        { new: true, runValidators: true }
      )
      .populate('storeId', 'name storeCode')
      .populate('managerId', 'firstName lastName employeeCode');

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.json({
        success: true,
        message: 'Employee updated successfully',
        data: employee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating employee',
        error: error.message
      });
    }
  }

  // Soft delete employee
  async deleteEmployee(req, res) {
    try {
      const { id } = req.params;

      const employee = await Employee.findOneAndUpdate(
        { _id: id, deleted: false },
        { 
          deleted: true,
          isActive: false,
          terminationDate: new Date()
        },
        { new: true }
      );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Remove from store's employees array
      await Store.findByIdAndUpdate(
        employee.storeId,
        { $pull: { employees: employee._id } }
      );

      res.json({
        success: true,
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting employee',
        error: error.message
      });
    }
  }

  // Get employees by role
  async getEmployeesByRole(req, res) {
    try {
      const { storeId, role } = req.params;

      const employees = await Employee.find({
        storeId,
        role,
        deleted: false,
        isActive: true
      })
      .select('firstName lastName employeeCode email role department')
      .sort({ firstName: 1 });

      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching employees by role',
        error: error.message
      });
    }
  }

  // Get managers for staff assignment
  async getManagers(req, res) {
    try {
      const { storeId } = req.params;

      const managers = await Employee.find({
        storeId,
        role: MANAGER_ROLE,
        deleted: false,
        isActive: true
      })
      .select('firstName lastName employeeCode email department')
      .sort({ firstName: 1 });

      res.json({
        success: true,
        data: managers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching managers',
        error: error.message
      });
    }
  }

  // Get staff under a manager
  async getStaffByManager(req, res) {
    try {
      const { managerId } = req.params;

      const staff = await Employee.find({
        managerId,
        deleted: false,
        isActive: true
      })
      .select('firstName lastName employeeCode email department hireDate')
      .sort({ firstName: 1 });

      res.json({
        success: true,
        data: staff
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching staff',
        error: error.message
      });
    }
  }

  // Update employee status (activate/deactivate)
  async updateEmployeeStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const employee = await Employee.findOneAndUpdate(
        { _id: id, deleted: false },
        { isActive },
        { new: true }
      )
      .populate('storeId', 'name storeCode');

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.json({
        success: true,
        message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: employee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating employee status',
        error: error.message
      });
    }
  }

  // Get employee statistics
  async getEmployeeStats(req, res) {
    try {
      const { storeId } = req.params;
      const storeObjectId = new mongoose.Types.ObjectId(storeId);

      const stats = await Employee.aggregate([
        { $match: { storeId: storeObjectId, deleted: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
            managers: { $sum: { $cond: [{ $eq: ['$role', MANAGER_ROLE] }, 1, 0] } },
            staff: { $sum: { $cond: [{ $eq: ['$role', STAFF_ROLE] }, 1, 0] } }
          }
        }
      ]);

      const departmentStats = await Employee.aggregate([
        { $match: { storeId: storeObjectId, deleted: false, isActive: true } },
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          overview: stats[0] || { total: 0, active: 0, inactive: 0, managers: 0, staff: 0 },
          departments: departmentStats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching employee statistics',
        error: error.message
      });
    }
  }
}

module.exports = new EmployeeController();
