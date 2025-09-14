const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Store = require('../models/Store');
const { responses } = require('../utils/responseFormatter');
const { validationResult } = require('express-validator');
const { logError, logSuccess, logInfo } = require('../middlewares/logger');

/**
 * Sales Account Controller
 * Handles CRUD operations for sales accounts and sales authentication
 */
class SalesAccountController {
  
  /**
   * Get all sales accounts for a store (Admin/Manager only)
   */
  async getSalesAccounts(req, res) {
    try {
      const { storeId } = req.params;
      const { page = 1, limit = 10, search, status } = req.query;

      // Verify store ownership
      const store = await Store.findOne({
        _id: storeId,
        ownerId: req.user._id,
        deleted: false
      });

      if (!store) {
        return responses.forbidden(res, 'store_access_denied', null, 'Access to this store is denied');
      }

      // Build filter
      const filter = {
        storeId,
        deleted: false,
        'salesCredentials.hasSalesAccess': true
      };

      if (search) {
        filter.$or = [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
          { employeeCode: new RegExp(search, 'i') },
          { 'salesCredentials.username': new RegExp(search, 'i') }
        ];
      }

      if (status !== undefined) {
        filter['salesCredentials.isActive'] = status === 'true';
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const salesAccounts = await Employee.find(filter)
        .select('firstName lastName employeeCode department salesCredentials.username salesCredentials.isActive salesCredentials.lastSalesLogin posPermissions createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('storeId', 'name storeCode');

      const total = await Employee.countDocuments(filter);

      const result = {
        salesAccounts,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        },
        store: {
          id: store._id,
          name: store.name,
          storeCode: store.storeCode
        }
      };

      logSuccess('Sales Accounts Retrieved', 'Sales accounts fetched successfully', {
        storeId,
        count: salesAccounts.length,
        userId: req.user._id
      });

      return responses.success(res, result, 'sales_accounts_retrieved');
    } catch (error) {
      logError('Get Sales Accounts', error, { storeId: req.params.storeId, userId: req.user._id });
      return responses.serverError(res, 'failed_to_fetch_sales_accounts', error);
    }
  }

  /**
   * Create sales account for an employee
   */
  async createSalesAccount(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responses.validationError(res, errors.array());
      }

      const { storeId } = req.params;
      const { employeeId, username, password, posPermissions = {} } = req.body;

      // Verify store ownership
      const store = await Store.findOne({
        _id: storeId,
        ownerId: req.user._id,
        deleted: false
      });

      if (!store) {
        return responses.forbidden(res, 'store_access_denied', null, 'Access to this store is denied');
      }

      // Verify employee exists and belongs to store
      const employee = await Employee.findOne({
        _id: employeeId,
        storeId,
        deleted: false,
        isActive: true
      });

      if (!employee) {
        return responses.notFound(res, 'employee_not_found', null, 'Employee not found or inactive');
      }

      // Check if employee already has sales account
      if (employee.salesCredentials?.hasSalesAccess) {
        return responses.conflict(res, 'employee_already_has_sales_account', null, 'Employee already has a sales account');
      }

      // Check username uniqueness
      const existingUsername = await Employee.findOne({
        'salesCredentials.username': username,
        deleted: false
      });

      if (existingUsername) {
        return responses.conflict(res, 'username_already_exists', null, 'Username is already taken');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Update employee with sales credentials
      const updatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        {
          $set: {
            'salesCredentials.username': username,
            'salesCredentials.passwordHash': passwordHash,
            'salesCredentials.isActive': true,
            'salesCredentials.hasSalesAccess': true,
            'salesCredentials.failedLoginAttempts': 0,
            'posPermissions': {
              canAccessPOS: true,
              canApplyDiscount: posPermissions.canApplyDiscount || false,
              maxDiscountPercent: Math.min(posPermissions.maxDiscountPercent || 0, 100),
              canProcessReturn: posPermissions.canProcessReturn || false,
              canVoidTransaction: posPermissions.canVoidTransaction || false,
              canOpenCashDrawer: posPermissions.canOpenCashDrawer || false
            }
          }
        },
        { new: true }
      ).select('-salesCredentials.passwordHash').populate('storeId', 'name storeCode');

      logSuccess('Sales Account Created', 'New sales account created successfully', {
        employeeId,
        storeId,
        username,
        userId: req.user._id
      });

      return responses.created(res, updatedEmployee, 'sales_account_created');
    } catch (error) {
      logError('Create Sales Account', error, { 
        storeId: req.params.storeId, 
        employeeId: req.body.employeeId,
        userId: req.user._id 
      });
      return responses.serverError(res, 'failed_to_create_sales_account', error);
    }
  }

  /**
   * Update sales account permissions
   */
  async updateSalesAccount(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responses.validationError(res, errors.array());
      }

      const { storeId, employeeId } = req.params;
      const { posPermissions } = req.body;

      // Verify store ownership
      const store = await Store.findOne({
        _id: storeId,
        ownerId: req.user._id,
        deleted: false
      });

      if (!store) {
        return responses.forbidden(res, 'store_access_denied', null, 'Access to this store is denied');
      }

      // Find employee with sales account
      const employee = await Employee.findOne({
        _id: employeeId,
        storeId,
        'salesCredentials.hasSalesAccess': true,
        deleted: false
      });

      if (!employee) {
        return responses.notFound(res, 'sales_account_not_found', null, 'Sales account not found');
      }

      // Update permissions
      const updateData = {};
      if (posPermissions) {
        if (posPermissions.canApplyDiscount !== undefined) {
          updateData['posPermissions.canApplyDiscount'] = posPermissions.canApplyDiscount;
        }
        if (posPermissions.maxDiscountPercent !== undefined) {
          updateData['posPermissions.maxDiscountPercent'] = Math.min(posPermissions.maxDiscountPercent, 100);
        }
        if (posPermissions.canProcessReturn !== undefined) {
          updateData['posPermissions.canProcessReturn'] = posPermissions.canProcessReturn;
        }
        if (posPermissions.canVoidTransaction !== undefined) {
          updateData['posPermissions.canVoidTransaction'] = posPermissions.canVoidTransaction;
        }
        if (posPermissions.canOpenCashDrawer !== undefined) {
          updateData['posPermissions.canOpenCashDrawer'] = posPermissions.canOpenCashDrawer;
        }
      }

      const updatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        { $set: updateData },
        { new: true }
      ).select('-salesCredentials.passwordHash').populate('storeId', 'name storeCode');

      logSuccess('Sales Account Updated', 'Sales account permissions updated successfully', {
        employeeId,
        storeId,
        updateData,
        userId: req.user._id
      });

      return responses.updated(res, updatedEmployee, 'sales_account_updated');
    } catch (error) {
      logError('Update Sales Account', error, { 
        storeId: req.params.storeId, 
        employeeId: req.params.employeeId,
        userId: req.user._id 
      });
      return responses.serverError(res, 'failed_to_update_sales_account', error);
    }
  }

  /**
   * Toggle sales account status (active/inactive)
   */
  async toggleSalesAccountStatus(req, res) {
    try {
      const { storeId, employeeId } = req.params;

      // Verify store ownership
      const store = await Store.findOne({
        _id: storeId,
        ownerId: req.user._id,
        deleted: false
      });

      if (!store) {
        return responses.forbidden(res, 'store_access_denied', null, 'Access to this store is denied');
      }

      // Find employee with sales account
      const employee = await Employee.findOne({
        _id: employeeId,
        storeId,
        'salesCredentials.hasSalesAccess': true,
        deleted: false
      });

      if (!employee) {
        return responses.notFound(res, 'sales_account_not_found', null, 'Sales account not found');
      }

      const newStatus = !employee.salesCredentials.isActive;

      const updatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        { 
          $set: { 
            'salesCredentials.isActive': newStatus,
            'salesCredentials.failedLoginAttempts': 0  // Reset failed attempts
          },
          $unset: { 'salesCredentials.lockedUntil': 1 }  // Remove lock
        },
        { new: true }
      ).select('-salesCredentials.passwordHash').populate('storeId', 'name storeCode');

      logSuccess('Sales Account Status Toggled', 'Sales account status changed successfully', {
        employeeId,
        storeId,
        newStatus,
        userId: req.user._id
      });

      return responses.updated(res, updatedEmployee, `sales_account_${newStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      logError('Toggle Sales Account Status', error, { 
        storeId: req.params.storeId, 
        employeeId: req.params.employeeId,
        userId: req.user._id 
      });
      return responses.serverError(res, 'failed_to_toggle_sales_account_status', error);
    }
  }

  /**
   * Reset sales account password
   */
  async resetSalesPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responses.validationError(res, errors.array());
      }

      const { storeId, employeeId } = req.params;
      const { newPassword } = req.body;

      // Verify store ownership
      const store = await Store.findOne({
        _id: storeId,
        ownerId: req.user._id,
        deleted: false
      });

      if (!store) {
        return responses.forbidden(res, 'store_access_denied', null, 'Access to this store is denied');
      }

      // Find employee with sales account
      const employee = await Employee.findOne({
        _id: employeeId,
        storeId,
        'salesCredentials.hasSalesAccess': true,
        deleted: false
      });

      if (!employee) {
        return responses.notFound(res, 'sales_account_not_found', null, 'Sales account not found');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password and reset security fields
      await Employee.findByIdAndUpdate(employeeId, {
        $set: {
          'salesCredentials.passwordHash': passwordHash,
          'salesCredentials.failedLoginAttempts': 0
        },
        $unset: { 'salesCredentials.lockedUntil': 1 }
      });

      logSuccess('Sales Password Reset', 'Sales account password reset successfully', {
        employeeId,
        storeId,
        userId: req.user._id
      });

      return responses.success(res, { message: 'Password reset successfully' }, 'sales_password_reset');
    } catch (error) {
      logError('Reset Sales Password', error, { 
        storeId: req.params.storeId, 
        employeeId: req.params.employeeId,
        userId: req.user._id 
      });
      return responses.serverError(res, 'failed_to_reset_sales_password', error);
    }
  }

  /**
   * Delete sales account (remove sales access)
   */
  async deleteSalesAccount(req, res) {
    try {
      const { storeId, employeeId } = req.params;

      // Verify store ownership
      const store = await Store.findOne({
        _id: storeId,
        ownerId: req.user._id,
        deleted: false
      });

      if (!store) {
        return responses.forbidden(res, 'store_access_denied', null, 'Access to this store is denied');
      }

      // Find employee with sales account
      const employee = await Employee.findOne({
        _id: employeeId,
        storeId,
        'salesCredentials.hasSalesAccess': true,
        deleted: false
      });

      if (!employee) {
        return responses.notFound(res, 'sales_account_not_found', null, 'Sales account not found');
      }

      // Remove sales access (soft delete sales account)
      await Employee.findByIdAndUpdate(employeeId, {
        $set: {
          'salesCredentials.hasSalesAccess': false,
          'salesCredentials.isActive': false
        },
        $unset: {
          'salesCredentials.username': 1,
          'salesCredentials.passwordHash': 1,
          'salesCredentials.lastSalesLogin': 1,
          'salesCredentials.failedLoginAttempts': 1,
          'salesCredentials.lockedUntil': 1
        }
      });

      logSuccess('Sales Account Deleted', 'Sales account removed successfully', {
        employeeId,
        storeId,
        userId: req.user._id
      });

      return responses.success(res, null, 'sales_account_deleted');
    } catch (error) {
      logError('Delete Sales Account', error, { 
        storeId: req.params.storeId, 
        employeeId: req.params.employeeId,
        userId: req.user._id 
      });
      return responses.serverError(res, 'failed_to_delete_sales_account', error);
    }
  }

  /**
   * Sales Login - separate from main authentication
   */
  async salesLogin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return responses.validationError(res, errors.array());
      }

      const { storeCode, username, password } = req.body;

      // Find store
      const store = await Store.findOne({ storeCode, deleted: false });
      if (!store) {
        return responses.badRequest(res, 'invalid_credentials', null, 'Invalid store code, username, or password');
      }

      // Find employee with sales account
      const employee = await Employee.findOne({
        storeId: store._id,
        'salesCredentials.username': username,
        'salesCredentials.hasSalesAccess': true,
        deleted: false,
        isActive: true
      }).select('+salesCredentials.passwordHash').populate('storeId', 'name storeCode');

      if (!employee) {
        return responses.badRequest(res, 'invalid_credentials', null, 'Invalid store code, username, or password');
      }

      // Check if account is active
      if (!employee.salesCredentials.isActive) {
        return responses.forbidden(res, 'account_disabled', null, 'Sales account is disabled');
      }

      // Check if account is locked
      if (employee.salesCredentials.lockedUntil && employee.salesCredentials.lockedUntil > new Date()) {
        const lockTimeRemaining = Math.ceil((employee.salesCredentials.lockedUntil - new Date()) / 1000 / 60);
        return responses.forbidden(res, 'account_locked', null, `Account is locked. Try again in ${lockTimeRemaining} minutes.`);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, employee.salesCredentials.passwordHash);
      
      if (!isPasswordValid) {
        // Increment failed attempts
        const failedAttempts = (employee.salesCredentials.failedLoginAttempts || 0) + 1;
        const updateData = {
          'salesCredentials.failedLoginAttempts': failedAttempts
        };

        // Lock account after 5 failed attempts
        if (failedAttempts >= 5) {
          updateData['salesCredentials.lockedUntil'] = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }

        await Employee.findByIdAndUpdate(employee._id, { $set: updateData });

        logInfo('Sales Login Failed', 'Invalid password attempt', {
          username,
          storeCode,
          failedAttempts,
          locked: failedAttempts >= 5
        });

        return responses.badRequest(res, 'invalid_credentials', null, 'Invalid store code, username, or password');
      }

      // Reset failed attempts and update last login
      await Employee.findByIdAndUpdate(employee._id, {
        $set: { 
          'salesCredentials.lastSalesLogin': new Date(),
          'salesCredentials.failedLoginAttempts': 0
        },
        $unset: { 'salesCredentials.lockedUntil': 1 }
      });

      // Create JWT for sales session
      const payload = {
        employeeId: employee._id,
        storeId: store._id,
        storeCode: store.storeCode,
        username: employee.salesCredentials.username,
        fullName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department,
        posPermissions: employee.posPermissions,
        type: 'sales_account'
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' }); // Shorter expiry for sales

      res.cookie('sales_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });

      logSuccess('Sales Login Successful', 'Sales staff logged in successfully', {
        employeeId: employee._id,
        username,
        storeCode,
        storeId: store._id
      });

      return responses.success(res, {
        employee: {
          id: employee._id,
          fullName: `${employee.firstName} ${employee.lastName}`,
          username: employee.salesCredentials.username,
          department: employee.department,
          posPermissions: employee.posPermissions
        },
        store: {
          id: store._id,
          name: store.name,
          storeCode: store.storeCode
        }
      }, 'sales_login_successful');
    } catch (error) {
      logError('Sales Login', error, { 
        username: req.body.username, 
        storeCode: req.body.storeCode 
      });
      return responses.serverError(res, 'sales_login_failed', error);
    }
  }

  /**
   * Sales Logout
   */
  async salesLogout(req, res) {
    try {
      const employeeId = req.salesAccount?.employeeId;

      res.clearCookie('sales_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      logSuccess('Sales Logout', 'Sales staff logged out successfully', {
        employeeId,
        storeId: req.salesAccount?.storeId
      });

      return responses.success(res, null, 'sales_logout_successful');
    } catch (error) {
      logError('Sales Logout', error, { 
        employeeId: req.salesAccount?.employeeId 
      });
      return responses.serverError(res, 'sales_logout_failed', error);
    }
  }

  /**
   * Get sales account profile (for authenticated sales staff)
   */
  async getSalesProfile(req, res) {
    try {
      const { employeeId, storeId } = req.salesAccount;

      const employee = await Employee.findOne({
        _id: employeeId,
        storeId,
        'salesCredentials.hasSalesAccess': true,
        'salesCredentials.isActive': true,
        deleted: false,
        isActive: true
      })
      .select('avatar firstName lastName employeeCode department salesCredentials.username salesCredentials.lastSalesLogin posPermissions')
      .populate('storeId', 'name storeCode address');

      if (!employee) {
        return responses.notFound(res, 'sales_account_not_found', null, 'Sales account not found or inactive');
      }

      return responses.success(res, {
        employee: {
          id: employee._id,
          avatar: employee.avatar,
          fullName: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.employeeCode,
          username: employee.salesCredentials.username,
          department: employee.department,
          lastLogin: employee.salesCredentials.lastSalesLogin,
          posPermissions: employee.posPermissions
        },
        store: employee.storeId
      }, 'sales_profile_retrieved');
    } catch (error) {
      logError('Get Sales Profile', error, { 
        employeeId: req.salesAccount?.employeeId,
        storeId: req.salesAccount?.storeId
      });
      return responses.serverError(res, 'failed_to_get_sales_profile', error);
    }
  }
}

module.exports = new SalesAccountController();