// const mongoose = require('mongoose');
// require('dotenv').config();

// /**
//  * Simple script to check StockBalance records for warehouse references
//  */
// async function checkStockBalanceData() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/retail_store_plt_solutions');
//     console.log('Connected to MongoDB');

//     const db = mongoose.connection.db;
//     const stockBalances = db.collection('stockbalances');

//     // Count total records
//     const totalCount = await stockBalances.countDocuments();
//     console.log(`Total stock balance records: ${totalCount}`);

//     // Count records without warehouseId
//     const withoutWarehouseCount = await stockBalances.countDocuments({
//       $or: [
//         { warehouseId: { $exists: false } },
//         { warehouseId: null }
//       ]
//     });
//     console.log(`Records without warehouse reference: ${withoutWarehouseCount}`);

//     // Sample a few records to see their structure
//     const sampleRecords = await stockBalances.find({}).limit(3).toArray();
//     console.log('Sample records structure:');
//     sampleRecords.forEach((record, index) => {
//       console.log(`Record ${index + 1}:`, {
//         _id: record._id,
//         productId: record.productId ? 'exists' : 'missing',
//         storeId: record.storeId ? 'exists' : 'missing',
//         warehouseId: record.warehouseId ? 'exists' : 'missing',
//         quantity: record.quantity
//       });
//     });

//   } catch (error) {
//     console.error('Check failed:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('Disconnected from MongoDB');
//   }
// }

// checkStockBalanceData();
