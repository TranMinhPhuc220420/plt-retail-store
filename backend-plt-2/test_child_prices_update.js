// Test script for child product prices update API
const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Mock authentication token (for testing purposes)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGI5MTY5NjdlZThjMThmNjU2NTRkYmVmIiwiaWF0IjoxNzMzNDk0ODAwfQ.test';

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

async function testUpdateChildProductPrices() {
  console.log('🧪 Testing Child Product Prices Update API...\n');

  // Test data
  const compositeProductId = '68916967ee8c18f65654dbef';
  const updateData = {
    childProducts: [
      {
        productId: '688de13a7c74d23f93678148',
        sellingPrice: 50000,
        retailPrice: 43000
      }
    ]
  };

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/composite-products/${compositeProductId}/child-prices`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`
    }
  };

  try {
    console.log('📤 Making PUT request to:', `${BASE_URL}${options.path}`);
    console.log('📤 Payload:', JSON.stringify(updateData, null, 2));
    
    const response = await makeRequest(options, updateData);
    
    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('\n✅ SUCCESS: Child product prices updated successfully!');
      
      // Verify the composite product prices were updated correctly
      if (response.data.price && response.data.retailPrice) {
        console.log('✅ Composite product prices updated:');
        console.log(`   - Selling Price: ${response.data.price}`);
        console.log(`   - Retail Price: ${response.data.retailPrice}`);
      }
    } else if (response.status === 401) {
      console.log('\n⚠️  AUTHENTICATION REQUIRED: Please provide valid authentication token');
      console.log('   This is expected behavior - the endpoint requires authentication');
    } else if (response.status === 404) {
      console.log('\n❌ ERROR: Composite product not found or endpoint not available');
    } else {
      console.log(`\n❌ ERROR: Request failed with status ${response.status}`);
      console.log('Error details:', response.data);
    }

  } catch (error) {
    console.log('\n❌ NETWORK ERROR:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testUpdateChildProductPrices();
}

module.exports = { testUpdateChildProductPrices };
