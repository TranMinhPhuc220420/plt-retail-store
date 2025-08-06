/**
 * Test script to verify PrepareCompositeModal fixes
 * Tests the API endpoints and data flow
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Test data with new quantityPerServing and unit fields
const testCompositeData = {
  productCode: 'COMP_FIXED_001',
  name: 'Fixed Composite Product Test',
  description: 'Test composite product with quantityPerServing and unit fields',
  storeId: '66b5c123456789abcdef0001', // Replace with actual store ID
  capacity: {
    quantity: 10,
    unit: 'bowl'
  },
  childProducts: [
    {
      productId: '66b5c123456789abcdef0002', // Replace with actual product ID
      quantityPerServing: 0.5, // New field
      unit: 'kg', // New field
      costPrice: 5000,
      sellingPrice: 6500,
      retailPrice: 7500
    },
    {
      productId: '66b5c123456789abcdef0003', // Replace with actual product ID
      quantityPerServing: 2, // New field
      unit: 'piece', // New field
      costPrice: 2000,
      sellingPrice: 2600,
      retailPrice: 3000
    }
  ],
  recipeId: '66b5c123456789abcdef0004', // Replace with actual recipe ID
  expiryHours: 24,
  price: 91000, // 6500 + 2600
  retailPrice: 105000 // 7500 + 3000
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
          resolve({
            status: res.statusCode,
            data: parsedBody,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function makeAuthenticatedRequest(options, data = null, sessionCookie = null) {
  if (sessionCookie) {
    options.headers = {
      ...options.headers,
      'Cookie': sessionCookie
    };
  }
  return makeRequest(options, data);
}

async function testPrepareCompositeAPIFixed() {
  try {
    console.log('🧪 Testing FIXED Prepare Composite API...\n');

    // Step 1: Login first
    console.log('1. Authenticating...');
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      identifier: 'testuser@example.com', // Replace with actual credentials
      password: 'testpassword'
    });

    if (loginResponse.status !== 200) {
      console.log('❌ Authentication failed:', loginResponse.status);
      return;
    }

    const sessionCookie = loginResponse.headers['set-cookie']?.[0];
    console.log('✅ Authentication successful');

    // Step 2: Create a test composite product
    console.log('\n2. Creating test composite product with quantityPerServing and unit...');
    const createResponse = await makeAuthenticatedRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/composite-products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testCompositeData, sessionCookie);

    console.log('Create response status:', createResponse.status);
    
    if (createResponse.status === 201) {
      console.log('✅ Composite product created successfully');
      
      const createdProduct = createResponse.data;
      console.log('Created product ID:', createdProduct._id);
      
      // Verify child products have quantityPerServing and unit
      if (createdProduct.compositeInfo?.childProducts) {
        console.log('\n📋 Verifying child products structure:');
        createdProduct.compositeInfo.childProducts.forEach((child, index) => {
          console.log(`   Child ${index + 1}:`);
          console.log(`     - quantityPerServing: ${child.quantityPerServing}`);
          console.log(`     - unit: ${child.unit}`);
          console.log(`     - costPrice: ${child.costPrice}`);
          
          if (child.quantityPerServing && child.unit) {
            console.log('     ✅ Required fields present');
          } else {
            console.log('     ❌ Missing required fields');
          }
        });
      }

      // Step 3: Test prepare composite endpoint
      console.log('\n3. Testing prepare composite endpoint...');
      const prepareResponse = await makeAuthenticatedRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/composite-products/${createdProduct._id}/prepare`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, { quantityToPrepare: 2 }, sessionCookie);

      console.log('Prepare response status:', prepareResponse.status);
      
      if (prepareResponse.status === 200) {
        console.log('✅ Prepare composite successful');
        console.log('Preparation details:', {
          totalServingsPrepared: prepareResponse.data.totalServingsPrepared,
          newStock: prepareResponse.data.preparationDetails?.newStock
        });
        
        // Test calculation logic
        if (prepareResponse.data.requiredIngredients) {
          console.log('\n🧮 Verifying calculation logic:');
          Object.values(prepareResponse.data.requiredIngredients).forEach(ingredient => {
            console.log(`   ${ingredient.name}:`);
            console.log(`     - needed: ${ingredient.needed} ${ingredient.unit}`);
            console.log(`     - available: ${ingredient.available} ${ingredient.unit}`);
            
            if (typeof ingredient.needed === 'number' && !isNaN(ingredient.needed)) {
              console.log('     ✅ Calculation is valid');
            } else {
              console.log('     ❌ Invalid calculation (NaN)');
            }
          });
        }
      } else if (prepareResponse.status === 400) {
        console.log('⚠️  Prepare failed with validation error:', prepareResponse.data);
        if (prepareResponse.data.error === 'insufficient_ingredients') {
          console.log('   This is expected if test products don\'t have enough stock');
        }
      } else {
        console.log('❌ Prepare failed:', prepareResponse.data);
      }

      // Step 4: Test get details endpoint
      console.log('\n4. Testing get details endpoint...');
      const detailsResponse = await makeAuthenticatedRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/composite-products/${createdProduct._id}/details`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, null, sessionCookie);

      console.log('Details response status:', detailsResponse.status);
      
      if (detailsResponse.status === 200) {
        console.log('✅ Get details successful');
        
        // Verify the structure matches what the frontend expects
        const details = detailsResponse.data;
        if (details.compositeInfo?.childProducts) {
          console.log('\n🔍 Verifying details structure for frontend:');
          details.compositeInfo.childProducts.forEach((child, index) => {
            console.log(`   Child ${index + 1}:`);
            console.log(`     - quantityPerServing: ${child.quantityPerServing}`);
            console.log(`     - unit: ${child.unit}`);
            console.log(`     - productId populated: ${!!child.productId?.name}`);
            
            const hasRequiredFields = child.quantityPerServing !== undefined && 
                                    child.unit && 
                                    child.productId;
            
            if (hasRequiredFields) {
              console.log('     ✅ Frontend-ready structure');
            } else {
              console.log('     ❌ Missing fields for frontend');
            }
          });
        }
      } else {
        console.log('❌ Get details failed:', detailsResponse.data);
      }

      // Step 5: Clean up - delete test product
      console.log('\n5. Cleaning up test data...');
      const deleteResponse = await makeAuthenticatedRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/composite-products/${createdProduct._id}`,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      }, null, sessionCookie);

      if (deleteResponse.status === 200) {
        console.log('✅ Test data cleaned up');
      } else {
        console.log('⚠️  Failed to clean up test data');
      }

    } else {
      console.log('❌ Failed to create composite product:', createResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPrepareCompositeAPIFixed();
