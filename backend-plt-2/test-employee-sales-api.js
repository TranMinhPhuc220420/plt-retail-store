// Test script for Employee Sales History API endpoints
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Test data
const testEndpoints = [
  {
    name: 'Get all employee sales history',
    method: 'GET',
    url: '/api/orders/employee-sales-history',
    params: {
      page: 1,
      limit: 10
    }
  },
  {
    name: 'Get specific employee sales history',
    method: 'GET', 
    url: '/api/orders/employee-sales-history',
    params: {
      page: 1,
      limit: 10,
      // employeeId: 'EMPLOYEE_ID_HERE' // Replace with actual employee ID
    }
  },
  {
    name: 'Get employees sales summary',
    method: 'GET',
    url: '/api/orders/employees-sales-summary',
    params: {
      limit: 10
    }
  },
  {
    name: 'Get employee sales history with date filter',
    method: 'GET',
    url: '/api/orders/employee-sales-history',
    params: {
      page: 1,
      limit: 10,
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }
  }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`📡 ${endpoint.method} ${endpoint.url}`);
    
    const config = {
      method: endpoint.method.toLowerCase(),
      url: `${BASE_URL}${endpoint.url}`,
      withCredentials: true,
    };

    if (endpoint.params) {
      config.params = endpoint.params;
      console.log(`📋 Params:`, JSON.stringify(endpoint.params, null, 2));
    }

    if (endpoint.data) {
      config.data = endpoint.data;
      console.log(`📦 Data:`, JSON.stringify(endpoint.data, null, 2));
    }

    const response = await axios(config);
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
    
    // Validate response structure
    if (response.data.success !== undefined) {
      console.log(`✅ Response has success field: ${response.data.success}`);
    }
    
    if (response.data.data !== undefined) {
      console.log(`✅ Response has data field with ${Array.isArray(response.data.data) ? response.data.data.length + ' items' : 'object'}`);
    }
    
    if (response.data.pagination !== undefined) {
      console.log(`✅ Response has pagination:`, response.data.pagination);
    }
    
    if (response.data.statistics !== undefined) {
      console.log(`✅ Response has statistics:`, response.data.statistics);
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || error.code}`);
    console.log(`❌ Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data) {
      console.log(`❌ Response:`, JSON.stringify(error.response.data, null, 2));
    }
    
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Employee Sales History API Tests');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push({
      name: endpoint.name,
      ...result
    });
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n🏁 Test completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };