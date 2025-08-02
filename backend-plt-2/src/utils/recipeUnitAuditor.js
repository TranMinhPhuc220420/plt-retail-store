const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const { convertUnit } = require('./unitConverter');

/**
 * Kiểm tra tất cả recipes trong hệ thống để phát hiện vấn đề về đơn vị
 * @returns {Promise<Object>} Báo cáo tổng hợp
 */
const auditAllRecipeUnits = async () => {
  try {
    console.log('🔍 Bắt đầu kiểm tra tất cả recipes...');
    
    const recipes = await Recipe.find({ deleted: false })
      .populate('ingredients.ingredientId', 'name standardCost averageCost unit')
      .populate('storeId', 'name storeCode');

    const auditReport = {
      totalRecipes: recipes.length,
      problemRecipes: [],
      warningRecipes: [],
      validRecipes: [],
      summary: {
        criticalErrors: 0,
        warnings: 0,
        valid: 0,
        potentialCostErrors: []
      }
    };

    for (const recipe of recipes) {
      const recipeCheck = {
        recipeId: recipe._id,
        recipeName: recipe.dishName,
        storeCode: recipe.storeId?.storeCode || 'Unknown',
        storeName: recipe.storeId?.name || 'Unknown',
        issues: [],
        warnings: [],
        ingredientDetails: []
      };

      let hasCriticalError = false;
      let hasWarning = false;

      for (const recipeIngredient of recipe.ingredients) {
        const ingredient = recipeIngredient.ingredientId;
        
        if (!ingredient) {
          recipeCheck.issues.push({
            type: 'MISSING_INGREDIENT',
            message: 'Ingredient data not found',
            severity: 'CRITICAL'
          });
          hasCriticalError = true;
          continue;
        }

        const ingredientDetail = {
          ingredientName: ingredient.name,
          recipeAmount: recipeIngredient.amountUsed,
          recipeUnit: recipeIngredient.unit,
          ingredientUnit: ingredient.unit,
          unitCost: parseFloat((ingredient.averageCost || ingredient.standardCost || 0).toString()),
          costCalculationIssue: null
        };

        // Kiểm tra đơn vị có khác nhau không
        if (recipeIngredient.unit !== ingredient.unit) {
          // Thử chuyển đổi đơn vị
          const converted = convertUnit(
            recipeIngredient.amountUsed,
            recipeIngredient.unit,
            ingredient.unit
          );

          if (converted === null) {
            // Không thể chuyển đổi - lỗi nghiêm trọng
            recipeCheck.issues.push({
              type: 'UNIT_CONVERSION_FAILED',
              ingredientName: ingredient.name,
              fromUnit: recipeIngredient.unit,
              toUnit: ingredient.unit,
              amount: recipeIngredient.amountUsed,
              message: `Cannot convert ${recipeIngredient.unit} to ${ingredient.unit}`,
              severity: 'CRITICAL'
            });
            
            ingredientDetail.costCalculationIssue = 'CONVERSION_FAILED';
            hasCriticalError = true;
          } else {
            // Có thể chuyển đổi nhưng cần cảnh báo
            const originalCost = ingredientDetail.unitCost * recipeIngredient.amountUsed;
            const correctCost = ingredientDetail.unitCost * converted;
            const errorRatio = originalCost / correctCost;

            if (errorRatio > 10 || errorRatio < 0.1) {
              // Sai số lớn hơn 10 lần
              recipeCheck.issues.push({
                type: 'LARGE_UNIT_CONVERSION_ERROR',
                ingredientName: ingredient.name,
                fromUnit: recipeIngredient.unit,
                toUnit: ingredient.unit,
                amount: recipeIngredient.amountUsed,
                convertedAmount: converted,
                wrongCost: originalCost,
                correctCost: correctCost,
                errorRatio: errorRatio,
                message: `Cost calculation error: ${errorRatio.toFixed(2)}x difference`,
                severity: 'CRITICAL'
              });

              ingredientDetail.costCalculationIssue = 'LARGE_ERROR';
              auditReport.summary.potentialCostErrors.push({
                recipeId: recipe._id,
                recipeName: recipe.dishName,
                ingredientName: ingredient.name,
                errorRatio: errorRatio,
                wrongCost: originalCost,
                correctCost: correctCost
              });
              hasCriticalError = true;
            } else if (errorRatio > 1.5 || errorRatio < 0.67) {
              // Sai số vừa phải - cảnh báo
              recipeCheck.warnings.push({
                type: 'MODERATE_UNIT_CONVERSION_DIFFERENCE',
                ingredientName: ingredient.name,
                fromUnit: recipeIngredient.unit,
                toUnit: ingredient.unit,
                amount: recipeIngredient.amountUsed,
                convertedAmount: converted,
                wrongCost: originalCost,
                correctCost: correctCost,
                errorRatio: errorRatio,
                message: `Unit conversion needed: ${errorRatio.toFixed(2)}x cost difference`,
                severity: 'WARNING'
              });

              ingredientDetail.costCalculationIssue = 'MODERATE_ERROR';
              hasWarning = true;
            } else {
              // Chuyển đổi ok
              ingredientDetail.costCalculationIssue = 'CONVERSION_NEEDED';
              hasWarning = true;
            }
          }
        } else {
          // Cùng đơn vị - OK
          ingredientDetail.costCalculationIssue = 'OK';
        }

        recipeCheck.ingredientDetails.push(ingredientDetail);
      }

      // Phân loại recipe
      if (hasCriticalError) {
        auditReport.problemRecipes.push(recipeCheck);
        auditReport.summary.criticalErrors++;
      } else if (hasWarning) {
        auditReport.warningRecipes.push(recipeCheck);
        auditReport.summary.warnings++;
      } else {
        auditReport.validRecipes.push(recipeCheck);
        auditReport.summary.valid++;
      }
    }

    // Sắp xếp theo mức độ nghiêm trọng
    auditReport.problemRecipes.sort((a, b) => b.issues.length - a.issues.length);
    auditReport.summary.potentialCostErrors.sort((a, b) => b.errorRatio - a.errorRatio);

    console.log(`✅ Hoàn thành kiểm tra ${recipes.length} recipes`);
    console.log(`❌ Recipes có lỗi nghiêm trọng: ${auditReport.summary.criticalErrors}`);
    console.log(`⚠️  Recipes có cảnh báo: ${auditReport.summary.warnings}`);
    console.log(`✅ Recipes hợp lệ: ${auditReport.summary.valid}`);

    return auditReport;
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra recipes:', error);
    throw error;
  }
};

/**
 * Tạo báo cáo chi tiết về các vấn đề tìm thấy
 * @param {Object} auditReport - Kết quả audit
 * @returns {string} Báo cáo dạng text
 */
const generateAuditReport = (auditReport) => {
  let report = '\n=== BÁO CÁO KIỂM TRA ĐƠN VỊ TÍNH TRONG RECIPES ===\n\n';
  
  report += `📊 TỔNG QUAN:\n`;
  report += `- Tổng số recipes: ${auditReport.totalRecipes}\n`;
  report += `- Recipes có lỗi nghiêm trọng: ${auditReport.summary.criticalErrors}\n`;
  report += `- Recipes có cảnh báo: ${auditReport.summary.warnings}\n`;
  report += `- Recipes hợp lệ: ${auditReport.summary.valid}\n\n`;

  if (auditReport.summary.potentialCostErrors.length > 0) {
    report += `🚨 TOP CÁC LỖI TÍNH GIÁ NGHIÊM TRỌNG NHẤT:\n`;
    auditReport.summary.potentialCostErrors.slice(0, 10).forEach((error, index) => {
      report += `${index + 1}. Recipe: "${error.recipeName}"\n`;
      report += `   Ingredient: ${error.ingredientName}\n`;
      report += `   Sai số: ${error.errorRatio.toFixed(2)} lần\n`;
      report += `   Giá sai: ${error.wrongCost.toLocaleString()} VND\n`;
      report += `   Giá đúng: ${error.correctCost.toLocaleString()} VND\n\n`;
    });
  }

  if (auditReport.problemRecipes.length > 0) {
    report += `❌ RECIPES CÓ LỖI NGHIÊM TRỌNG:\n`;
    auditReport.problemRecipes.forEach((recipe, index) => {
      report += `${index + 1}. ${recipe.recipeName} (Store: ${recipe.storeCode})\n`;
      recipe.issues.forEach(issue => {
        report += `   - ${issue.type}: ${issue.message}\n`;
        if (issue.ingredientName) {
          report += `     Ingredient: ${issue.ingredientName}\n`;
        }
        if (issue.errorRatio) {
          report += `     Sai số: ${issue.errorRatio.toFixed(2)} lần\n`;
        }
      });
      report += '\n';
    });
  }

  if (auditReport.warningRecipes.length > 0) {
    report += `⚠️  RECIPES CÓ CẢNH BÁO (Chỉ hiển thị 5 đầu):\n`;
    auditReport.warningRecipes.slice(0, 5).forEach((recipe, index) => {
      report += `${index + 1}. ${recipe.recipeName} (Store: ${recipe.storeCode})\n`;
      recipe.warnings.forEach(warning => {
        report += `   - ${warning.type}: ${warning.message}\n`;
      });
      report += '\n';
    });
  }

  report += `\n=== KẾT THÚC BÁO CÁO ===`;
  
  return report;
};

/**
 * Chạy audit và tạo file báo cáo
 */
const runFullAudit = async () => {
  try {
    const auditReport = await auditAllRecipeUnits();
    const reportText = generateAuditReport(auditReport);
    
    console.log(reportText);
    
    // Có thể ghi vào file nếu cần
    // const fs = require('fs');
    // fs.writeFileSync('recipe_unit_audit_report.txt', reportText);
    
    return auditReport;
  } catch (error) {
    console.error('Lỗi khi chạy audit:', error);
    throw error;
  }
};

module.exports = {
  auditAllRecipeUnits,
  generateAuditReport,
  runFullAudit
};
