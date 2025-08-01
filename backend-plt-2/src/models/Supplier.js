const mongoose = require('mongoose');

// Supplier model for ingredient sourcing and procurement
const supplierSchema = new mongoose.Schema(
  {
    // Unique supplier code for identification
    supplierCode: { 
      type: String, 
      unique: true, 
      required: true 
    },
    
    // Supplier name
    name: { 
      type: String, 
      required: true 
    },
    
    // Description of the supplier
    description: { 
      type: String, 
      default: '' 
    },
    
    // Contact information
    contactInfo: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      mobile: { type: String, default: '' },
      website: { type: String, default: '' },
      
      // Primary contact person
      contactPerson: {
        name: { type: String, default: '' },
        title: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' }
      }
    },
    
    // Address information
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' }
    },
    
    // Business information
    businessInfo: {
      taxId: { type: String, default: '' },
      registrationNumber: { type: String, default: '' },
      businessType: { 
        type: String, 
        enum: ['individual', 'company', 'corporation', 'partnership'],
        default: 'company'
      }
    },
    
    // Payment terms and conditions
    paymentTerms: {
      creditDays: { type: Number, default: 30 },
      paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'check', 'credit_card'],
        default: 'bank_transfer'
      },
      bankDetails: {
        bankName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        routingNumber: { type: String, default: '' },
        swiftCode: { type: String, default: '' }
      }
    },
    
    // Supplier ratings and performance
    performance: {
      rating: { type: Number, min: 0, max: 5, default: 0 },
      qualityScore: { type: Number, min: 0, max: 100, default: 0 },
      deliveryScore: { type: Number, min: 0, max: 100, default: 0 },
      serviceScore: { type: Number, min: 0, max: 100, default: 0 },
      totalOrders: { type: Number, default: 0 },
      onTimeDeliveries: { type: Number, default: 0 }
    },
    
    // Supplier categories and specializations
    categories: [{ type: String }],
    
    // Delivery information
    deliveryInfo: {
      minimumOrderAmount: { type: mongoose.Schema.Types.Decimal128, default: null },
      deliveryTime: { type: String, default: '' }, // e.g., "2-3 business days"
      deliveryZones: [{ type: String }],
      shippingMethods: [{ type: String }]
    },
    
    // Status of the supplier
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'blacklisted', 'pending_approval'],
      default: 'active'
    },
    
    // Owner and store information
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    
    storeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Store', 
      required: true 
    },
    
    // Notes and additional information
    notes: { type: String, default: '' },
    
    // Certifications and compliance
    certifications: [{ 
      name: String,
      issuedBy: String,
      issueDate: Date,
      expiryDate: Date,
      certificateNumber: String
    }],
    
    // Soft delete flag
    deleted: { 
      type: Boolean, 
      default: false 
    },
    
    // References to related documents
    ingredients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' }],
    stockTransactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'IngredientStockTransaction' }]
  },
  { timestamps: true }
);

// Create indexes for better performance
supplierSchema.index({ supplierCode: 1 }, { unique: true });
supplierSchema.index({ name: 1 });
supplierSchema.index({ ownerId: 1, storeId: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ categories: 1 });
supplierSchema.index({ 'contactInfo.email': 1 });

// Virtual for calculating delivery performance percentage
supplierSchema.virtual('deliveryPerformance').get(function() {
  if (this.performance.totalOrders === 0) return 0;
  return Math.round((this.performance.onTimeDeliveries / this.performance.totalOrders) * 100);
});

// Virtual for calculating overall performance score
supplierSchema.virtual('overallPerformance').get(function() {
  const { qualityScore, deliveryScore, serviceScore } = this.performance;
  return Math.round((qualityScore + deliveryScore + serviceScore) / 3);
});

module.exports = mongoose.model('Supplier', supplierSchema);
