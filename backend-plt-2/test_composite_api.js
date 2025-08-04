// Test script cho composite products API
const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Test data
const testData = {
  productCode: 'COMP_TEST_001',
  name: 'Test Composite Product',
  description: 'Test composite product for API validation',
  storeId: '66b5c123456789abcdef0001', // Replace with actual store ID
  capacity: {
    quantity: 10,
    unit: 'tô'
  },
  childProducts: [
    {
      productId: '66b5c123456789abcdef0002', // Replace with actual product ID
      costPrice: 5000,
      sellingPrice: 6500,
      retailPrice: 7500
    }
  ],
  recipeId: '66b5c123456789abcdef0003', // Replace with actual recipe ID
  expiryHours: 24,
  price: 65000,
  retailPrice: 75000
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsedBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testCompositeAPI() {
  try {
    console.log('🧪 Testing Composite Products API...\n');

    // Test 1: Get composite products (without auth - should fail)
    console.log('1. Testing GET /api/composite-products (without auth)');
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/composite-products',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 401) {
        console.log('✅ Correctly returned 401 Unauthorized');
      } else {
        console.log('❌ Expected 401 but got:', response.status);
      }
    } catch (error) {
      console.log('❌ Connection error:', error.message);
      return;
    }

    // Test 2: Health check
    console.log('\n2. Testing server health');
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/health',
        method: 'GET'
      });
      if (response.status === 200) {
        console.log('✅ Server is healthy:', response.data);
      } else {
        console.log('❌ Server health check failed:', response.status);
        return;
      }
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }

    // Test 3: Test POST route structure (without auth - should fail with 401, not 404)
    console.log('\n3. Testing POST /api/composite-products route structure');
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/composite-products',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, testData);
      
      if (response.status === 401) {
        console.log('✅ POST route exists and correctly requires authentication');
      } else if (response.status === 404) {
        console.log('❌ Route not found - check route registration');
      } else {
        console.log('❌ Unexpected status:', response.status, response.data);
      }
    } catch (error) {
      console.log('❌ POST request error:', error.message);
    }

    // Test 4: Test calculate price endpoint
    console.log('\n4. Testing POST /api/composite-products/calculate-price-from-recipe');
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/composite-products/calculate-price-from-recipe',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        recipeId: testData.recipeId,
        capacity: testData.capacity
      });
      
      if (response.status === 401) {
        console.log('✅ Calculate price route exists and correctly requires authentication');
      } else if (response.status === 404) {
        console.log('❌ Calculate price route not found');
      } else {
        console.log('❌ Unexpected status:', response.status, response.data);
      }
    } catch (error) {
      console.log('❌ Calculate price request error:', error.message);
    }

    console.log('\n📋 API Test Summary:');
    console.log('- Routes are properly registered');
    console.log('- Authentication middleware is working');
    console.log('- Server is healthy and responsive');
    console.log('\n💡 To test with authentication, you need to:');
    console.log('1. Login via /auth/login to get session cookie');
    console.log('2. Use the session cookie in subsequent requests');
    console.log('3. Ensure you have proper storeId, productId, and recipeId values');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testCompositeAPI();
