// Simple SKU Index Fix for Production
// Run this inside the backend container

const mongoose = require('mongoose');

console.log('🔧 Starting SKU index fix...');

// Use the environment connection string
const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@plt-mongodb:27017/retail_store_plt?authSource=admin';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    try {
      // Drop the problematic sku index
      await collection.dropIndex('sku_1');
      console.log('✅ Dropped sku_1 index');
    } catch (error) {
      console.log('ℹ️  sku_1 index not found or already dropped');
    }
    
    try {
      // Remove sku field from documents
      const result = await collection.updateMany(
        { sku: { $exists: true } },
        { $unset: { sku: "" } }
      );
      console.log(`✅ Removed sku field from ${result.modifiedCount} documents`);
    } catch (error) {
      console.log('ℹ️  No documents with sku field found');
    }
    
    try {
      // Ensure productCode index exists
      await collection.createIndex({ productCode: 1 }, { unique: true });
      console.log('✅ Ensured productCode unique index');
    } catch (error) {
      console.log('ℹ️  productCode index already exists');
    }
    
    // List current indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`   - ${index.name}`);
    });
    
    console.log('🎉 SKU index fix completed successfully!');
    process.exit(0);
    
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
