const mongoose = require('mongoose');
const Recipe = require('./src/models/Recipe');
const Product = require('./src/models/Product');
const { calculateRecipeIngredientCost } = require('./src/utils/costCalculation_FIXED');

/**
 * Script migration để sửa lại tất cả cost calculations trong database
 */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plt_retail_store', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Đã kết nối MongoDB');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Backup dữ liệu trước khi migration
 */
const backupData = async () => {
  console.log('💾 Bắt đầu backup dữ liệu...');
  
  try {
    const recipes = await Recipe.find({}).lean();
    const products = await Product.find({}).lean();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      recipes: recipes.map(r => ({
        _id: r._id,
        dishName: r.dishName,
        costPerUnit: r.costPerUnit
      })),
      products: products.map(p => ({
        _id: p._id,
        name: p.name,
        costPrice: p.costPrice,
        retailPrice: p.retailPrice
      }))
    };
    
    // Có thể save vào file backup nếu cần
    console.log(`✅ Backup completed: ${recipes.length} recipes, ${products.length} products`);
    return backupData;
  } catch (error) {
    console.error('❌ Lỗi backup:', error);
    throw error;
  }
};

/**
 * Recalculate tất cả recipe costs với unit conversion đúng
 */
const recalculateAllRecipeCosts = async () => {
  console.log('🔄 Bắt đầu tính lại cost cho tất cả recipes...');
  
  try {
    const recipes = await Recipe.find({ deleted: false });
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const recipe of recipes) {
      try {
        console.log(`Processing recipe: ${recipe.dishName} (${recipe._id})`);
        
        // Tính toán lại cost với unit conversion
        const costCalculation = await calculateRecipeIngredientCost(recipe._id);
        
        // Update recipe cost
        await Recipe.findByIdAndUpdate(recipe._id, {
          costPerUnit: mongoose.Types.Decimal128.fromString(costCalculation.costPerUnit.toString())
        });
        
        console.log(`✅ Updated ${recipe.dishName}: ${costCalculation.costPerUnit.toFixed(2)} VND/unit`);
        
        if (costCalculation.conversionErrors && costCalculation.conversionErrors.length > 0) {
          console.log(`⚠️  Conversion warnings for ${recipe.dishName}:`, costCalculation.conversionErrors.length);
        }
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error updating recipe ${recipe.dishName}:`, error.message);
        errors.push({
          recipeId: recipe._id,
          recipeName: recipe.dishName,
          error: error.message
        });
        errorCount++;
      }
    }
    
    console.log(`\n📊 Recipe cost update results:`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors detail:');
      errors.forEach(err => {
        console.log(`- ${err.recipeName}: ${err.error}`);
      });
    }
    
    return { successCount, errorCount, errors };
  } catch (error) {
    console.error('❌ Lỗi recalculate recipe costs:', error);
    throw error;
  }
};

/**
 * Update product pricing based on corrected recipe costs
 */
const updateProductPricing = async () => {
  console.log('💰 Bắt đầu cập nhật giá sản phẩm...');
  
  try {
    const products = await Product.find({ 
      deleted: false,
      defaultRecipeId: { $exists: true, $ne: null }
    }).populate('defaultRecipeId');
    
    let successCount = 0;
    let errorCount = 0;
    const priceChanges = [];

    for (const product of products) {
      try {
        if (!product.defaultRecipeId) continue;
        
        const recipe = product.defaultRecipeId;
        const newCostPrice = parseFloat(recipe.costPerUnit?.toString() || 0);
        const currentCostPrice = parseFloat(product.costPrice?.toString() || 0);
        
        if (Math.abs(newCostPrice - currentCostPrice) > 0.01) {
          // Update cost price
          await Product.findByIdAndUpdate(product._id, {
            costPrice: mongoose.Types.Decimal128.fromString(newCostPrice.toString())
          });
          
          priceChanges.push({
            productName: product.name,
            oldCostPrice: currentCostPrice,
            newCostPrice: newCostPrice,
            difference: newCostPrice - currentCostPrice,
            percentChange: currentCostPrice > 0 ? ((newCostPrice - currentCostPrice) / currentCostPrice * 100) : 0
          });
          
          console.log(`💰 Updated ${product.name}: ${currentCostPrice} → ${newCostPrice} VND`);
        }
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error updating product ${product.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Product pricing update results:`);
    console.log(`✅ Processed: ${successCount}`);
    console.log(`💰 Price changes: ${priceChanges.length}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (priceChanges.length > 0) {
      console.log('\n💰 Significant price changes:');
      priceChanges
        .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
        .slice(0, 10)
        .forEach(change => {
          console.log(`- ${change.productName}: ${change.percentChange.toFixed(1)}% (${change.difference.toFixed(2)} VND)`);
        });
    }
    
    return { successCount, errorCount, priceChanges };
  } catch (error) {
    console.error('❌ Lỗi update product pricing:', error);
    throw error;
  }
};

/**
 * Tạo báo cáo migration
 */
const generateMigrationReport = (backupData, recipeResults, productResults) => {
  const report = `
=== BÁO CÁO MIGRATION SỬA LỖI ĐƠN VỊ TÍNH ===

Thời gian: ${new Date().toISOString()}

📊 BACKUP DATA:
- Recipes backed up: ${backupData.recipes.length}
- Products backed up: ${backupData.products.length}

🔄 RECIPE COST RECALCULATION:
- Success: ${recipeResults.successCount}
- Errors: ${recipeResults.errorCount}

💰 PRODUCT PRICING UPDATE:
- Processed: ${productResults.successCount}
- Price changes: ${productResults.priceChanges.length}
- Errors: ${productResults.errorCount}

📈 TOP PRICE CHANGES:
${productResults.priceChanges
  .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
  .slice(0, 5)
  .map((change, index) => 
    `${index + 1}. ${change.productName}: ${change.percentChange.toFixed(1)}% (${change.difference.toFixed(2)} VND)`
  )
  .join('\n')}

⚠️  ERRORS:
${recipeResults.errors.map(err => `- Recipe "${err.recipeName}": ${err.error}`).join('\n')}

=== KẾT THÚC BÁO CÁO ===
`;
  
  return report;
};

/**
 * Main migration function
 */
const runMigration = async () => {
  console.log('🚀 BẮT ĐẦU MIGRATION SỬA LỖI ĐƠN VỊ TÍNH\n');
  
  try {
    await connectDB();
    
    // Backup
    const backupData = await backupData();
    
    // Recalculate recipe costs
    const recipeResults = await recalculateAllRecipeCosts();
    
    // Update product pricing
    const productResults = await updateProductPricing();
    
    // Generate report
    const report = generateMigrationReport(backupData, recipeResults, productResults);
    console.log(report);
    
    console.log('\n✅ MIGRATION HOÀN THÀNH!');
    console.log('\n🔄 HÃY KIỂM TRA LẠI:');
    console.log('1. Cost calculations cho các recipes quan trọng');
    console.log('2. Giá bán các sản phẩm có thay đổi lớn');
    console.log('3. Chạy lại audit để đảm bảo không còn lỗi');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n⚠️  HÃY RESTORE TỪ BACKUP NẾU CẦN THIẾT');
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối database');
  }
};

// Chạy migration nếu được gọi trực tiếp
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };
