// Simple test using existing testing modules
const compositeProductController = require('./src/controllers/compositeProductController');

// Mock request/response objects
const mockReq = {
  body: {
    productCode: 'test-composite-with-children',
    name: 'Test Composite with Child Products',
    description: 'Testing child products save functionality',
    capacity: {
      quantity: 5,
      unit: 'tô'
    },
    storeId: '688dab5142a61db9987585f7',
    recipeId: '688dae1642a61db998758a9c',
    childProducts: [
      {
        productId: '688de13a7c74d23f93678148',
        quantityPerServing: 1,
        unit: 'piece',
        costPrice: 5000,
        sellingPrice: 7000,
        retailPrice: 8000
      }
    ],
    price: 7000,
    retailPrice: 8000
  },
  user: {
    _id: '688dab5142a61db9987585f6' // Mock user ID
  }
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('\n🔍 Response Status:', this.statusCode);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (data && data.compositeInfo && data.compositeInfo.childProducts) {
      console.log('\n✅ Child Products Found in Response:');
      console.log('   Number of child products:', data.compositeInfo.childProducts.length);
      data.compositeInfo.childProducts.forEach((child, index) => {
        console.log(`   Child ${index + 1}:`, {
          productId: child.productId,
          quantityPerServing: child.quantityPerServing,
          unit: child.unit,
          costPrice: child.costPrice,
          sellingPrice: child.sellingPrice,
          retailPrice: child.retailPrice
        });
      });
    } else {
      console.log('\n❌ No child products found in response');
    }
    
    return this;
  }
};

console.log('🧪 Testing Child Products Fix with Direct Controller Call...\n');

// Test the controller directly
compositeProductController.createComposite(mockReq, mockRes)
  .then(() => {
    console.log('\n✅ Controller test completed');
  })
  .catch(err => {
    console.error('\n❌ Controller test failed:', err);
  });
