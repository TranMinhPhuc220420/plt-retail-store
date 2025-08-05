/**
 * Migration script to add quantityPerServing and unit fields to existing child products
 * Run this script to update existing composite products with the new fields
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import Product model
const Product = require('./src/models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plt-retail-store';

async function migrateChildProducts() {
  try {
    console.log('🔄 Starting migration: Add quantityPerServing and unit to child products...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all composite products
    const compositeProducts = await Product.find({ 
      isComposite: true,
      deleted: false,
      'compositeInfo.childProducts': { $exists: true, $ne: [] }
    });

    console.log(`📊 Found ${compositeProducts.length} composite products to migrate`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const product of compositeProducts) {
      try {
        let hasUpdates = false;
        
        // Check and update each child product
        const updatedChildProducts = product.compositeInfo.childProducts.map(child => {
          const updates = { ...child.toObject() };
          
          // Add quantityPerServing if missing
          if (updates.quantityPerServing === undefined || updates.quantityPerServing === null) {
            updates.quantityPerServing = 1; // Default value
            hasUpdates = true;
            console.log(`   ➕ Adding quantityPerServing=1 for child in ${product.name}`);
          }
          
          // Add unit if missing
          if (!updates.unit || updates.unit.trim() === '') {
            updates.unit = 'piece'; // Default value
            hasUpdates = true;
            console.log(`   ➕ Adding unit=piece for child in ${product.name}`);
          }
          
          return updates;
        });

        // Update the product if there were changes
        if (hasUpdates) {
          await Product.findByIdAndUpdate(product._id, {
            'compositeInfo.childProducts': updatedChildProducts
          });
          
          updatedCount++;
          console.log(`✅ Updated ${product.name} (${product.productCode})`);
        } else {
          console.log(`⚪ No updates needed for ${product.name}`);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating ${product.name}:`, error.message);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Total products found: ${compositeProducts.length}`);
    console.log(`   Products updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with some errors');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if script is called directly
if (require.main === module) {
  migrateChildProducts()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateChildProducts;
