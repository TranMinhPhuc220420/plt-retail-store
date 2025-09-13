const mongoose = require('mongoose');

// Schema cho lịch sử hoạt động của sản phẩm tổng hợp
const compositeProductHistorySchema = new mongoose.Schema({
  // Thông tin sản phẩm
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productCode: {
    type: String,
    required: true
  },

  // Thông tin store
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },

  // Loại hoạt động: 'prepare', 'serve', 'expire', 'waste'
  action: {
    type: String,
    enum: ['prepare', 'serve', 'expire', 'waste'],
    required: true
  },

  // Số lượng tác động
  quantity: {
    type: Number,
    required: true,
    min: 0
  },

  // Đơn vị
  unit: {
    type: String,
    required: true,
    default: 'phần'
  },

  // Tồn kho trước khi thực hiện hành động
  stockBefore: {
    type: Number,
    required: true,
    min: 0
  },

  // Tồn kho sau khi thực hiện hành động
  stockAfter: {
    type: Number,
    required: true,
    min: 0
  },

  // Ghi chú bổ sung
  notes: {
    type: String,
    default: ''
  },

  // Thông tin chi phí (tùy chọn)
  costInfo: {
    unitCost: { type: mongoose.Schema.Types.Decimal128, default: 0 },
    totalCost: { type: mongoose.Schema.Types.Decimal128, default: 0 },
    estimatedRevenue: { type: mongoose.Schema.Types.Decimal128, default: 0 }
  },

  // Thông tin người thực hiện
  operator: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    fullName: String,
    role: String
  },

  // Thời gian thực hiện
  actionTime: {
    type: Date,
    default: Date.now
  },

  // Thông tin batch (đối với prepare)
  batchInfo: {
    batchNumber: String, // Số lô sản xuất
    expiryTime: Date, // Thời gian hết hạn dự kiến
    preparationDetails: {
      recipeUsed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
      },
      ingredientsUsed: [{
        ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: Number,
        unit: String,
        cost: mongoose.Schema.Types.Decimal128
      }]
    }
  },

  // Metadata bổ sung
  metadata: {
    deviceInfo: String, // Thông tin thiết bị thực hiện
    sessionId: String, // Session ID
    ip: String, // IP address
    userAgent: String // User agent
  }

}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

// Indexes để tối ưu query
compositeProductHistorySchema.index({ productId: 1, createdAt: -1 });
compositeProductHistorySchema.index({ storeId: 1, createdAt: -1 });
compositeProductHistorySchema.index({ action: 1, createdAt: -1 });
compositeProductHistorySchema.index({ 'operator.userId': 1, createdAt: -1 });
compositeProductHistorySchema.index({ actionTime: -1 });

// Compound indexes
compositeProductHistorySchema.index({ productId: 1, action: 1, createdAt: -1 });
compositeProductHistorySchema.index({ storeId: 1, action: 1, createdAt: -1 });

// Static methods
compositeProductHistorySchema.statics.createHistoryRecord = function(data) {
  return new this({
    productId: data.productId,
    productName: data.productName,
    productCode: data.productCode,
    storeId: data.storeId,
    action: data.action,
    quantity: data.quantity,
    unit: data.unit || 'phần',
    stockBefore: data.stockBefore,
    stockAfter: data.stockAfter,
    notes: data.notes || '',
    costInfo: data.costInfo || {},
    operator: {
      userId: data.operator.userId,
      username: data.operator.username,
      fullName: data.operator.fullName,
      role: data.operator.role
    },
    actionTime: data.actionTime || new Date(),
    batchInfo: data.batchInfo || {},
    metadata: data.metadata || {}
  });
};

// Instance methods
compositeProductHistorySchema.methods.toSummary = function() {
  return {
    id: this._id,
    action: this.action,
    quantity: this.quantity,
    unit: this.unit,
    stockAfter: this.stockAfter,
    actionTime: this.actionTime,
    operator: this.operator.fullName || this.operator.username,
    notes: this.notes
  };
};

// Virtual fields
compositeProductHistorySchema.virtual('stockChange').get(function() {
  return this.stockAfter - this.stockBefore;
});

compositeProductHistorySchema.virtual('isPositiveAction').get(function() {
  return ['prepare'].includes(this.action);
});

compositeProductHistorySchema.virtual('isNegativeAction').get(function() {
  return ['serve', 'waste', 'expire'].includes(this.action);
});

// Pre-save middleware
compositeProductHistorySchema.pre('save', function(next) {
  // Generate batch number nếu là prepare action và chưa có
  if (this.action === 'prepare' && !this.batchInfo.batchNumber) {
    const timestamp = Date.now();
    const productCode = this.productCode?.substring(0, 3)?.toUpperCase() || 'PRD';
    this.batchInfo.batchNumber = `${productCode}-${timestamp}`;
  }
  
  next();
});

// Pre-find middleware để populate operator
compositeProductHistorySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'operator.userId',
    select: 'username fullName role'
  });
  next();
});

module.exports = mongoose.model('CompositeProductHistory', compositeProductHistorySchema);