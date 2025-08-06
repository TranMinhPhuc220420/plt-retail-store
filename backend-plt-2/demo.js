const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Store = require('./src/models/Store');
const Warehouse = require('./src/models/Warehouse');
const Ingredient = require('./src/models/Ingredient');
const Recipe = require('./src/models/Recipe');
const Product = require('./src/models/Product');
const IngredientStockBalance = require('./src/models/IngredientStockBalance');

/**
 * Demo Script for PLT Retail Store Cost Calculation Flow
 * This script demonstrates the complete flow from ingredient stock-in to composite product creation
 */

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plt-retail-store');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

async function createDemoData() {
  console.log('🏗️  Creating demo data...\n');

  // 1. Create demo user
  console.log('👤 Creating demo user...');
  const demoUser = await User.findOneAndUpdate(
    { username: 'demo_user' },
    {
      username: 'demo_user',
      email: 'demo@pltstore.com',
      password: await bcrypt.hash('demo123', 10),
      displayName: 'Demo User',
      role: 'admin'
    },
    { upsert: true, new: true }
  );
  console.log(`   ✅ User created: ${demoUser.username} (${demoUser._id})`);

  // 2. Create demo store
  console.log('\n🏪 Creating demo store...');
  const demoStore = await Store.findOneAndUpdate(
    { storeCode: 'DEMO_STORE' },
    {
      storeCode: 'DEMO_STORE',
      name: 'Demo Vietnamese Restaurant',
      description: 'Demo store for testing cost calculation flow',
      address: '123 Demo Street, Ho Chi Minh City',
      ownerId: demoUser._id
    },
    { upsert: true, new: true }
  );
  console.log(`   ✅ Store created: ${demoStore.name} (${demoStore._id})`);

  // 3. Create demo warehouse
  console.log('\n🏭 Creating demo warehouse...');
  const demoWarehouse = await Warehouse.findOneAndUpdate(
    { name: 'Main Warehouse' },
    {
      name: 'Main Warehouse',
      description: 'Main storage facility',
      address: 'Behind the restaurant',
      storeId: demoStore._id,
      ownerId: demoUser._id
    },
    { upsert: true, new: true }
  );
  console.log(`   ✅ Warehouse created: ${demoWarehouse.name} (${demoWarehouse._id})`);

  // 4. Create demo ingredients
  console.log('\n🥕 Creating demo ingredients...');
  const ingredients = [
    {
      name: 'Rice Noodles (Bún)',
      ingredientCode: 'BUN_001',
      unit: 'kg',
      standardCost: 15000, // 15,000 VND per kg
      category: 'Noodles'
    },
    {
      name: 'Fresh Shrimp',
      ingredientCode: 'SHRIMP_001',
      unit: 'kg',
      standardCost: 200000, // 200,000 VND per kg
      category: 'Seafood'
    },
    {
      name: 'Pork Belly',
      ingredientCode: 'PORK_001',
      unit: 'kg',
      standardCost: 120000, // 120,000 VND per kg
      category: 'Meat'
    },
    {
      name: 'Fish Sauce',
      ingredientCode: 'SAUCE_001',
      unit: 'liter',
      standardCost: 50000, // 50,000 VND per liter
      category: 'Condiments'
    },
    {
      name: 'Bean Sprouts',
      ingredientCode: 'BEAN_001',
      unit: 'kg',
      standardCost: 8000, // 8,000 VND per kg
      category: 'Vegetables'
    }
  ];

  const createdIngredients = {};
  for (const ing of ingredients) {
    const ingredient = await Ingredient.findOneAndUpdate(
      { ingredientCode: ing.ingredientCode },
      {
        ...ing,
        storeId: demoStore._id,
        warehouseId: demoWarehouse._id,
        ownerId: demoUser._id,
        standardCost: mongoose.Types.Decimal128.fromString(ing.standardCost.toString()),
        stockQuantity: 0,
        minStock: 5,
        maxStock: 100
      },
      { upsert: true, new: true }
    );
    createdIngredients[ing.ingredientCode] = ingredient;
    console.log(`   ✅ Ingredient: ${ingredient.name} - ${ing.standardCost.toLocaleString()} VND/${ing.unit}`);
  }

  // 5. Simulate stock-in operations
  console.log('\n📦 Simulating stock-in operations...');
  const stockInData = [
    { ingredientCode: 'BUN_001', quantity: 20, costPerUnit: 16000 }, // Slightly higher cost
    { ingredientCode: 'SHRIMP_001', quantity: 10, costPerUnit: 220000 }, // Higher fresh price
    { ingredientCode: 'PORK_001', quantity: 15, costPerUnit: 115000 }, // Slightly lower
    { ingredientCode: 'SAUCE_001', quantity: 5, costPerUnit: 55000 }, // Premium sauce
    { ingredientCode: 'BEAN_001', quantity: 8, costPerUnit: 9000 } // Fresh sprouts
  ];

  for (const stock of stockInData) {
    const ingredient = createdIngredients[stock.ingredientCode];
    
    // Create stock balance
    await IngredientStockBalance.findOneAndUpdate(
      {
        ingredientId: ingredient._id,
        storeId: demoStore._id,
        warehouseId: demoWarehouse._id,
        batchNumber: null, // Demo data without specific batch
        expirationDate: null // Demo data without expiration
      },
      {
        ingredientId: ingredient._id,
        storeId: demoStore._id,
        warehouseId: demoWarehouse._id,
        quantity: stock.quantity,
        unit: ingredient.unit,
        ownerId: demoUser._id,
        costPerUnit: mongoose.Types.Decimal128.fromString(stock.costPerUnit.toString()),
        totalCost: mongoose.Types.Decimal128.fromString((stock.quantity * stock.costPerUnit).toString()),
        lastTransactionDate: new Date(),
        batchNumber: null,
        expirationDate: null
      },
      { upsert: true }
    );

    // Update ingredient with new average cost and stock
    await Ingredient.findByIdAndUpdate(ingredient._id, {
      stockQuantity: stock.quantity,
      averageCost: mongoose.Types.Decimal128.fromString(stock.costPerUnit.toString())
    });

    console.log(`   📦 Stock-in: ${ingredient.name} - ${stock.quantity} ${ingredient.unit} @ ${stock.costPerUnit.toLocaleString()} VND/${ingredient.unit}`);
  }

  // 6. Create demo recipe
  console.log('\n🍳 Creating demo recipe...');
  const recipe = await Recipe.findOneAndUpdate(
    { dishName: 'Bún Nước Lèo' },
    {
      dishName: 'Bún Nước Lèo',
      description: 'Traditional Vietnamese noodle soup with shrimp and pork',
      ingredients: [
        {
          ingredientId: createdIngredients['BUN_001']._id,
          amountUsed: 0.1, // 100g per serving
          unit: 'kg'
        },
        {
          ingredientId: createdIngredients['SHRIMP_001']._id,
          amountUsed: 0.05, // 50g per serving
          unit: 'kg'
        },
        {
          ingredientId: createdIngredients['PORK_001']._id,
          amountUsed: 0.08, // 80g per serving
          unit: 'kg'
        },
        {
          ingredientId: createdIngredients['SAUCE_001']._id,
          amountUsed: 0.02, // 20ml per serving
          unit: 'liter'
        },
        {
          ingredientId: createdIngredients['BEAN_001']._id,
          amountUsed: 0.03, // 30g per serving
          unit: 'kg'
        }
      ],
      yield: {
        quantity: 1,
        unit: 'bowl'
      },
      ownerId: demoUser._id,
      storeId: demoStore._id
    },
    { upsert: true, new: true }
  );

  // Calculate recipe cost
  const { calculateRecipeIngredientCost } = require('./src/utils/costCalculation_FIXED');
  const recipeCost = await calculateRecipeIngredientCost(recipe._id, false);
  
  // Update recipe with calculated cost
  await Recipe.findByIdAndUpdate(recipe._id, {
    costPerUnit: mongoose.Types.Decimal128.fromString(recipeCost.costPerUnit.toString())
  });

  console.log(`   ✅ Recipe created: ${recipe.dishName}`);
  console.log(`   💰 Recipe cost per bowl: ${recipeCost.costPerUnit.toLocaleString()} VND`);
  console.log(`   📊 Cost breakdown:`);
  recipeCost.costBreakdown.forEach(item => {
    console.log(`      - ${item.ingredientName}: ${item.totalCost.toLocaleString()} VND (${item.amountUsed} ${item.unit})`);
  });

  // 7. Create demo product
  console.log('\n📦 Creating demo product...');
  const product = await Product.findOneAndUpdate(
    { productCode: 'PROD_BUN_NUOC_LEO' },
    {
      productCode: 'PROD_BUN_NUOC_LEO',
      name: 'Bún Nước Lèo Bowl',
      description: 'Single serving of Bún Nước Lèo',
      costPrice: mongoose.Types.Decimal128.fromString(recipeCost.costPerUnit.toString()),
      price: mongoose.Types.Decimal128.fromString((recipeCost.costPerUnit * 1.3).toString()), // 30% markup
      retailPrice: mongoose.Types.Decimal128.fromString((recipeCost.costPerUnit * 1.8).toString()), // 80% markup
      unit: 'bowl',
      minStock: 0,
      status: 'active',
      ownerId: demoUser._id,
      storeId: demoStore._id,
      defaultRecipeId: recipe._id,
      recipes: [recipe._id]
    },
    { upsert: true, new: true }
  );

  console.log(`   ✅ Product created: ${product.name}`);
  console.log(`   💰 Cost: ${recipeCost.costPerUnit.toLocaleString()} VND`);
  console.log(`   💰 Wholesale: ${(recipeCost.costPerUnit * 1.3).toLocaleString()} VND`);
  console.log(`   💰 Retail: ${(recipeCost.costPerUnit * 1.8).toLocaleString()} VND`);

  // 8. Create demo composite product
  console.log('\n🍲 Creating demo composite product (50-bowl batch)...');
  const totalCostPerServing = recipeCost.costPerUnit;
  const composite = await Product.findOneAndUpdate(
    { productCode: 'COMP_BUN_NUOC_LEO_50' },
    {
      productCode: 'COMP_BUN_NUOC_LEO_50',
      name: 'Bún Nước Lèo Batch (50 bowls)',
      description: 'Large batch of Bún Nước Lèo that can serve 50 bowls',
      costPrice: mongoose.Types.Decimal128.fromString((totalCostPerServing * 50).toString()),
      price: mongoose.Types.Decimal128.fromString((totalCostPerServing * 50 * 1.3).toString()),
      retailPrice: mongoose.Types.Decimal128.fromString((totalCostPerServing * 50 * 1.5).toString()),
      unit: 'batch',
      minStock: 1,
      status: 'active',
      ownerId: demoUser._id,
      storeId: demoStore._id,
      isComposite: true,
      compositeInfo: {
        capacity: {
          quantity: 50,
          unit: 'bowl'
        },
        childProducts: [{
          productId: product._id,
          quantityPerServing: 1,
          unit: 'bowl'
        }],
        currentStock: 0,
        expiryHours: 24
      }
    },
    { upsert: true, new: true }
  );

  console.log(`   ✅ Composite created: ${composite.name}`);
  console.log(`   💰 Total cost: ${(totalCostPerServing * 50).toLocaleString()} VND`);
  console.log(`   💰 Wholesale price: ${(totalCostPerServing * 50 * 1.3).toLocaleString()} VND`);
  console.log(`   💰 Retail price: ${(totalCostPerServing * 50 * 1.5).toLocaleString()} VND`);
  console.log(`   📊 Cost per bowl: ${totalCostPerServing.toLocaleString()} VND`);

  // Summary
  console.log('\n📊 === DEMO SUMMARY ===');
  console.log(`🏪 Store: ${demoStore.name}`);
  console.log(`👤 User: ${demoUser.displayName}`);
  console.log(`📦 Ingredients: ${Object.keys(createdIngredients).length}`);
  console.log(`🍳 Recipe: ${recipe.dishName} (${recipeCost.costPerUnit.toLocaleString()} VND/bowl)`);
  console.log(`📦 Product: ${product.name}`);
  console.log(`🍲 Composite: ${composite.name} (50 bowls)`);
  console.log('\n✅ Demo data created successfully!');

  return {
    user: demoUser,
    store: demoStore,
    warehouse: demoWarehouse,
    ingredients: createdIngredients,
    recipe,
    product,
    composite,
    recipeCost
  };
}

async function demonstrateFlow() {
  console.log('🚀 Starting PLT Retail Store Cost Calculation Flow Demo\n');
  console.log('=' .repeat(60));

  await connectDatabase();
  const demoData = await createDemoData();

  console.log('\n🎯 === FLOW DEMONSTRATION ===');
  console.log('This demonstrates the complete cost calculation flow:');
  console.log('1. ✅ Ingredients with costs stored in inventory');
  console.log('2. ✅ Recipe created with ingredient usage defined');
  console.log('3. ✅ Recipe cost calculated automatically');
  console.log('4. ✅ Product created with recipe-based cost');
  console.log('5. ✅ Composite product created with capacity and child products');
  console.log('6. ✅ All costs propagated through the system');

  console.log('\n🔄 Cost Flow Summary:');
  console.log(`   Ingredient Costs → Recipe Cost (${demoData.recipeCost.costPerUnit.toLocaleString()} VND/bowl)`);
  console.log(`   Recipe Cost → Product Pricing`);
  console.log(`   Product Cost → Composite Batch Pricing (${(demoData.recipeCost.costPerUnit * 50).toLocaleString()} VND/50 bowls)`);

  console.log('\n🛠️  To test the system:');
  console.log('1. Start the backend server: npm run dev');
  console.log('2. Start the frontend: npm run dev');
  console.log('3. Login with: demo_user / demo123');
  console.log('4. Navigate to the cost analysis dashboard');
  console.log('5. Test real-time updates by changing ingredient costs');

  console.log('\n📡 WebSocket endpoints available:');
  console.log('- ws://localhost:5000/ws/cost-updates');
  console.log('- Use JWT token for authentication');

  console.log('\n🎉 Demo completed successfully!');
}

// Run the demo
if (require.main === module) {
  demonstrateFlow()
    .then(() => {
      console.log('\n✅ Demo script finished. You can now start the servers.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demo script failed:', error);
      process.exit(1);
    });
}

module.exports = { demonstrateFlow, createDemoData };
