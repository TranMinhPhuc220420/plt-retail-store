const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { 
      type: String, 
      unique: true, 
      required: true 
    },
    
    // Customer information
    customerName: { type: String, default: 'Khách lẻ' },
    customerPhone: { type: String },
    customerEmail: { type: String },
    
    // Order details
    items: [{
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      productName: { type: String, required: true },
      productCode: { type: String, required: true },
      quantity: { 
        type: Number, 
        required: true,
        min: 1
      },
      unitPrice: { 
        type: mongoose.Schema.Types.Decimal128, 
        required: true 
      },
      totalPrice: { 
        type: mongoose.Schema.Types.Decimal128, 
        required: true 
      },
      unit: { type: String, required: true }
    }],
    
    // Financial information
    subtotal: { 
      type: mongoose.Schema.Types.Decimal128, 
      required: true 
    },
    taxAmount: { 
      type: mongoose.Schema.Types.Decimal128, 
      default: 0 
    },
    taxRate: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    discountAmount: { 
      type: mongoose.Schema.Types.Decimal128, 
      default: 0 
    },
    discountRate: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    totalAmount: { 
      type: mongoose.Schema.Types.Decimal128, 
      required: true 
    },
    
    // Payment information
    paymentMethod: { 
      type: String, 
      required: true,
      enum: ['cash', 'card', 'transfer', 'mixed']
    },
    paymentDetails: {
      cashAmount: { type: mongoose.Schema.Types.Decimal128, default: 0 },
      cardAmount: { type: mongoose.Schema.Types.Decimal128, default: 0 },
      transferAmount: { type: mongoose.Schema.Types.Decimal128, default: 0 },
      changeAmount: { type: mongoose.Schema.Types.Decimal128, default: 0 }
    },
    paymentStatus: { 
      type: String, 
      required: true,
      enum: ['pending', 'paid', 'partial', 'refunded'],
      default: 'pending'
    },
    
    // Order status
    status: { 
      type: String, 
      required: true,
      enum: ['draft', 'confirmed', 'completed', 'cancelled'],
      default: 'draft'
    },
    
    // Staff and store information
    employeeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Employee', 
      required: false // Made optional for demo purposes
    },
    employeeName: { type: String, required: false },
    storeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Store', 
      required: false // Made optional for demo purposes
    },
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: false // Made optional for demo purposes
    },
    
    // Additional information
    notes: { type: String },
    completedAt: { type: Date },
    deleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

// Index for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ storeId: 1, createdAt: -1 });
orderSchema.index({ employeeId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

// Generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last order of today
    const lastOrder = await mongoose.model('Order').findOne({
      orderNumber: new RegExp(`^ORD${dateString}`)
    }).sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `ORD${dateString}${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  // Only calculate if not already set (for demo orders) or if items changed
  if (!this.subtotal || this.isModified('items')) {
    // Calculate subtotal
    let subtotal = 0;
    this.items.forEach(item => {
      const itemTotal = parseFloat(item.totalPrice.toString());
      subtotal += itemTotal;
    });
    
    this.subtotal = mongoose.Types.Decimal128.fromString(String(subtotal));
    
    // Calculate tax amount
    const taxAmount = (subtotal * this.taxRate) / 100;
    this.taxAmount = mongoose.Types.Decimal128.fromString(String(taxAmount));
    
    // Calculate discount amount
    const discountAmount = (subtotal * this.discountRate) / 100;
    this.discountAmount = mongoose.Types.Decimal128.fromString(String(discountAmount));
    
    // Calculate total amount
    const totalAmount = subtotal + taxAmount - discountAmount;
    this.totalAmount = mongoose.Types.Decimal128.fromString(String(totalAmount));
  }
  
  next();
});

// Virtual for formatted amounts
orderSchema.virtual('formattedSubtotal').get(function() {
  return parseFloat(this.subtotal.toString()).toLocaleString('vi-VN');
});

orderSchema.virtual('formattedTotalAmount').get(function() {
  return parseFloat(this.totalAmount.toString()).toLocaleString('vi-VN');
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
