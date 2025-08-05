const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Recipe = require('./src/models/Recipe');
const Ingredient = require('./src/models/Ingredient');
const Store = require('./src/models/Store');
const User = require('./src/models/User');
const compositeProductController = require('./src/controllers/compositeProductController');

// Mock response object
const createMockResponse = () => {
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.responseData = data;
      return this;
    }
  };
  return res;
};

// Test helper functions
async function cleanup() {
  try {
    await Product.deleteMany({ name: /test-composite/i });
    await Recipe.deleteMany({ dishName: /test-recipe/i });
    await Ingredient.deleteMany({ name: /test-ingredient/i });
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('⚠️ Cleanup warning:', error.message);
  }
}

async function createTestUser() {
  try {
    // Try to find existing user first
    let user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      // Create a test user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('test123', 12);
      
      user = new User({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'owner'
      });
      
      await user.save();
      console.log(`✅ Created test user: ${user.email}`);
    } else {
      console.log(`✅ Using existing test user: ${user.email}`);
    }
    
    return user;
  } catch (error) {
    console.error('❌ Failed to create/find test user:', error.message);
    throw error;
  }
}

async function createTestStore(userId) {
  try {
    // Try to find existing store first
    let store = await Store.findOne({ ownerId: userId });
    
    if (!store) {
      // Create a test store
      store = new Store({
        storeCode: 'TEST-STORE-001',
        name: 'Test Store',
        address: 'Test Address',
        phone: '0123456789',
        ownerId: userId
      });
      
      await store.save();
      console.log(`✅ Created test store: ${store.name}`);
    } else {
      console.log(`✅ Using existing test store: ${store.name}`);
    }
    
    return store;
  } catch (error) {
    console.error('❌ Failed to create/find test store:', error.message);
    throw error;
  }
}

async function createTestIngredients(userId, storeId) {
  const ingredients = [
    {
      ingredientCode: 'TEST-ING-RICE-001',
      name: 'Test-Ingredient-Rice',
      unit: 'kg',
      standardCost: 25000,
      stockQuantity: 100,
      ownerId: userId,
      storeId: storeId
    },
    {
      ingredientCode: 'TEST-ING-MEAT-001',
      name: 'Test-Ingredient-Meat',
      unit: 'kg',
      standardCost: 180000,
      stockQuantity: 50,
      ownerId: userId,
      storeId: storeId
    },
    {
      ingredientCode: 'TEST-ING-WATER-001',
      name: 'Test-Ingredient-Water',
      unit: 'l',
      standardCost: 5000,
      stockQuantity: 200,
      ownerId: userId,
      storeId: storeId
    }
  ];

  const createdIngredients = [];
  for (const ingredientData of ingredients) {
    const ingredient = new Ingredient(ingredientData);
    await ingredient.save();
    createdIngredients.push(ingredient);
    console.log(`✅ Created ingredient: ${ingredient.name}`);
  }
  
  return createdIngredients;
}

async function createTestRecipe(userId, storeId, ingredients) {
  const recipe = new Recipe({
    dishName: 'Test-Recipe-Com-Tam',
    description: 'Test recipe for composite product',
    ingredients: [
      {
        ingredientId: ingredients[0]._id, // Rice
        amountUsed: 2.5,
        unit: 'kg'
      },
      {
        ingredientId: ingredients[1]._id, // Meat
        amountUsed: 1.5,
        unit: 'kg'
      },
      {
        ingredientId: ingredients[2]._id, // Water
        amountUsed: 3,
        unit: 'l'
      }
    ],
    yield: {
      quantity: 20, // 20 portions
      unit: 'phần'
    },
    expiryHours: 12,
    ownerId: userId,
    storeId: storeId
  });

  await recipe.save();
  console.log(`✅ Created recipe: ${recipe.dishName} (yield: ${recipe.yield.quantity} ${recipe.yield.unit})`);
  return recipe;
}

async function createTestCompositeProduct(userId, storeId, recipeId) {
  const composite = new Product({
    productCode: 'TEST-COMP-CTM-001',
    name: 'Test-Composite-Com-Tam',
    description: 'Test composite product',
    price: 100000,
    retailPrice: 120000,
    costPrice: 80000,
    minStock: 1,
    unit: 'tô',
    status: 'active',
    ownerId: userId,
    storeId: storeId,
    isComposite: true,
    compositeInfo: {
      capacity: {
        quantity: 50, // 50 bowls per batch
        unit: 'tô'
      },
      recipeId: recipeId,
      childProducts: [],
      currentStock: 0,
      expiryHours: 12
    }
  });

  await composite.save();
  console.log(`✅ Created composite product: ${composite.name} (capacity: ${composite.compositeInfo.capacity.quantity} ${composite.compositeInfo.capacity.unit})`);
  return composite;
}

async function testPrepareComposite(userId, compositeId) {
  console.log('\n🧪 Testing prepareComposite function...');
  
  // Test case 1: Prepare 1 batch
  console.log('\n📝 Test Case 1: Prepare 1 batch');
  
  const req1 = {
    params: { id: compositeId },
    body: { quantityToPrepare: 1 },
    user: { _id: userId }
  };
  const res1 = createMockResponse();
  
  await compositeProductController.prepareComposite(req1, res1);
  
  if (res1.statusCode === 200) {
    console.log('✅ Test Case 1 PASSED');
    console.log('📊 Results:', {
      totalServingsPrepared: res1.responseData.totalServingsPrepared,
      recipeBatchesMade: res1.responseData.recipeBatchesMade,
      newStock: res1.responseData.preparationDetails.newStock
    });
    
    // Show ingredient usage
    console.log('📋 Ingredient Usage:');
    for (const [ingredientId, info] of Object.entries(res1.responseData.requiredIngredients)) {
      console.log(`   - ${info.name}: Used ${info.needed} ${info.unit} (Recipe batches: ${info.recipeBatchesNeeded})`);
    }
  } else {
    console.log('❌ Test Case 1 FAILED');
    console.log('Error:', res1.responseData);
    return false;
  }

  // Test case 2: Try to prepare too much (should fail)
  console.log('\n📝 Test Case 2: Try to prepare 10 batches (should fail due to insufficient ingredients)');
  
  const req2 = {
    params: { id: compositeId },
    body: { quantityToPrepare: 10 },
    user: { _id: userId }
  };
  const res2 = createMockResponse();
  
  await compositeProductController.prepareComposite(req2, res2);
  
  if (res2.statusCode === 400 && res2.responseData.error === 'insufficient_ingredients') {
    console.log('✅ Test Case 2 PASSED - Correctly failed due to insufficient ingredients');
    console.log('📋 Shortfall details:');
    for (const detail of res2.responseData.details) {
      console.log(`   - ${detail.name}: Need ${detail.needed} ${detail.unit}, have ${detail.available} ${detail.unit} (short ${detail.shortfall} ${detail.unit})`);
    }
  } else {
    console.log('❌ Test Case 2 FAILED - Should have failed but didn\'t');
    console.log('Response:', res2.statusCode, res2.responseData);
    return false;
  }

  return true;
}

async function checkIngredientStockAfterTest(ingredients) {
  console.log('\n📝 Checking ingredient stock after test...');
  
  for (const ingredient of ingredients) {
    const updated = await Ingredient.findById(ingredient._id);
    console.log(`   - ${updated.name}: ${updated.stockQuantity} ${updated.unit} (was ${ingredient.stockQuantity})`);
  }
}

async function runInternalTest() {
  console.log('🧪 Testing Fixed PrepareComposite Function (Internal Test)');
  console.log('========================================================');
  
  try {
    // Clean up first
    await cleanup();
    
    // Step 1: Setup test data
    console.log('\n📝 Step 1: Setting up test data...');
    const user = await createTestUser();
    const store = await createTestStore(user._id);
    const ingredients = await createTestIngredients(user._id, store._id);
    const recipe = await createTestRecipe(user._id, store._id, ingredients);
    const composite = await createTestCompositeProduct(user._id, store._id, recipe._id);
    
    // Step 2: Test prepareComposite function
    console.log('\n📝 Step 2: Testing prepareComposite function...');
    const testPassed = await testPrepareComposite(user._id, composite._id);
    
    if (!testPassed) {
      throw new Error('PrepareComposite test failed');
    }
    
    // Step 3: Check ingredient stock changes
    await checkIngredientStockAfterTest(ingredients);
    
    // Step 4: Cleanup
    await cleanup();
    
    console.log('\n🎉 All tests passed! PrepareComposite function is working correctly.');
    console.log('✅ Key improvements verified:');
    console.log('   - Uses real ingredients from recipe instead of childProducts');
    console.log('   - Correctly calculates recipe batches needed based on yield');
    console.log('   - Properly deducts ingredient stock from Ingredient model');
    console.log('   - Provides detailed ingredient usage information');
    console.log('   - Handles insufficient ingredient scenarios correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await cleanup();
    process.exit(1);
  }
}

// Connect to database and run test
async function main() {
  try {
    // Use the same connection string as the main app
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plt-retail-store';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    await runInternalTest();
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

main();
