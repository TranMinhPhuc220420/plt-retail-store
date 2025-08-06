const https = require('https');
const http = require('http');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'test123'
};

const testCompositeProduct = {
  productCode: 'composite-test-001',
  name: 'Test Composite Product',
  description: 'Test composite product with child products',
  capacity: {
    quantity: 10,
    unit: 'tô'
  },
  storeId: '688dab5142a61db9987585f7', // Real store ID
  recipeId: '688dae1642a61db998758a9c', // Real recipe ID
  childProducts: [
    {
      productId: '688de13a7c74d23f93678148', // Real product ID
      quantityPerServing: 1,
      unit: 'piece',
      costPrice: 5000,
      sellingPrice: 7000,
      retailPrice: 8000
    }
  ],
  price: 7000,
  retailPrice: 8000
};

async function testChildProductsFix() {
  try {
    console.log('🧪 Testing Child Products Fix...\n');

    // Step 1: Login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Create composite product with child products
    console.log('\n2. Creating composite product with child products...');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const createResponse = await axios.post(
      `${API_BASE_URL}/composite-products`,
      testCompositeProduct,
      { headers }
    );

    console.log('✅ Composite product created successfully');
    console.log('Response status:', createResponse.status);
    console.log('Product ID:', createResponse.data._id);

    // Step 3: Check if childProducts are properly saved
    console.log('\n3. Checking child products in response...');
    const compositeInfo = createResponse.data.compositeInfo;
    
    if (compositeInfo && compositeInfo.childProducts) {
      console.log('✅ Child products found in compositeInfo');
      console.log('Number of child products:', compositeInfo.childProducts.length);
      console.log('Child products data:');
      compositeInfo.childProducts.forEach((child, index) => {
        console.log(`  Child ${index + 1}:`, {
          productId: child.productId,
          quantityPerServing: child.quantityPerServing,
          unit: child.unit,
          costPrice: child.costPrice,
          sellingPrice: child.sellingPrice,
          retailPrice: child.retailPrice
        });
      });
    } else {
      console.log('❌ Child products are missing or empty');
    }

    // Step 4: Fetch the product details to double-check
    console.log('\n4. Fetching product details to verify...');
    const detailsResponse = await axios.get(
      `${API_BASE_URL}/composite-products/${createResponse.data._id}/details`,
      { headers }
    );

    const detailsCompositeInfo = detailsResponse.data.compositeInfo;
    if (detailsCompositeInfo && detailsCompositeInfo.childProducts) {
      console.log('✅ Child products confirmed in details response');
      console.log('Number of child products in details:', detailsCompositeInfo.childProducts.length);
    } else {
      console.log('❌ Child products are missing in details response');
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testChildProductsFix();
