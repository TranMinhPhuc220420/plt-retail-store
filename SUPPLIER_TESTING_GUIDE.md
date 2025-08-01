# Supplier Management Demo Data and Testing Instructions

## Demo Data Setup

### Sample Suppliers Data

Use this data to test the supplier management system. You can create these suppliers through the UI or API.

#### Supplier 1: Fresh Foods Co.
```json
{
  "supplierCode": "FRESH001",
  "name": "Fresh Foods Co.",
  "description": "Premium fresh produce and organic ingredients supplier",
  "status": "active",
  "categories": ["food", "organic", "produce"],
  "contactInfo": {
    "email": "orders@freshfoods.com",
    "phone": "+1-555-0101",
    "mobile": "+1-555-0102",
    "website": "https://freshfoods.com",
    "contactPerson": {
      "name": "Sarah Johnson",
      "title": "Sales Manager",
      "email": "sarah.johnson@freshfoods.com",
      "phone": "+1-555-0103"
    }
  },
  "address": {
    "street": "1234 Fresh Street",
    "city": "Produce City",
    "state": "CA",
    "zipCode": "90210",
    "country": "United States"
  },
  "businessInfo": {
    "taxId": "FF-123456789",
    "registrationNumber": "REG-FF-001",
    "businessType": "company"
  },
  "paymentTerms": {
    "creditDays": 30,
    "paymentMethod": "bank_transfer",
    "bankDetails": {
      "bankName": "Fresh Bank",
      "accountNumber": "1234567890",
      "routingNumber": "987654321",
      "swiftCode": "FRESHBNK"
    }
  },
  "deliveryInfo": {
    "minimumOrderAmount": 200,
    "deliveryTime": "Next day for orders placed before 2 PM",
    "deliveryZones": ["Zone A", "Zone B", "Zone C"],
    "shippingMethods": ["Refrigerated Truck", "Express Delivery"]
  },
  "notes": "Excellent quality produce, reliable delivery schedule. Special discounts for bulk orders over $1000."
}
```

#### Supplier 2: Global Beverages Ltd.
```json
{
  "supplierCode": "BEVERAGE002",
  "name": "Global Beverages Ltd.",
  "description": "International beverage distributor specializing in premium drinks",
  "status": "active",
  "categories": ["beverages", "alcohol", "non-alcoholic"],
  "contactInfo": {
    "email": "sales@globalbeverages.com",
    "phone": "+1-555-0201",
    "mobile": "+1-555-0202",
    "website": "https://globalbeverages.com",
    "contactPerson": {
      "name": "Michael Chen",
      "title": "Regional Sales Director",
      "email": "m.chen@globalbeverages.com",
      "phone": "+1-555-0203"
    }
  },
  "address": {
    "street": "5678 Beverage Blvd",
    "city": "Drink Town",
    "state": "NY",
    "zipCode": "10001",
    "country": "United States"
  },
  "businessInfo": {
    "taxId": "GB-987654321",
    "registrationNumber": "REG-GB-002",
    "businessType": "corporation"
  },
  "paymentTerms": {
    "creditDays": 45,
    "paymentMethod": "credit_card",
    "bankDetails": {
      "bankName": "Beverage Bank",
      "accountNumber": "0987654321",
      "routingNumber": "123456789",
      "swiftCode": "BEVBANK"
    }
  },
  "deliveryInfo": {
    "minimumOrderAmount": 500,
    "deliveryTime": "2-3 business days",
    "deliveryZones": ["Zone A", "Zone D", "Zone E"],
    "shippingMethods": ["Standard Delivery", "Express", "Pallet Delivery"]
  },
  "notes": "Wide selection of international beverages. Requires 48-hour notice for special orders."
}
```

#### Supplier 3: Kitchen Equipment Pro
```json
{
  "supplierCode": "EQUIP003",
  "name": "Kitchen Equipment Pro",
  "description": "Professional kitchen equipment and supplies",
  "status": "active",
  "categories": ["equipment", "kitchen", "supplies"],
  "contactInfo": {
    "email": "info@kitchenequippro.com",
    "phone": "+1-555-0301",
    "mobile": "+1-555-0302",
    "website": "https://kitchenequippro.com",
    "contactPerson": {
      "name": "David Martinez",
      "title": "Account Manager",
      "email": "d.martinez@kitchenequippro.com",
      "phone": "+1-555-0303"
    }
  },
  "address": {
    "street": "9012 Equipment Ave",
    "city": "Supply City",
    "state": "TX",
    "zipCode": "75001",
    "country": "United States"
  },
  "businessInfo": {
    "taxId": "KEP-456789123",
    "registrationNumber": "REG-KEP-003",
    "businessType": "company"
  },
  "paymentTerms": {
    "creditDays": 60,
    "paymentMethod": "check",
    "bankDetails": {
      "bankName": "Equipment Bank",
      "accountNumber": "4567891230",
      "routingNumber": "654321987",
      "swiftCode": "EQUIPBNK"
    }
  },
  "deliveryInfo": {
    "minimumOrderAmount": 1000,
    "deliveryTime": "5-7 business days for standard items",
    "deliveryZones": ["Zone B", "Zone C", "Zone F"],
    "shippingMethods": ["Freight", "White Glove Delivery", "Installation Service"]
  },
  "notes": "Specializes in commercial-grade equipment. Installation and maintenance services available."
}
```

#### Supplier 4: Eco Packaging Solutions
```json
{
  "supplierCode": "PACK004",
  "name": "Eco Packaging Solutions",
  "description": "Sustainable and eco-friendly packaging materials",
  "status": "pending_approval",
  "categories": ["packaging", "eco-friendly", "disposables"],
  "contactInfo": {
    "email": "contact@ecopackaging.com",
    "phone": "+1-555-0401",
    "mobile": "+1-555-0402",
    "website": "https://ecopackaging.com",
    "contactPerson": {
      "name": "Emma Wilson",
      "title": "Sustainability Coordinator",
      "email": "e.wilson@ecopackaging.com",
      "phone": "+1-555-0403"
    }
  },
  "address": {
    "street": "3456 Green Way",
    "city": "Eco City",
    "state": "OR",
    "zipCode": "97201",
    "country": "United States"
  },
  "businessInfo": {
    "taxId": "EPS-789123456",
    "registrationNumber": "REG-EPS-004",
    "businessType": "company"
  },
  "paymentTerms": {
    "creditDays": 30,
    "paymentMethod": "bank_transfer",
    "bankDetails": {
      "bankName": "Green Bank",
      "accountNumber": "7891234560",
      "routingNumber": "321987654",
      "swiftCode": "GREENBNK"
    }
  },
  "deliveryInfo": {
    "minimumOrderAmount": 150,
    "deliveryTime": "3-5 business days",
    "deliveryZones": ["Zone A", "Zone C", "Zone D"],
    "shippingMethods": ["Carbon Neutral Shipping", "Standard Delivery"]
  },
  "notes": "New supplier specializing in biodegradable packaging. Currently under evaluation."
}
```

#### Supplier 5: Spice World International
```json
{
  "supplierCode": "SPICE005",
  "name": "Spice World International",
  "description": "Exotic spices and seasonings from around the world",
  "status": "inactive",
  "categories": ["spices", "seasonings", "international"],
  "contactInfo": {
    "email": "orders@spiceworld.com",
    "phone": "+1-555-0501",
    "mobile": "+1-555-0502",
    "website": "https://spiceworld.com",
    "contactPerson": {
      "name": "Raj Patel",
      "title": "Import Manager",
      "email": "r.patel@spiceworld.com",
      "phone": "+1-555-0503"
    }
  },
  "address": {
    "street": "7890 Spice Road",
    "city": "Flavor Town",
    "state": "FL",
    "zipCode": "33101",
    "country": "United States"
  },
  "businessInfo": {
    "taxId": "SWI-321654987",
    "registrationNumber": "REG-SWI-005",
    "businessType": "company"
  },
  "paymentTerms": {
    "creditDays": 30,
    "paymentMethod": "bank_transfer",
    "bankDetails": {
      "bankName": "Spice Bank",
      "accountNumber": "3216549870",
      "routingNumber": "789456123",
      "swiftCode": "SPICEBNK"
    }
  },
  "deliveryInfo": {
    "minimumOrderAmount": 100,
    "deliveryTime": "1-2 weeks for international items",
    "deliveryZones": ["Zone A", "Zone B"],
    "shippingMethods": ["Air Freight", "Sea Freight", "Express"]
  },
  "notes": "Currently inactive due to supply chain issues. Excellent quality spices when available."
}
```

## Testing Instructions

### Prerequisites
1. Ensure you have admin access to the system
2. Have a test store configured
3. Backend API endpoints are running
4. Frontend application is accessible

### Manual Testing Checklist

#### 1. Supplier List View
- [ ] Navigate to supplier management page
- [ ] Verify empty state when no suppliers exist
- [ ] Create first supplier and verify it appears in list
- [ ] Test search functionality with different search terms
- [ ] Test status filter with different options
- [ ] Test sorting by clicking column headers
- [ ] Test pagination with large datasets
- [ ] Verify responsive design on different screen sizes

#### 2. Create Supplier
- [ ] Click "Add Supplier" button
- [ ] Verify form opens with all tabs
- [ ] Test form validation with empty required fields
- [ ] Test supplier code uniqueness validation
- [ ] Fill in all tabs with sample data
- [ ] Submit form and verify supplier is created
- [ ] Verify success message appears
- [ ] Verify new supplier appears in list

#### 3. Edit Supplier
- [ ] Click edit button on existing supplier
- [ ] Verify form pre-populates with existing data
- [ ] Modify some fields in different tabs
- [ ] Submit changes and verify updates
- [ ] Verify success message appears
- [ ] Verify changes appear in list and detail view

#### 4. View Supplier Details
- [ ] Click view/eye icon on supplier
- [ ] Verify all information displays correctly
- [ ] Test navigation between tabs
- [ ] Verify contact information displays with icons
- [ ] Test performance tab (if data available)
- [ ] Test edit and delete buttons

#### 5. Delete Supplier
- [ ] Click delete button on supplier
- [ ] Verify confirmation dialog appears
- [ ] Cancel deletion and verify supplier remains
- [ ] Confirm deletion and verify supplier is removed
- [ ] Verify success message appears

#### 6. Bulk Operations
- [ ] Select multiple suppliers using checkboxes
- [ ] Verify bulk delete button appears
- [ ] Test bulk delete with confirmation
- [ ] Verify all selected suppliers are removed

#### 7. Form Validation Testing
- [ ] Test each required field validation
- [ ] Test email format validation
- [ ] Test phone number format validation
- [ ] Test URL format validation
- [ ] Test numeric field validation
- [ ] Test text length limits
- [ ] Test special character handling

#### 8. Error Handling
- [ ] Test with network disconnected
- [ ] Test with invalid API responses
- [ ] Test form submission with server errors
- [ ] Verify error messages are user-friendly
- [ ] Test error recovery scenarios

#### 9. Performance Testing
- [ ] Create 100+ suppliers (use bulk creation)
- [ ] Test list loading performance
- [ ] Test search performance with large dataset
- [ ] Test form submission performance
- [ ] Monitor browser console for errors

#### 10. Accessibility Testing
- [ ] Navigate using only keyboard
- [ ] Test with screen reader (if available)
- [ ] Verify proper focus management
- [ ] Check color contrast ratios
- [ ] Test with browser zoom at 200%

### API Testing

Use these curl commands to test API endpoints directly:

#### Create Supplier
```bash
curl -X POST http://localhost:5000/api/suppliers/my-suppliers-stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "supplierCode": "TEST001",
    "name": "Test Supplier",
    "description": "A test supplier",
    "storeCode": "YOUR_STORE_CODE",
    "contactInfo": {
      "email": "test@supplier.com",
      "phone": "+1234567890"
    }
  }'
```

#### Get Suppliers
```bash
curl -X GET http://localhost:5000/api/suppliers/my-suppliers-stores/YOUR_STORE_CODE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Supplier
```bash
curl -X PUT http://localhost:5000/api/suppliers/my-suppliers-stores/SUPPLIER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Updated Supplier Name",
    "storeCode": "YOUR_STORE_CODE"
  }'
```

#### Delete Supplier
```bash
curl -X DELETE http://localhost:5000/api/suppliers/my-suppliers-stores/SUPPLIER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Unit Test Coverage

Ensure the following test cases are covered:

#### Backend Tests
- [ ] Supplier model validation
- [ ] Controller CRUD operations
- [ ] Middleware validation
- [ ] Error handling
- [ ] Authentication and authorization
- [ ] Database constraints

#### Frontend Tests
- [ ] Component rendering
- [ ] Form validation
- [ ] State management
- [ ] API integration
- [ ] User interactions
- [ ] Error boundaries

### Performance Benchmarks

Target performance metrics:
- [ ] Page load time < 2 seconds
- [ ] Form submission < 1 second
- [ ] Search results < 500ms
- [ ] API response time < 200ms
- [ ] Database queries < 100ms

### Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Deployment Testing

After deployment:
- [ ] Verify all API endpoints work in production
- [ ] Test with production database
- [ ] Verify SSL certificates
- [ ] Test backup and restore procedures
- [ ] Monitor error logs
- [ ] Verify monitoring and alerting

## Troubleshooting Common Issues

### Supplier Code Conflicts
- Ensure supplier codes are unique within the store
- Use clear naming conventions
- Consider including store prefix in codes

### Form Validation Errors
- Check all required fields are filled
- Verify email and phone formats
- Ensure numeric fields contain valid numbers

### Performance Issues
- Check database indexes are created
- Monitor query performance
- Optimize large data sets with pagination

### UI/UX Issues
- Test on different screen sizes
- Verify keyboard navigation works
- Check color contrast for accessibility

## Additional Testing Scenarios

### Edge Cases
- Very long supplier names
- Special characters in input fields
- Maximum length field values
- Duplicate email addresses
- Invalid phone number formats

### Integration Testing
- Test with ingredient management system
- Verify supplier selection in purchase orders
- Test performance metric updates
- Verify data consistency across modules

### Security Testing
- Test unauthorized access attempts
- Verify data encryption
- Test input sanitization
- Check for SQL injection vulnerabilities
