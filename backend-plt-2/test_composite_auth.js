// Enhanced test với authentication và real data
const http = require('http');
const querystring = require('querystring');

const BASE_URL = 'http://localhost:5000';

// Test login data - update với credentials thực tế
const loginData = {
  email: 'admin@test.com', // Update với email thực tế
  password: 'password123' // Update với password thực tế
};

// Test composite data
const testCompositeData = {
  productCode: 'COMP_TEST_' + Date.now(),
  name: 'Test Composite Product',
  description: 'Test composite product for API validation',
  storeId: '66b5c123456789abcdef0001', // Replace with actual store ID
  capacity: {
    quantity: 10,
    unit: 'tô'
  },
  recipeId: '66b5c123456789abcdef0003', // Replace with actual recipe ID
  expiryHours: 24,
  // Child products are optional now
  childProducts: []
};

function makeAuthenticatedRequest(options, data = null, cookie = null) {
  return new Promise((resolve, reject) => {
    if (cookie) {
      options.headers = options.headers || {};
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({ 
            status: res.statusCode, 
            data: parsedBody, 
            headers: res.headers,
            setCookie: res.headers['set-cookie']
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

async function testCompositeAPIWithAuth() {
  try {
    console.log('🔐 Testing Composite Products API với Authentication...\n');

    // Bước 1: Thử login để lấy session cookie
    console.log('1. Attempting login to get session cookie...');
    try {
      const loginResponse = await makeAuthenticatedRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, loginData);

      console.log('Login response status:', loginResponse.status);
      
      if (loginResponse.status === 200 && loginResponse.setCookie) {
        const sessionCookie = loginResponse.setCookie.find(cookie => 
          cookie.startsWith('connect.sid=') || cookie.startsWith('session=')
        );
        
        if (sessionCookie) {
          console.log('✅ Login successful, got session cookie');
          
          // Bước 2: Test authenticated GET request
          console.log('\n2. Testing GET /api/composite-products with auth...');
          const getResponse = await makeAuthenticatedRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/composite-products',
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }, null, sessionCookie);

          if (getResponse.status === 200) {
            console.log('✅ GET composite products successful');
            console.log('   Found', getResponse.data?.length || 0, 'composite products');
          } else {
            console.log('❌ GET failed with status:', getResponse.status);
            console.log('   Response:', getResponse.data);
          }

          // Bước 3: Test authenticated POST request
          console.log('\n3. Testing POST /api/composite-products with auth...');
          const postResponse = await makeAuthenticatedRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/composite-products',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }, testCompositeData, sessionCookie);

          console.log('POST response status:', postResponse.status);
          
          if (postResponse.status === 201) {
            console.log('✅ POST composite product successful');
            console.log('   Created product:', postResponse.data.name);
          } else if (postResponse.status === 400) {
            console.log('❌ POST failed with validation errors:');
            console.log('   ', JSON.stringify(postResponse.data, null, 2));
          } else {
            console.log('❌ POST failed with status:', postResponse.status);
            console.log('   Response:', JSON.stringify(postResponse.data, null, 2));
          }

          // Bước 4: Test calculate price endpoint
          console.log('\n4. Testing calculate price endpoint...');
          const calcResponse = await makeAuthenticatedRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/composite-products/calculate-price-from-recipe',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }, {
            recipeId: testCompositeData.recipeId,
            capacity: testCompositeData.capacity
          }, sessionCookie);

          console.log('Calculate price response status:', calcResponse.status);
          if (calcResponse.status === 200) {
            console.log('✅ Calculate price successful');
          } else {
            console.log('❌ Calculate price failed:', calcResponse.data);
          }

        } else {
          console.log('❌ Login successful but no session cookie received');
        }
      } else {
        console.log('❌ Login failed. Status:', loginResponse.status);
        console.log('   Response:', loginResponse.data);
        console.log('\n💡 Cần cập nhật loginData với credentials đúng');
      }
    } catch (error) {
      console.log('❌ Login request failed:', error.message);
      console.log('\n💡 Make sure backend server is running và login endpoint exists');
    }

    console.log('\n📋 API Test với Authentication Summary:');
    console.log('- Tested login flow');
    console.log('- Tested authenticated requests');
    console.log('- Tested composite product creation');
    console.log('- Tested price calculation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testCompositeAPIWithAuth();
