const mongoose = require('mongoose');

/**
 * Fix SKU Index Issue Migration Script
 * This script fixes the SKU duplicate key error by removing the problematic index
 * and cleaning up any existing SKU field from products collection
 */

const fixSkuIndexIssue = async () => {
  try {
    console.log('🔧 Starting SKU index fix migration...');
    
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/retail_store_plt?authSource=admin';
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');
    }
    
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    // 1. Check if sku index exists and drop it
    try {
      const indexes = await collection.indexes();
      const skuIndexExists = indexes.some(index => index.name === 'sku_1');
      
      if (skuIndexExists) {
        await collection.dropIndex('sku_1');
        console.log('✅ Dropped problematic sku_1 index');
      } else {
        console.log('ℹ️  sku_1 index not found, skipping drop');
      }
    } catch (error) {
      console.log('ℹ️  sku_1 index not found or already dropped:', error.message);
    }
    
    // 2. Check for documents with sku field and remove it
    const documentsWithSku = await collection.countDocuments({ sku: { $exists: true } });
    console.log(`📊 Found ${documentsWithSku} documents with sku field`);
    
    if (documentsWithSku > 0) {
      // Remove sku field from all documents that have it
      const updateResult = await collection.updateMany(
        { sku: { $exists: true } },
        { $unset: { sku: "" } }
      );
      console.log(`✅ Removed sku field from ${updateResult.modifiedCount} documents`);
    }
    
    // 3. Ensure productCode index exists (this should be the primary unique identifier)
    try {
      await collection.createIndex({ productCode: 1 }, { unique: true, name: 'productCode_1' });
      console.log('✅ Ensured productCode unique index exists');
    } catch (error) {
      if (error.code === 11000) {
        console.log('ℹ️  productCode index already exists');
      } else {
        console.error('❌ Error creating productCode index:', error.message);
      }
    }
    
    // 4. List final indexes for verification
    const finalIndexes = await collection.indexes();
    console.log('📋 Final indexes on products collection:');
    finalIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('✅ SKU index fix migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during SKU index fix migration:', error);
    throw error;
  }
};

const runMigration = async () => {
  try {
    await fixSkuIndexIssue();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Export for use in other scripts
module.exports = { fixSkuIndexIssue };

// Run if this file is executed directly
if (require.main === module) {
  runMigration();
}
