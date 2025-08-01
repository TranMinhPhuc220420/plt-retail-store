const Joi = require('joi');
const Supplier = require('../../models/Supplier');
const Store = require('../../models/Store');

// Base supplier schema for validation
const baseSupplierSchema = {
  supplierCode: Joi.string().min(2).max(50).required().regex(/^[a-zA-Z0-9_-]+$/).messages({
    'string.base': 'supplier_code_must_be_a_string',
    'string.empty': 'supplier_code_is_required',
    'string.min': 'supplier_code_too_short',
    'string.max': 'supplier_code_too_long',
    'string.pattern.base': 'supplier_code_invalid_format',
    'any.required': 'supplier_code_is_required'
  }),
  name: Joi.string().min(2).max(200).required().messages({
    'string.base': 'supplier_name_must_be_a_string',
    'string.empty': 'supplier_name_is_required',
    'string.min': 'supplier_name_too_short',
    'string.max': 'supplier_name_too_long',
    'any.required': 'supplier_name_is_required'
  }),
  description: Joi.string().allow('').max(1000).messages({
    'string.base': 'description_must_be_a_string',
    'string.max': 'description_too_long'
  }),
  contactInfo: Joi.object({
    email: Joi.string().email().allow('').messages({
      'string.email': 'invalid_email_format'
    }),
    phone: Joi.string().allow('').regex(/^[\+]?[0-9\s\-\(\)]+$/).messages({
      'string.pattern.base': 'invalid_phone_format'
    }),
    mobile: Joi.string().allow('').regex(/^[\+]?[0-9\s\-\(\)]+$/).messages({
      'string.pattern.base': 'invalid_mobile_format'
    }),
    website: Joi.string().uri().allow('').messages({
      'string.uri': 'invalid_website_format'
    }),
    contactPerson: Joi.object({
      name: Joi.string().allow('').max(100).messages({
        'string.max': 'contact_person_name_too_long'
      }),
      title: Joi.string().allow('').max(100).messages({
        'string.max': 'contact_person_title_too_long'
      }),
      email: Joi.string().email().allow('').messages({
        'string.email': 'invalid_contact_person_email'
      }),
      phone: Joi.string().allow('').regex(/^[\+]?[0-9\s\-\(\)]+$/).messages({
        'string.pattern.base': 'invalid_contact_person_phone'
      })
    }).optional()
  }).optional(),
  address: Joi.object({
    street: Joi.string().allow('').max(200),
    city: Joi.string().allow('').max(100),
    state: Joi.string().allow('').max(100),
    zipCode: Joi.string().allow('').max(20),
    country: Joi.string().allow('').max(100)
  }).optional(),
  businessInfo: Joi.object({
    taxId: Joi.string().allow('').max(50),
    registrationNumber: Joi.string().allow('').max(50),
    businessType: Joi.string().valid('individual', 'company', 'corporation', 'partnership').optional()
  }).optional(),
  paymentTerms: Joi.object({
    creditDays: Joi.number().integer().min(0).max(365).optional(),
    paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'check', 'credit_card').optional(),
    bankDetails: Joi.object({
      bankName: Joi.string().allow('').max(100),
      accountNumber: Joi.string().allow('').max(50),
      routingNumber: Joi.string().allow('').max(20),
      swiftCode: Joi.string().allow('').max(20)
    }).optional()
  }).optional(),
  categories: Joi.array().items(Joi.string().max(100)).optional(),
  deliveryInfo: Joi.object({
    minimumOrderAmount: Joi.number().min(0).optional(),
    deliveryTime: Joi.string().allow('').max(200),
    deliveryZones: Joi.array().items(Joi.string().max(100)).optional(),
    shippingMethods: Joi.array().items(Joi.string().max(100)).optional()
  }).optional(),
  status: Joi.string().valid('active', 'inactive', 'blacklisted', 'pending_approval').optional(),
  notes: Joi.string().allow('').max(2000).messages({
    'string.max': 'notes_too_long'
  }),
  certifications: Joi.array().items(
    Joi.object({
      name: Joi.string().max(100).required(),
      issuedBy: Joi.string().max(100).optional(),
      issueDate: Joi.date().optional(),
      expiryDate: Joi.date().optional(),
      certificateNumber: Joi.string().max(100).optional()
    })
  ).optional(),
  storeCode: Joi.string().required().messages({
    'any.required': 'store_code_is_required'
  })
};

// Schema for creating a supplier
const supplierCreateSchema = Joi.object(baseSupplierSchema);

// Schema for updating a supplier (all fields optional except validation requirements)
const supplierUpdateSchema = Joi.object({
  ...Object.fromEntries(
    Object.entries(baseSupplierSchema).map(([key, schema]) => [
      key, 
      key === 'storeCode' ? schema : schema.optional()
    ])
  )
}).min(1).messages({
  'object.min': 'at_least_one_field_must_be_provided'
});

// Schema for bulk creation
const supplierCreateBulkSchema = Joi.object({
  suppliers: Joi.array().items(
    Joi.object({
      ...Object.fromEntries(
        Object.entries(baseSupplierSchema).map(([key, schema]) => [
          key, 
          key === 'storeCode' ? undefined : schema
        ]).filter(([key]) => key !== 'storeCode')
      )
    })
  ).required().messages({
    'array.base': 'suppliers_must_be_an_array',
    'array.empty': 'suppliers_array_cannot_be_empty',
    'any.required': 'suppliers_required'
  }),
  storeCode: Joi.string().required().messages({
    'any.required': 'store_code_required'
  })
});

// Middleware for creating a supplier
const verifyFormCreateSupplier = async (req, res, next) => {
  try {
    const { error } = supplierCreateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { storeCode, supplierCode } = req.body;
    
    // Find and verify store ownership
    const store = await Store.findOne({ 
      storeCode, 
      ownerId: req.user._id, 
      deleted: false 
    });
    
    if (!store) {
      return res.status(404).json({ error: 'store_not_found' });
    }

    // Check if supplier code already exists for this owner and store
    const existingSupplier = await Supplier.findOne({ 
      supplierCode, 
      storeId: store._id, 
      ownerId: req.user._id,
      deleted: false 
    });
    
    if (existingSupplier) {
      return res.status(400).json({ error: 'supplier_code_already_exists' });
    }

    // Set storeId for use in controller
    req.body.storeId = store._id;
    
    next();
  } catch (error) {
    console.error('Supplier validation error:', error);
    res.status(500).json({ error: 'validation_error' });
  }
};

// Middleware for updating a supplier
const verifyFormUpdateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = supplierUpdateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!id) {
      return res.status(400).json({ error: 'supplier_id_required' });
    }

    // If supplier code is being updated, check for conflicts
    if (req.body.supplierCode) {
      const { storeCode, supplierCode } = req.body;
      
      if (storeCode) {
        const store = await Store.findOne({ 
          storeCode, 
          ownerId: req.user._id, 
          deleted: false 
        });
        
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }

        // Check if another supplier has this code
        const existingSupplier = await Supplier.findOne({ 
          supplierCode, 
          storeId: store._id, 
          ownerId: req.user._id,
          _id: { $ne: id },
          deleted: false 
        });
        
        if (existingSupplier) {
          return res.status(400).json({ error: 'supplier_code_already_exists' });
        }

        req.body.storeId = store._id;
      }
    }

    next();
  } catch (error) {
    console.error('Supplier update validation error:', error);
    res.status(500).json({ error: 'validation_error' });
  }
};

// Middleware for bulk creating suppliers
const verifyFormCreateSupplierBulk = async (req, res, next) => {
  try {
    const { error } = supplierCreateBulkSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { storeCode, suppliers } = req.body;
    
    // Find and verify store ownership
    const store = await Store.findOne({ 
      storeCode, 
      ownerId: req.user._id, 
      deleted: false 
    });
    
    if (!store) {
      return res.status(404).json({ error: 'store_not_found' });
    }

    // Check for duplicate supplier codes within the batch
    const supplierCodes = suppliers.map(s => s.supplierCode);
    const uniqueCodes = new Set(supplierCodes);
    
    if (supplierCodes.length !== uniqueCodes.size) {
      return res.status(400).json({ error: 'duplicate_supplier_codes_in_batch' });
    }

    // Check for existing supplier codes in database
    const existingSuppliers = await Supplier.find({
      supplierCode: { $in: supplierCodes },
      storeId: store._id,
      ownerId: req.user._id,
      deleted: false
    });

    if (existingSuppliers.length > 0) {
      const existingCodes = existingSuppliers.map(s => s.supplierCode);
      return res.status(400).json({ 
        error: 'supplier_codes_already_exist',
        existingCodes: existingCodes
      });
    }

    // Set storeId for use in controller
    req.body.storeId = store._id;
    
    next();
  } catch (error) {
    console.error('Supplier bulk validation error:', error);
    res.status(500).json({ error: 'validation_error' });
  }
};

module.exports = {
  verifyFormCreateSupplier,
  verifyFormUpdateSupplier,
  verifyFormCreateSupplierBulk
};
