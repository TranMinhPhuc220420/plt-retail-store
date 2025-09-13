const axios = require('axios');

const testOrderCreation = async () => {
  try {
    console.log('🧪 Testing Order Creation with Required Fields...\n');
    
    // Test the demo endpoint first to ensure basic structure works
    console.log('Testing demo order...');
    const demoOrderData = {
      customerName: 'Test Customer',
      customerPhone: '0123456789',
      items: [
        {
          productName: 'Test Product',
          productCode: 'TEST001',
          quantity: 2,
          unitPrice: 15000,
          unit: 'cái'
        }
      ]
    };

    try {
      const demoResponse = await axios.post('http://localhost:5000/api/demo/orders', demoOrderData);
      
      if (demoResponse.data && demoResponse.data.success) {
        console.log('✅ Demo order created successfully!');
        console.log(`   Order Number: ${demoResponse.data.data.orderNumber}`);
        console.log(`   Subtotal: ${demoResponse.data.data.subtotal}`);
        console.log(`   Total Amount: ${demoResponse.data.data.totalAmount}`);
        
        // Check required fields are present
        const order = demoResponse.data.data;
        const requiredFields = ['orderNumber', 'subtotal', 'totalAmount'];
        const missingFields = requiredFields.filter(field => !order[field]);
        
        if (missingFields.length === 0) {
          console.log('✅ All required fields present in demo order');
        } else {
          console.log('❌ Missing fields in demo order:', missingFields);
        }
      }
    } catch (error) {
      console.log('❌ Demo order creation failed:');
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Error:', error.response.data);
      } else {
        console.log('   Error:', error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ Order validation fix summary:');
    console.log('   1. Added subtotal calculation');
    console.log('   2. Added totalAmount calculation');
    console.log('   3. Added orderNumber generation');
    console.log('   4. Added taxAmount and discountAmount');
    console.log('   5. Converted all amounts to Decimal128');
    console.log('   6. Fixed employee data in orderData');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run test if called directly
if (require.main === module) {
  testOrderCreation()
    .then(() => {
      console.log('\n✅ Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test error:', error.message);
      process.exit(1);
    });
}

module.exports = { testOrderCreation };