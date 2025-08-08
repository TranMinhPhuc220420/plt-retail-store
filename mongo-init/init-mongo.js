// MongoDB initialization script for development
// This script will run when the MongoDB container starts for the first time

db = db.getSiblingDB('retail_store_plt');

// Create initial collections if they don't exist
db.createCollection('users');
db.createCollection('products');
db.createCollection('stores');
db.createCollection('suppliers');
db.createCollection('employees');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.products.createIndex({ "sku": 1 }, { unique: true });
db.products.createIndex({ "name": 1 });
db.stores.createIndex({ "name": 1 });
db.suppliers.createIndex({ "name": 1 });
db.employees.createIndex({ "email": 1 }, { unique: true });

print('MongoDB initialization completed successfully!');
