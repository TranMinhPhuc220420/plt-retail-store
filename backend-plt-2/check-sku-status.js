// Check current SKU index issue
// Run this to see the current state of indexes and documents

const mongoose = require('mongoose');

console.log('🔍 Checking current SKU index status...');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@plt-mongodb:27017/retail_store_plt?authSource=admin';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    // Check indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes on products:');
    indexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
    });
    
    // Check for sku field in documents
    const docsWithSku = await collection.countDocuments({ sku: { $exists: true } });
    console.log(`📊 Documents with sku field: ${docsWithSku}`);
    
    if (docsWithSku > 0) {
      const skuValues = await collection.aggregate([
        { $match: { sku: { $exists: true } } },
        { $group: { _id: "$sku", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      console.log('📈 SKU values distribution:');
      skuValues.forEach(item => {
        console.log(`   - "${item._id}": ${item.count} documents`);
      });
    }
    
    // Check total products
    const totalProducts = await collection.countDocuments();
    console.log(`📊 Total products: ${totalProducts}`);
    
    process.exit(0);
    
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
