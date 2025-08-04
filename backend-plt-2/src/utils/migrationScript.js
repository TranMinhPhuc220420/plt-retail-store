// const mongoose = require('mongoose');
// require('dotenv').config();

// /**
//  * Migration script to update StockBalance indexes
//  * Removes old productId_storeId index and ensures new compound index exists
//  */
// async function migrateStockBalanceIndexes() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/retail_store_plt_solutions');
//     console.log('Connected to MongoDB');

//     const db = mongoose.connection.db;
//     const collection = db.collection('stockbalances');

//     // Get existing indexes
//     const indexes = await collection.indexes();
//     console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

//     // Check for old index and drop it
//     const oldIndexExists = indexes.some(idx => 
//       idx.name === 'productId_1_storeId_1' || 
//       (idx.key.productId === 1 && idx.key.storeId === 1 && !idx.key.warehouseId)
//     );

//     if (oldIndexExists) {
//       console.log('Dropping old productId_storeId index...');
//       try {
//         await collection.dropIndex('productId_1_storeId_1');
//         console.log('Successfully dropped old index');
//       } catch (error) {
//         console.log('Old index may not exist or already dropped:', error.message);
//       }
//     }

//     // Ensure the new compound index exists
//     console.log('Creating new compound index: productId_storeId_warehouseId...');
//     await collection.createIndex(
//       { productId: 1, storeId: 1, warehouseId: 1 }, 
//       { unique: true, name: 'productId_1_storeId_1_warehouseId_1' }
//     );

//     // Verify the index was created
//     const updatedIndexes = await collection.indexes();
//     console.log('Updated indexes:', updatedIndexes.map(idx => ({ name: idx.name, key: idx.key })));

//     console.log('Migration completed successfully!');
    
//   } catch (error) {
//     console.error('Migration failed:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('Disconnected from MongoDB');
//   }
// }

// // Run migration if called directly
// if (require.main === module) {
//   migrateStockBalanceIndexes();
// }

// module.exports = { migrateStockBalanceIndexes };
