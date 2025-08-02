const mongoose = require('mongoose');
const { runFullAudit } = require('./src/utils/recipeUnitAuditor');
const { validateRecipeCostCalculation } = require('./src/utils/costCalculation_FIXED');

// Kết nối database
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
 * Script chính để kiểm tra các vấn đề về đơn vị tính
 */
const main = async () => {
  console.log('🚀 Bắt đầu kiểm tra các vấn đề về đơn vị tính trong hệ thống...\n');
  
  try {
    // Kết nối database
    await connectDB();
    
    console.log('📋 BƯỚC 1: Chạy audit tổng thể tất cả recipes...');
    const auditReport = await runFullAudit();
    
    console.log('\n📋 BƯỚC 2: Phân tích chi tiết các vấn đề...');
    
    if (auditReport.summary.criticalErrors > 0) {
      console.log(`\n🚨 PHÁT HIỆN ${auditReport.summary.criticalErrors} RECIPES CÓ LỖI NGHIÊM TRỌNG!`);
      console.log('Các recipes này có thể gây ra sai số tính giá lên đến hàng nghìn lần:');
      
      auditReport.problemRecipes.slice(0, 5).forEach((recipe, index) => {
        console.log(`\n${index + 1}. Recipe: "${recipe.recipeName}" (${recipe.storeCode})`);
        recipe.issues.forEach(issue => {
          if (issue.type === 'LARGE_UNIT_CONVERSION_ERROR') {
            console.log(`   ❌ ${issue.ingredientName}: Sai số ${issue.errorRatio.toFixed(2)} lần`);
            console.log(`      Giá sai: ${issue.wrongCost.toLocaleString()} VND`);
            console.log(`      Giá đúng: ${issue.correctCost.toLocaleString()} VND`);
          }
        });
      });
    }
    
    if (auditReport.summary.warnings > 0) {
      console.log(`\n⚠️  PHÁT HIỆN ${auditReport.summary.warnings} RECIPES CÓ CẢNH BÁO`);
      console.log('Các recipes này cần chuyển đổi đơn vị để tính giá chính xác.');
    }
    
    console.log(`\n✅ ${auditReport.summary.valid} recipes không có vấn đề về đơn vị.`);
    
    console.log('\n📋 BƯỚC 3: Đề xuất hành động...');
    
    if (auditReport.summary.criticalErrors > 0) {
      console.log('\n🔧 HÀNH ĐỘNG CẦN THỰC HIỆN NGAY:');
      console.log('1. Backup database trước khi sửa');
      console.log('2. Thay thế file costCalculation.js bằng costCalculation_FIXED.js');
      console.log('3. Restart server backend');
      console.log('4. Chạy lại cost calculation cho tất cả recipes');
      console.log('5. Kiểm tra và cập nhật giá bán sản phẩm');
    }
    
    if (auditReport.summary.warnings > 0) {
      console.log('\n⚡ HÀNH ĐỘNG ĐỀ XUẤT:');
      console.log('1. Review các recipes có cảnh báo');
      console.log('2. Cân nhắc chuẩn hóa đơn vị trong recipes');
      console.log('3. Training team về việc sử dụng đơn vị phù hợp');
    }
    
    console.log('\n📋 BƯỚC 4: Test một recipe cụ thể...');
    
    if (auditReport.problemRecipes.length > 0) {
      const testRecipeId = auditReport.problemRecipes[0].recipeId;
      console.log(`\nTest validation cho recipe: ${auditReport.problemRecipes[0].recipeName}`);
      
      try {
        const validation = await validateRecipeCostCalculation(testRecipeId);
        console.log(`Validation result: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}`);
        if (validation.errors.length > 0) {
          console.log('Errors:', validation.errors);
        }
        if (validation.warnings.length > 0) {
          console.log('Warnings:', validation.warnings);
        }
      } catch (error) {
        console.log('❌ Lỗi khi test validation:', error.message);
      }
    }
    
    console.log('\n✅ HOÀN THÀNH KIỂM TRA!');
    console.log('\n📝 Xem file unit_price_analysis.md để biết chi tiết về vấn đề và cách sửa.');
    
  } catch (error) {
    console.error('❌ Lỗi khi chạy script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối database');
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
