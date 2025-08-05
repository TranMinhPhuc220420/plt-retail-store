// Test script để kiểm tra Child Product Restriction functionality
// Chạy script này trong browser console hoặc trong test environment

const TEST_CONFIG = {
  baseURL: 'http://localhost:3000/api', // Adjust based on your backend URL
  authToken: 'your-auth-token-here' // Replace with actual auth token
};

class ChildProductRestrictionTest {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.authToken = config.authToken;
  }

  async makeRequest(method, url, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${url}`, options);
    const result = await response.json();
    
    return {
      status: response.status,
      data: result
    };
  }

  async testCheckChildProductStatus(productId) {
    console.log(`\n=== Testing Child Product Status Check for Product ${productId} ===`);
    
    try {
      const result = await this.makeRequest('GET', `/products/check-child-status/${productId}`);
      
      console.log('Status:', result.status);
      console.log('Response:', result.data);
      
      if (result.status === 200) {
        console.log(`✅ Child Product Status: ${result.data.isChildProduct ? 'YES' : 'NO'}`);
        if (result.data.isChildProduct) {
          console.log(`📦 Composite Product: ${result.data.compositeProduct?.name || 'Unknown'}`);
        }
      } else {
        console.log('❌ Failed to check child product status');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error checking child product status:', error);
      return null;
    }
  }

  async testUpdateRestrictedFields(productId, updateData) {
    console.log(`\n=== Testing Update of Restricted Fields for Product ${productId} ===`);
    console.log('Update data:', updateData);
    
    try {
      const result = await this.makeRequest('PUT', `/products/my-products-stores/${productId}`, updateData);
      
      console.log('Status:', result.status);
      console.log('Response:', result.data);
      
      if (result.status === 400 && result.data.error === 'child_product_restricted_fields') {
        console.log('✅ Restriction working correctly');
        console.log(`🚫 Restricted fields: ${result.data.restrictedFields.join(', ')}`);
        console.log(`📦 Composite product: ${result.data.compositeProductName}`);
        return true;
      } else if (result.status === 200) {
        console.log('⚠️  Update succeeded - restriction might not be working');
        return false;
      } else {
        console.log('❌ Unexpected error:', result.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing restricted field update:', error);
      return false;
    }
  }

  async testUpdateAllowedFields(productId, updateData) {
    console.log(`\n=== Testing Update of Allowed Fields for Product ${productId} ===`);
    console.log('Update data:', updateData);
    
    try {
      const result = await this.makeRequest('PUT', `/products/my-products-stores/${productId}`, updateData);
      
      console.log('Status:', result.status);
      console.log('Response:', result.data);
      
      if (result.status === 200) {
        console.log('✅ Allowed field update succeeded');
        return true;
      } else {
        console.log('❌ Allowed field update failed:', result.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing allowed field update:', error);
      return false;
    }
  }

  async runCompleteTest(productId, storeCode) {
    console.log(`\n🧪 Starting Complete Child Product Restriction Test`);
    console.log(`Product ID: ${productId}`);
    console.log(`Store Code: ${storeCode}`);
    
    const results = {
      statusCheck: false,
      restrictedFieldsBlocked: false,
      allowedFieldsWork: false
    };

    // 1. Check child product status
    const statusResult = await this.testCheckChildProductStatus(productId);
    if (statusResult && statusResult.status === 200) {
      results.statusCheck = true;
      
      // Only run restriction tests if it's actually a child product
      if (statusResult.data.isChildProduct) {
        
        // 2. Test restricted fields (should fail)
        const restrictedUpdateData = {
          storeCode,
          price: 99999,
          retailPrice: 150000,
          costPrice: 50000,
          unit: 'NEW_UNIT'
        };
        results.restrictedFieldsBlocked = await this.testUpdateRestrictedFields(productId, restrictedUpdateData);
        
        // 3. Test allowed fields (should succeed)
        const allowedUpdateData = {
          storeCode,
          name: `Updated Product Name ${Date.now()}`,
          description: 'This is an updated description for testing'
        };
        results.allowedFieldsWork = await this.testUpdateAllowedFields(productId, allowedUpdateData);
        
      } else {
        console.log('ℹ️  Product is not a child product, skipping restriction tests');
        results.restrictedFieldsBlocked = true; // Consider this passed since there are no restrictions
        results.allowedFieldsWork = true;
      }
    }

    // Summary
    console.log(`\n📊 Test Results Summary:`);
    console.log(`Status Check API: ${results.statusCheck ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Restricted Fields Blocked: ${results.restrictedFieldsBlocked ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Allowed Fields Work: ${results.allowedFieldsWork ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(result => result === true);
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return results;
  }
}

// Usage example:
// 1. Replace TEST_CONFIG with your actual values
// 2. Replace 'PRODUCT_ID_HERE' and 'STORE_CODE_HERE' with actual IDs
// 3. Run the test

const tester = new ChildProductRestrictionTest(TEST_CONFIG);

// Test a specific product
// tester.runCompleteTest('PRODUCT_ID_HERE', 'STORE_CODE_HERE');

// Test multiple products
async function runMultipleTests() {
  const testCases = [
    { productId: 'CHILD_PRODUCT_ID_1', storeCode: 'STORE001' },
    { productId: 'NORMAL_PRODUCT_ID_1', storeCode: 'STORE001' }
  ];
  
  for (const testCase of testCases) {
    await tester.runCompleteTest(testCase.productId, testCase.storeCode);
    console.log('\n' + '='.repeat(80));
  }
}

// Uncomment to run multiple tests
// runMultipleTests();

console.log('Child Product Restriction Test Script Loaded ✅');
console.log('Update TEST_CONFIG and call tester.runCompleteTest(productId, storeCode) to start testing');
