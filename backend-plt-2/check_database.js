const mongoose = require('mongoose');
const Recipe = require('./src/models/Recipe');
const Ingredient = require('./src/models/Ingredient');
const Product = require('./src/models/Product');

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

const checkData = async () => {
  try {
    await connectDB();
    
    console.log('\n📊 KIỂM TRA DỮ LIỆU TRONG DATABASE...\n');
    
    // Check Ingredients
    const ingredientCount = await Ingredient.countDocuments();
    console.log(`📦 Ingredients: ${ingredientCount}`);
    
    if (ingredientCount > 0) {
      const sampleIngredients = await Ingredient.find().limit(3).select('name unit standardCost averageCost');
      sampleIngredients.forEach((ing, i) => {
        console.log(`   ${i+1}. ${ing.name} (${ing.unit}) - StandardCost: ${ing.standardCost || 'N/A'}, AvgCost: ${ing.averageCost || 'N/A'}`);
      });
    }
    
    // Check Recipes  
    const recipeCount = await Recipe.countDocuments();
    console.log(`\n🍽️  Recipes: ${recipeCount}`);
    
    if (recipeCount > 0) {
      const sampleRecipes = await Recipe.find().limit(3)
        .populate('ingredients.ingredientId', 'name unit standardCost')
        .select('dishName ingredients costPerUnit');
        
      sampleRecipes.forEach((recipe, i) => {
        console.log(`   ${i+1}. ${recipe.dishName} - CostPerUnit: ${recipe.costPerUnit || 'N/A'}`);
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          recipe.ingredients.slice(0, 2).forEach((ing, j) => {
            if (ing.ingredientId) {
              console.log(`      - ${ing.ingredientId.name}: ${ing.amountUsed} ${ing.unit} (Ingredient unit: ${ing.ingredientId.unit})`);
            }
          });
        }
      });
    }
    
    // Check Products
    const productCount = await Product.countDocuments();
    console.log(`\n🏷️  Products: ${productCount}`);
    
    if (productCount > 0) {
      const sampleProducts = await Product.find().limit(3).select('name costPrice retailPrice unit');
      sampleProducts.forEach((prod, i) => {
        console.log(`   ${i+1}. ${prod.name} - Cost: ${prod.costPrice || 'N/A'}, Retail: ${prod.retailPrice || 'N/A'}`);
      });
    }
    
    // Summary
    console.log('\n📋 TỔNG KẾT:');
    console.log(`- ${ingredientCount} ingredients trong database`);
    console.log(`- ${recipeCount} recipes trong database`);  
    console.log(`- ${productCount} products trong database`);
    
    if (recipeCount === 0) {
      console.log('\n⚠️  CẢNH BÁO: Không có recipe nào trong database!');
      console.log('Điều này có thể do:');
      console.log('1. Database rỗng hoặc chưa có dữ liệu');
      console.log('2. Kết nối database sai');
      console.log('3. Collection name không đúng');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối database');
  }
};

checkData();
