# Ingredient Management API Documentation

This document describes the Ingredient Management feature that mirrors the existing Inventory Management functionality. The feature provides comprehensive CRUD operations for ingredients with real-time stock tracking, transaction logging, and advanced reporting capabilities.

## Overview

The Ingredient Management system consists of:

1. **Enhanced Ingredient Model** - Core ingredient information with inventory support
2. **Ingredient Stock Balance Model** - Real-time stock levels per ingredient/warehouse/batch
3. **Ingredient Stock Transaction Model** - Complete audit trail of all inventory movements
4. **Supplier Model** - Supplier information for ingredient sourcing
5. **Comprehensive API Endpoints** - Full CRUD operations and inventory management
6. **Advanced Validation** - Input validation and business rule enforcement
7. **Reporting Features** - Low stock alerts, expiration tracking, and analytics

## Models

### Ingredient Model
Enhanced with inventory management features:
- Unique ingredient codes
- Categories and descriptions
- Storage requirements (temperature, shelf life)
- Nutritional information and allergen tracking
- Supplier relationships
- Min/max stock levels
- Cost tracking

### IngredientStockBalance Model
Tracks current stock levels:
- Per ingredient/warehouse/batch tracking
- Expiration date management
- Cost per unit and total cost
- FIFO inventory rotation support
- Quality control metadata

### IngredientStockTransaction Model
Complete transaction history:
- Stock in, out, adjustments, transfers
- Batch and lot tracking
- Quality check records
- Supplier and cost information
- Recipe usage tracking

### Supplier Model
Comprehensive supplier management:
- Contact and business information
- Payment terms and banking details
- Performance ratings and analytics
- Delivery zones and minimums
- Certifications and compliance

## API Endpoints

### Ingredient CRUD Operations

#### GET /api/ingredients
Get all ingredients with optional filtering
**Query Parameters:**
- `storeCode` - Filter by store
- `category` - Filter by ingredient category
- `status` - Filter by status (active/inactive/discontinued)
- `warehouseId` - Filter by warehouse

**Response:** Array of ingredients with current stock levels

#### GET /api/ingredients/:id
Get ingredient by ID with detailed information
**Query Parameters:**
- `storeCode` - Store context
- `includeStock` - Include detailed stock information (true/false)

**Response:** Single ingredient with optional stock details

#### POST /api/ingredients
Create new ingredient
**Request Body:**
```json
{
  "ingredientCode": "ING001",
  "name": "Premium Flour",
  "description": "High-quality wheat flour",
  "category": "baking",
  "unit": "kg",
  "minStock": 50,
  "maxStock": 500,
  "standardCost": 2.50,
  "warehouseId": "warehouse_id",
  "storeCode": "STORE01",
  "properties": {
    "storageTemp": "room_temp",
    "shelfLifeDays": 365,
    "allergens": ["gluten"]
  },
  "defaultSupplierId": "supplier_id"
}
```

#### PUT /api/ingredients/:id
Update ingredient
**Query Parameters:**
- `storeCode` - Store context

**Request Body:** Partial ingredient data to update

#### DELETE /api/ingredients/:id
Soft delete ingredient (only if no active stock)
**Query Parameters:**
- `storeCode` - Store context

### Ingredient Inventory Operations

#### POST /api/ingredient-inventory/stock-in
Receive ingredients into warehouse
**Request Body:**
```json
{
  "storeCode": "STORE01",
  "ingredientId": "ingredient_id",
  "warehouseId": "warehouse_id",
  "quantity": 100,
  "unit": "kg",
  "note": "Weekly delivery",
  "batchNumber": "BATCH001",
  "expirationDate": "2024-12-31",
  "supplierId": "supplier_id",
  "referenceNumber": "PO001",
  "costPerUnit": 2.45,
  "temperatureCondition": "room_temp",
  "qualityCheck": {
    "passed": true,
    "notes": "Good quality"
  }
}
```

#### POST /api/ingredient-inventory/stock-out
Issue ingredients from warehouse
**Request Body:**
```json
{
  "storeCode": "STORE01",
  "ingredientId": "ingredient_id",
  "warehouseId": "warehouse_id",
  "quantity": 10,
  "unit": "kg",
  "note": "For Recipe #123",
  "batchNumber": "BATCH001", // Optional: specific batch
  "recipeId": "recipe_id",
  "temperatureCondition": "room_temp"
}
```

#### POST /api/ingredient-inventory/stock-take
Perform physical inventory count and adjustment
**Request Body:**
```json
{
  "storeCode": "STORE01",
  "ingredientId": "ingredient_id",
  "warehouseId": "warehouse_id",
  "physicalCount": 95,
  "unit": "kg",
  "note": "Monthly stock take",
  "batchNumber": "BATCH001"
}
```

### Stock Balance Queries

#### GET /api/ingredient-inventory/balance/:storeCode/:ingredientId/:warehouseId
Get stock balance for specific ingredient in warehouse
**Query Parameters:**
- `batchNumber` - Filter by specific batch

**Response:** Array of stock balances with total quantity

#### GET /api/ingredient-inventory/balances/:storeCode
Get all ingredient stock balances for a store
**Query Parameters:**
- `warehouseId` - Filter by warehouse
- `lowStock` - Show only low stock items (true/false)
- `expiring` - Show only expiring items (true/false)
- `expired` - Show only expired items (true/false)

**Response:** Array of stock balances with filtering applied

### Transaction History

#### GET /api/ingredient-inventory/transactions/:storeCode
Get ingredient transaction history with filtering and pagination
**Query Parameters:**
- `ingredientId` - Filter by ingredient
- `warehouseId` - Filter by warehouse
- `type` - Filter by transaction type (in/out/adjustment/transfer/expired/damaged)
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)
- `batchNumber` - Filter by batch
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:** Paginated transaction history with filters applied

### Reports

#### GET /api/ingredient-inventory/low-stock/:storeCode
Get low stock report for ingredients
**Query Parameters:**
- `warehouseId` - Filter by warehouse

**Response:** Array of ingredients below minimum stock levels

#### GET /api/ingredient-inventory/expiring/:storeCode
Get expiring ingredients report
**Query Parameters:**
- `warehouseId` - Filter by warehouse
- `days` - Warning days ahead (default: 7)

**Response:** Array of ingredients expiring within specified days

## Key Features

### 1. Real-time Stock Tracking
- Automatic balance updates with each transaction
- Multi-warehouse support
- Batch and lot number tracking
- FIFO inventory rotation

### 2. Expiration Management
- Expiration date tracking per batch
- Automatic expiration alerts
- FIFO dispensing (first to expire, first out)
- Expired stock reporting

### 3. Cost Management
- Cost per unit tracking
- Average cost calculations
- Total cost per batch
- Cost analysis reports

### 4. Quality Control
- Quality check records for incoming stock
- Temperature condition tracking
- Special handling requirements
- Allergen and nutritional information

### 5. Supplier Integration
- Supplier information with each transaction
- Performance tracking
- Payment terms management
- Certification tracking

### 6. Advanced Reporting
- Low stock alerts
- Expiration warnings
- Usage analytics
- Cost reports
- Supplier performance

### 7. Audit Trail
- Complete transaction history
- User tracking for all changes
- Note and reason tracking
- Immutable transaction records

## Validation Rules

### Stock In Validation
- All required fields must be provided
- Quantity must be positive
- Expiration date must be future date
- Warehouse must exist and belong to store/owner
- Ingredient must exist and be active

### Stock Out Validation
- Sufficient stock must be available
- FIFO rules applied for batch selection
- Cannot exceed available quantity
- Warehouse and ingredient validation

### Stock Take Validation
- Physical count cannot be negative
- Must have existing stock balance
- Adjustment amount calculated automatically

### Ingredient Validation
- Ingredient code must be unique
- Required fields validation
- Warehouse must exist
- Unit validation through unit middleware

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "field": "field_name" // For validation errors
}
```

Common error codes:
- `store_not_found`
- `ingredient_not_found`
- `warehouse_not_found`
- `insufficient_stock`
- `validation_failed`
- `ingredient_code_already_exists`
- `cannot_delete_ingredient_with_stock`

## Integration with Existing System

The Ingredient Management feature integrates seamlessly with:

1. **User Management** - Owner and permission checking
2. **Store Management** - Multi-store support
3. **Warehouse Management** - Storage location management
4. **Recipe Management** - Usage tracking for recipes
5. **Unit Management** - Consistent unit validation
6. **Authentication** - JWT token validation
7. **Authorization** - Admin role requirements

## Database Indexes

Optimized database indexes for performance:
- Compound indexes for ingredient-store-warehouse queries
- Date indexes for transaction history
- Batch number indexes for tracking
- Expiration date indexes for alerts
- Text indexes for search functionality

## Performance Considerations

1. **Pagination** - All list endpoints support pagination
2. **Filtering** - Server-side filtering to reduce data transfer
3. **Indexes** - Optimized database indexes for common queries
4. **Aggregation** - Efficient aggregation pipelines for reports
5. **Caching** - Cacheable responses where appropriate

## Security Features

1. **Authentication** - JWT token required for all endpoints
2. **Authorization** - Admin role required for management operations
3. **Ownership** - Users can only access their own data
4. **Input Validation** - Comprehensive input validation
5. **SQL Injection Prevention** - Mongoose ODM protection
6. **Data Sanitization** - Input sanitization for security

## Future Enhancements

1. **Barcode Integration** - Barcode scanning for stock operations
2. **Mobile App Support** - Mobile-optimized endpoints
3. **Automated Reordering** - Automatic purchase order generation
4. **Advanced Analytics** - Machine learning for demand forecasting
5. **Integration APIs** - Third-party system integration
6. **Notification System** - Real-time alerts and notifications
7. **Multi-location Transfers** - Automated transfer between warehouses
