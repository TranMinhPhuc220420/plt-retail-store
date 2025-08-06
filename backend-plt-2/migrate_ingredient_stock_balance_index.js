const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const IngredientStockBalance = require('./src/models/IngredientStockBalance');

async function migrateIngredientStockBalanceIndex() {
  try {
    console.log('🔄 Starting ingredient stock balance index migration...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/retail_store_plt_solutions';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const collection = mongoose.connection.db.collection('ingredientstockbalances');
    
    // Get current indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Check if old unique index exists and drop it
    const oldIndexName = 'ingredientId_1_storeId_1_warehouseId_1';
    const oldIndexExists = indexes.some(idx => idx.name === oldIndexName);
    
    if (oldIndexExists) {
      console.log('🗑️  Dropping old unique index...');
      await collection.dropIndex(oldIndexName);
      console.log('✅ Old unique index dropped');
    }
    
    // Get duplicate records that would violate the new unique constraint
    console.log('🔍 Checking for duplicate records...');
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: {
            ingredientId: '$ingredientId',
            storeId: '$storeId',
            warehouseId: '$warehouseId',
            batchNumber: '$batchNumber',
            expirationDate: '$expirationDate'
          },
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]).toArray();
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} groups of duplicate records`);
      
      // Handle duplicates by merging quantities and keeping the most recent record
      for (const duplicate of duplicates) {
        console.log(`🔄 Processing duplicate group:`, duplicate._id);
        
        // Get all documents in this duplicate group
        const docs = await collection.find({
          _id: { $in: duplicate.docs }
        }).sort({ createdAt: -1 }).toArray();
        
        // Calculate total quantity from all duplicates
        const totalQuantity = docs.reduce((sum, doc) => sum + (doc.quantity || 0), 0);
        
        // Keep the most recent document (first in sorted array)
        const keepDoc = docs[0];
        const removeIds = docs.slice(1).map(doc => doc._id);
        
        // Update the kept document with merged quantity
        await collection.updateOne(
          { _id: keepDoc._id },
          {
            $set: {
              quantity: totalQuantity,
              lastTransactionDate: new Date(),
              updatedAt: new Date()
            }
          }
        );
        
        // Remove the duplicate documents
        if (removeIds.length > 0) {
          await collection.deleteMany({ _id: { $in: removeIds } });
          console.log(`   ✅ Merged ${docs.length} duplicates, total quantity: ${totalQuantity}`);
        }
      }
    } else {
      console.log('✅ No duplicate records found');
    }
    
    // Create the new unique index
    console.log('🔄 Creating new unique index...');
    await collection.createIndex(
      { 
        ingredientId: 1, 
        storeId: 1, 
        warehouseId: 1, 
        batchNumber: 1, 
        expirationDate: 1 
      }, 
      { 
        unique: true,
        name: 'ingredientId_1_storeId_1_warehouseId_1_batchNumber_1_expirationDate_1'
      }
    );
    console.log('✅ New unique index created');
    
    // Verify the new index
    const newIndexes = await collection.indexes();
    console.log('📋 Updated indexes:', newIndexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateIngredientStockBalanceIndex()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateIngredientStockBalanceIndex;
