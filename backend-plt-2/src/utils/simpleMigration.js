const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Simple migration to fix StockBalance records without warehouse references
 */
async function fixMissingWarehouses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/retail_store_plt_solutions');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const stockBalances = db.collection('stockbalances');
    const warehouses = db.collection('warehouses');

    // Find records without warehouse
    const recordsToFix = await stockBalances.find({
      $or: [
        { warehouseId: { $exists: false } },
        { warehouseId: null }
      ]
    }).toArray();

    console.log(`Found ${recordsToFix.length} records to fix`);

    for (const record of recordsToFix) {
      console.log(`Fixing record ${record._id}`);
      
      // Find the first warehouse for this store
      const warehouse = await warehouses.findOne({
        storeId: record.storeId,
        deleted: { $ne: true }
      });

      if (warehouse) {
        // Update the record with warehouse reference
        await stockBalances.updateOne(
          { _id: record._id },
          { $set: { warehouseId: warehouse._id } }
        );
        console.log(`  - Assigned warehouse ${warehouse.name} to record`);
      } else {
        // Remove the record if no warehouse is available
        await stockBalances.deleteOne({ _id: record._id });
        console.log(`  - Removed record (no warehouse available for store)`);
      }
    }

    // Verify the fix
    const remainingCount = await stockBalances.countDocuments({
      $or: [
        { warehouseId: { $exists: false } },
        { warehouseId: null }
      ]
    });

    console.log(`Records still without warehouse after fix: ${remainingCount}`);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixMissingWarehouses();
