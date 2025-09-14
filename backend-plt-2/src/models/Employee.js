const mongoose = require('mongoose');
const { MANAGER_ROLE, STAFF_ROLE } = require('../config/constant');

const employeeSchema = new mongoose.Schema({
  // Basic information
  employeeCode: { 
    type: String, 
    unique: true, 
    required: true,
    trim: true 
  },
  firstName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  lastName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true
  },
  phone: { 
    type: String, 
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    zipCode: String,
    country: String
  },
  dateOfBirth: Date,
  avatar: String,

  // Employment information
  role: { 
    type: String, 
    enum: [MANAGER_ROLE, STAFF_ROLE], 
    required: true 
  },
  department: {
    type: String,
    enum: ['sales', 'kitchen', 'cashier', 'inventory', 'management'],
    default: 'sales'
  },
  position: String,
  salary: {
    amount: { type: Number, min: 0 },
    currency: { type: String, default: 'VND' },
    type: { 
      type: String, 
      enum: ['hourly', 'monthly', 'daily'], 
      default: 'monthly' 
    }
  },
  hireDate: { 
    type: Date, 
    default: Date.now 
  },
  contractType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern'],
    default: 'full-time'
  },

  // Store and owner relationships
  storeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store', 
    required: true 
  },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Manager relationship (if this employee is a staff)
  managerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee',
    required: function() {
      return this.role === STAFF_ROLE;
    }
  },

  // Work schedule and permissions
  workSchedule: {
    monday: { start: String, end: String, isWorkDay: Boolean },
    tuesday: { start: String, end: String, isWorkDay: Boolean },
    wednesday: { start: String, end: String, isWorkDay: Boolean },
    thursday: { start: String, end: String, isWorkDay: Boolean },
    friday: { start: String, end: String, isWorkDay: Boolean },
    saturday: { start: String, end: String, isWorkDay: Boolean },
    sunday: { start: String, end: String, isWorkDay: Boolean }
  },
  
  permissions: [{
    module: String, // 'products', 'inventory', 'sales', 'reports', etc.
    actions: [String] // 'read', 'create', 'update', 'delete'
  }],

  // Sales Account - chỉ thêm khi tạo tài khoản bán hàng
  salesCredentials: {
    username: { 
      type: String, 
      unique: true, 
      sparse: true,  // Cho phép null, unique nếu có giá trị
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    passwordHash: { 
      type: String, 
      select: false  // Không select mặc định vì bảo mật
    },
    isActive: { 
      type: Boolean, 
      default: false 
    },
    hasSalesAccess: {
      type: Boolean,
      default: false
    },
    lastSalesLogin: Date,
    failedLoginAttempts: { 
      type: Number, 
      default: 0 
    },
    lockedUntil: Date
  },

  // POS Permissions
  posPermissions: {
    canAccessPOS: { type: Boolean, default: false },
    canApplyDiscount: { type: Boolean, default: false },
    maxDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    canProcessReturn: { type: Boolean, default: false },
    canVoidTransaction: { type: Boolean, default: false },
    canOpenCashDrawer: { type: Boolean, default: false }
  },

  // Status fields
  isActive: { 
    type: Boolean, 
    default: true 
  },
  deleted: { 
    type: Boolean, 
    default: false 
  },

  // Emergency contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },

  // Notes and additional information
  notes: String,
  lastLoginAt: Date,
  terminationDate: Date,
  terminationReason: String

}, {
  timestamps: true
});

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
employeeSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to generate employee code if not provided
// employeeSchema.pre('save', async function(next) {
//   if (!this.employeeCode) {
//     const store = await mongoose.model('Store').findById(this.storeId);
//     if (store) {
//       const count = await this.constructor.countDocuments({ storeId: this.storeId });
//       this.employeeCode = `${store.storeCode}-EMP-${(count + 1).toString().padStart(4, '0')}`;
//     }
//   }
//   next();
// });

// Pre-save middleware to validate manager relationship
// employeeSchema.pre('save', async function(next) {
//   if (this.role === STAFF_ROLE && this.managerId) {
//     const manager = await this.constructor.findById(this.managerId);
//     if (!manager || manager.role !== MANAGER_ROLE || manager.storeId.toString() !== this.storeId.toString()) {
//       throw new Error('Invalid manager assignment');
//     }
//   }
//   next();
// });

// Indexes for better query performance
employeeSchema.index({ storeId: 1 });
employeeSchema.index({ ownerId: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ deleted: 1 });
employeeSchema.index({ isActive: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ storeId: 1, role: 1 });
employeeSchema.index({ storeId: 1, deleted: 1, isActive: 1 });

// Compound index for efficient queries
employeeSchema.index({ 
  storeId: 1, 
  deleted: 1, 
  isActive: 1, 
  role: 1 
});

module.exports = mongoose.model('Employee', employeeSchema);
