const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data for stock in operation
const testStockInData = {
  storeCode: 'STORE001', // Replace with your actual store code
  ingredientId: '688dad2e42a61db99875884b', // The ingredient from the error
  warehouseId: '688dac6b42a61db9987586f9', // The warehouse from the error
  quantity: 10,
  unit: 'kg',
  note: 'Test stock in after fixing duplicate key error',
  batchNumber: 'BATCH001',
  costPerUnit: 25.50,
  temperatureCondition: 'room_temp'
};

async function testStockIn() {
  try {
    console.log('🧪 Testing ingredient stock in operation...');
    console.log('📦 Test data:', JSON.stringify(testStockInData, null, 2));
    
    // For testing purposes, we'll skip authentication by adding a mock user
    // In production, you would need a proper JWT token
    const response = await axios.post(
      `${API_BASE_URL}/ingredient-inventory/stock-in`,
      testStockInData,
      {
        headers: {
          'Content-Type': 'application/json',
          // Note: You'll need to add proper authentication headers
          // 'Authorization': 'Bearer YOUR_JWT_TOKEN'
        }
      }
    );
    
    console.log('✅ Stock in operation successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Stock in operation failed:');
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

async function testStockInWithSameBatch() {
  try {
    console.log('\n🧪 Testing ingredient stock in with same batch (should update existing)...');
    
    const sameData = {
      ...testStockInData,
      quantity: 5,
      note: 'Adding more stock to existing batch'
    };
    
    console.log('📦 Test data:', JSON.stringify(sameData, null, 2));
    
    const response = await axios.post(
      `${API_BASE_URL}/ingredient-inventory/stock-in`,
      sameData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Stock in operation successful (should have updated existing batch)!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Stock in operation failed:');
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

async function testStockInWithDifferentBatch() {
  try {
    console.log('\n🧪 Testing ingredient stock in with different batch (should create new record)...');
    
    const differentData = {
      ...testStockInData,
      quantity: 8,
      batchNumber: 'BATCH002',
      note: 'Adding stock with different batch number'
    };
    
    console.log('📦 Test data:', JSON.stringify(differentData, null, 2));
    
    const response = await axios.post(
      `${API_BASE_URL}/ingredient-inventory/stock-in`,
      differentData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Stock in operation successful (should have created new batch record)!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Stock in operation failed:');
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🏁 Starting stock in operation tests...\n');
  
  // Note: These tests will fail without proper authentication
  // They're provided as examples of how to test the fix
  console.log('⚠️  Note: These tests require proper authentication tokens.');
  console.log('⚠️  The tests below show the expected behavior after fixing the duplicate key error.\n');
  
  // Uncomment these when you have proper authentication set up:
  // await testStockIn();
  // await testStockInWithSameBatch();
  // await testStockInWithDifferentBatch();
  
  console.log('✅ Test framework ready. Uncomment test calls when authentication is configured.');
}

if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n🎉 Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testStockIn,
  testStockInWithSameBatch,
  testStockInWithDifferentBatch
};
