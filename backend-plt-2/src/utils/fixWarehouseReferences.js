// const mongoose = require('mongoose');
// const StockBalance = require('../models/StockBalance');
// const Warehouse = require('../models/Warehouse');
// require('dotenv').config();

// /**
//  * Migration script to fix StockBalance records without warehouse references
//  * This will either assign a default warehouse or remove invalid records
//  */
// async function fixStockBalanceWarehouseReferences() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/retail_store_plt_solutions');
//     console.log('Connected to MongoDB');

//     // Find stock balance records without warehouseId
//     const recordsWithoutWarehouse = await StockBalance.find({
//       $or: [
//         { warehouseId: { $exists: false } },
//         { warehouseId: null }
//       ]
//     }).populate('storeId', 'name storeCode');

//     console.log(`Found ${recordsWithoutWarehouse.length} stock balance records without warehouse references`);

//     if (recordsWithoutWarehouse.length === 0) {
//       console.log('All stock balance records have warehouse references. No migration needed.');
//       return;
//     }

//     // Process each record
//     for (const record of recordsWithoutWarehouse) {
//       console.log(`Processing record ${record._id} for store ${record.storeId?.storeCode || 'Unknown'}`);
      
//       // Find the first available warehouse for this store
//       const warehouse = await Warehouse.findOne({
//         storeId: record.storeId,
//         deleted: false
//       });

//       if (warehouse) {
//         // Update the record with the warehouse reference
//         record.warehouseId = warehouse._id;
//         await record.save();
//         console.log(`  - Assigned warehouse ${warehouse.name} to record ${record._id}`);
//       } else {
//         // No warehouse available for this store - remove the record
//         console.log(`  - No warehouse found for store ${record.storeId?.storeCode || 'Unknown'}, removing record ${record._id}`);
//         await StockBalance.deleteOne({ _id: record._id });
//       }
//     }

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
//   fixStockBalanceWarehouseReferences();
// }

// module.exports = { fixStockBalanceWarehouseReferences };
