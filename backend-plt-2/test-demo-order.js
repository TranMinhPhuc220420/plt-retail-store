const axios = require('axios');

const testDemoOrder = async () => {
  try {
    console.log('Testing demo order API...');
    
    const orderData = {
      customerName: 'Test Customer',
      customerPhone: '0123456789',
      items: [
        {
          productId: 'test-product-1',
          productName: 'Test Product 1',
          productCode: 'TEST001',
          quantity: 2,
          unitPrice: 15000,
          unit: 'cái'
        },
        {
          productId: 'test-product-2',
          productName: 'Test Product 2',
          productCode: 'TEST002',
          quantity: 1,
          unitPrice: 25000,
          unit: 'ly'
        }
      ]
    };

    const response = await axios.post('http://localhost:5000/api/orders/demo', orderData);
    
    console.log('✅ Demo order created successfully!');
    console.log('Order ID:', response.data.data._id);
    console.log('Order Number:', response.data.data.orderNumber);
    console.log('Total Amount:', response.data.data.totalAmount);
    
    return response.data;
  } catch (error) {
    console.error('❌ Demo order test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
};

// Run test if called directly
if (require.main === module) {
  testDemoOrder()
    .then(() => {
      console.log('Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testDemoOrder };
