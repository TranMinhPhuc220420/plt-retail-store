# Supplier Management API Documentation

## Overview
The Supplier Management API provides comprehensive functionality for managing suppliers in the retail store system. This includes CRUD operations, performance tracking, and integration with ingredient and inventory management.

## Base URL
```
/api/suppliers
```

## Authentication
All endpoints require JWT authentication with admin role.

## Endpoints

### 1. Get All Suppliers in Store
Retrieve all suppliers for a specific store.

**GET** `/my-suppliers-stores/:storeCode`

**Parameters:**
- `storeCode` (path) - Store code to filter suppliers

**Response:**
```json
[
  {
    "_id": "supplier_id",
    "supplierCode": "SUP001",
    "name": "Fresh Foods Supplier",
    "description": "Premium fresh food supplier",
    "status": "active",
    "contactInfo": {
      "email": "contact@freshfoods.com",
      "phone": "+1234567890",
      "mobile": "+1234567891",
      "website": "https://freshfoods.com",
      "contactPerson": {
        "name": "John Doe",
        "title": "Sales Manager",
        "email": "john@freshfoods.com",
        "phone": "+1234567892"
      }
    },
    "address": {
      "street": "123 Supply Street",
      "city": "Supply City",
      "state": "SS",
      "zipCode": "12345",
      "country": "Country"
    },
    "businessInfo": {
      "taxId": "TAX123456",
      "registrationNumber": "REG789",
      "businessType": "company"
    },
    "paymentTerms": {
      "creditDays": 30,
      "paymentMethod": "bank_transfer",
      "bankDetails": {
        "bankName": "Supply Bank",
        "accountNumber": "123456789",
        "routingNumber": "987654321",
        "swiftCode": "SUPBANK"
      }
    },
    "deliveryInfo": {
      "minimumOrderAmount": 100,
      "deliveryTime": "2-3 business days",
      "deliveryZones": ["Zone A", "Zone B"],
      "shippingMethods": ["Truck", "Express"]
    },
    "categories": ["food", "beverages"],
    "notes": "Reliable supplier with good quality products",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### 2. Get Supplier by ID
Retrieve detailed information about a specific supplier.

**GET** `/my-suppliers/:id`

**Parameters:**
- `id` (path) - Supplier ID

**Response:**
```json
{
  "_id": "supplier_id",
  "supplierCode": "SUP001",
  "name": "Fresh Foods Supplier",
  // ... full supplier object with all details
  "storeId": {
    "_id": "store_id",
    "name": "Store Name",
    "storeCode": "STORE001"
  }
}
```

### 3. Create New Supplier
Create a new supplier in a store.

**POST** `/my-suppliers-stores`

**Request Body:**
```json
{
  "supplierCode": "SUP001",
  "name": "Fresh Foods Supplier",
  "description": "Premium fresh food supplier",
  "status": "active",
  "contactInfo": {
    "email": "contact@freshfoods.com",
    "phone": "+1234567890",
    "mobile": "+1234567891",
    "website": "https://freshfoods.com",
    "contactPerson": {
      "name": "John Doe",
      "title": "Sales Manager",
      "email": "john@freshfoods.com",
      "phone": "+1234567892"
    }
  },
  "address": {
    "street": "123 Supply Street",
    "city": "Supply City",
    "state": "SS",
    "zipCode": "12345",
    "country": "Country"
  },
  "businessInfo": {
    "taxId": "TAX123456",
    "registrationNumber": "REG789",
    "businessType": "company"
  },
  "paymentTerms": {
    "creditDays": 30,
    "paymentMethod": "bank_transfer",
    "bankDetails": {
      "bankName": "Supply Bank",
      "accountNumber": "123456789",
      "routingNumber": "987654321",
      "swiftCode": "SUPBANK"
    }
  },
  "deliveryInfo": {
    "minimumOrderAmount": 100,
    "deliveryTime": "2-3 business days",
    "deliveryZones": ["Zone A", "Zone B"],
    "shippingMethods": ["Truck", "Express"]
  },
  "categories": ["food", "beverages"],
  "notes": "Reliable supplier with good quality products",
  "storeCode": "STORE001"
}
```

**Response:**
```json
{
  "_id": "supplier_id",
  "supplierCode": "SUP001",
  "name": "Fresh Foods Supplier",
  // ... full created supplier object
}
```

### 4. Update Supplier
Update an existing supplier's information.

**PUT** `/my-suppliers-stores/:id`

**Parameters:**
- `id` (path) - Supplier ID

**Request Body:**
```json
{
  "name": "Updated Supplier Name",
  "description": "Updated description",
  "status": "inactive",
  "contactInfo": {
    "email": "newemail@supplier.com"
  },
  "storeCode": "STORE001"
}
```

**Response:**
```json
{
  "_id": "supplier_id",
  "supplierCode": "SUP001",
  "name": "Updated Supplier Name",
  // ... full updated supplier object
}
```

### 5. Delete Supplier
Soft delete a supplier.

**DELETE** `/my-suppliers-stores/:id`

**Parameters:**
- `id` (path) - Supplier ID

**Response:**
```json
{
  "message": "supplier_deleted_successfully"
}
```

### 6. Bulk Create Suppliers
Create multiple suppliers at once.

**POST** `/my-suppliers-stores-bulk`

**Request Body:**
```json
{
  "storeCode": "STORE001",
  "suppliers": [
    {
      "supplierCode": "SUP001",
      "name": "Supplier 1",
      "description": "First supplier"
    },
    {
      "supplierCode": "SUP002",
      "name": "Supplier 2",
      "description": "Second supplier"
    }
  ]
}
```

**Response:**
```json
[
  {
    "_id": "supplier_id_1",
    "supplierCode": "SUP001",
    "name": "Supplier 1",
    // ... full supplier object
  },
  {
    "_id": "supplier_id_2",
    "supplierCode": "SUP002",
    "name": "Supplier 2",
    // ... full supplier object
  }
]
```

### 7. Bulk Delete Suppliers
Delete multiple suppliers at once.

**DELETE** `/my-suppliers-stores-bulk`

**Request Body:**
```json
{
  "supplierIds": ["supplier_id_1", "supplier_id_2"]
}
```

**Response:**
```json
{
  "message": "suppliers_deleted_successfully",
  "deletedCount": 2
}
```

### 8. Get Supplier Performance
Retrieve performance metrics for a supplier.

**GET** `/my-suppliers/:id/performance`

**Parameters:**
- `id` (path) - Supplier ID

**Response:**
```json
{
  "rating": 4.5,
  "qualityScore": 85,
  "deliveryScore": 90,
  "serviceScore": 88,
  "totalOrders": 150,
  "onTimeDeliveries": 135,
  "deliveryPerformance": 90,
  "overallPerformance": 87
}
```

### 9. Update Supplier Performance
Update performance metrics for a supplier (internal use).

**PUT** `/my-suppliers/:id/performance`

**Request Body:**
```json
{
  "performance": {
    "rating": 4.5,
    "qualityScore": 85,
    "deliveryScore": 90,
    "serviceScore": 88,
    "totalOrders": 150,
    "onTimeDeliveries": 135
  }
}
```

**Response:**
```json
{
  "rating": 4.5,
  "qualityScore": 85,
  "deliveryScore": 90,
  "serviceScore": 88,
  "totalOrders": 150,
  "onTimeDeliveries": 135
}
```

## Error Responses

### Validation Errors
```json
{
  "error": "supplier_code_is_required"
}
```

### Not Found Errors
```json
{
  "error": "supplier_not_found"
}
```

### Conflict Errors
```json
{
  "error": "supplier_code_already_exists"
}
```

### Server Errors
```json
{
  "error": "failed_to_create_supplier"
}
```

## Field Validation Rules

### Required Fields
- `supplierCode`: 2-50 characters, alphanumeric with hyphens and underscores
- `name`: 2-200 characters
- `storeCode`: Must exist and belong to the user

### Optional Fields
- `description`: Max 1000 characters
- `contactInfo.email`: Valid email format
- `contactInfo.phone`: Valid phone number format
- `contactInfo.mobile`: Valid phone number format
- `contactInfo.website`: Valid URL format
- `status`: One of 'active', 'inactive', 'pending_approval', 'blacklisted'
- `businessInfo.businessType`: One of 'individual', 'company', 'corporation', 'partnership'
- `paymentTerms.creditDays`: 0-365 days
- `paymentTerms.paymentMethod`: One of 'cash', 'bank_transfer', 'check', 'credit_card'
- `deliveryInfo.minimumOrderAmount`: Positive number
- `notes`: Max 2000 characters

## Integration Points

### With Ingredient Management
- Suppliers can be linked to ingredients via `defaultSupplierId`
- Ingredient stock transactions can reference suppliers

### With Inventory Management
- Supplier performance can be updated based on delivery outcomes
- Purchase orders can reference supplier information

## Performance Considerations

1. **Indexing**: Supplier collections are indexed on:
   - `supplierCode` (unique)
   - `name`
   - `ownerId` and `storeId`
   - `status`
   - `categories`

2. **Pagination**: List endpoints support pagination with default page size of 20

3. **Soft Deletes**: Suppliers are soft-deleted to maintain data integrity with related records

## Security

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Only store owners can manage their suppliers
3. **Data Isolation**: Suppliers are isolated by owner and store
4. **Input Validation**: All inputs are validated and sanitized
