/**
 * Test script to verify PrepareCompositeModal works with direct product data
 * This simulates the behavior without API calls
 */

// Mock data similar to what the user provided
const mockProduct = {
    "compositeInfo": {
        "capacity": {
            "quantity": 50,
            "unit": "phần"
        },
        "recipeYield": {
            "quantity": 50,
            "unit": "phần"
        },
        "recipeId": "688dae1642a61db998758a9c",
        "recipeCost": {
            "$numberDecimal": "25760"
        },
        "childProducts": [
            {
                "productId": {
                    "_id": "688de13a7c74d23f93678148",
                    "name": "Bún bò",
                    "costPrice": {
                        "$numberDecimal": "20000"
                    },
                    "unit": "Tô"
                },
                "costPrice": {
                    "$numberDecimal": "25760"
                },
                "sellingPrice": {
                    "$numberDecimal": "45000"
                },
                "retailPrice": {
                    "$numberDecimal": "43000"
                },
                "_id": "68916967ee8c18f65654dbf0"
                // Note: Missing quantityPerServing and unit - this is legacy data
            }
        ],
        "currentStock": 0,
        "expiryHours": 24,
        "lastPreparedAt": null
    },
    "_id": "68916967ee8c18f65654dbef",
    "productCode": "noi-nuoc-pho",
    "name": "Nồi nước phở",
    "price": {
        "$numberDecimal": "45000"
    },
    "retailPrice": {
        "$numberDecimal": "43000"
    },
    "costPrice": {
        "$numberDecimal": "25760"
    },
    "minStock": 1,
    "unit": "phần",
    "status": "active",
    "ownerId": "688dab1b42a61db9987585e8",
    "storeId": "688dab5142a61db9987585f7",
    "deleted": false,
    "categories": [],
    "orderItems": [],
    "inventoryTransactions": [],
    "recipes": [],
    "defaultRecipeId": null,
    "isComposite": true,
    "createdAt": "2025-08-05T02:16:07.875Z",
    "updatedAt": "2025-08-05T02:16:55.994Z",
    "__v": 0,
    "statusInfo": {
        "status": "fresh",
        "hoursElapsed": 0
    },
    "key": "68916967ee8c18f65654dbef"
};

// Test the parseDecimal function (from utils)
function parseDecimal(value) {
    if (!value) return 0;
    
    // Handle MongoDB Decimal128 format
    if (typeof value === 'object' && value.$numberDecimal) {
        const parsed = parseFloat(value.$numberDecimal);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    // Handle regular number or string
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}

// Test the parseCompositeProductData function
function parseCompositeProductData(compositeProductData) {
    if (!compositeProductData) return null;

    return {
        ...compositeProductData,
        price: parseDecimal(compositeProductData.price),
        retailPrice: parseDecimal(compositeProductData.retailPrice),
        costPrice: parseDecimal(compositeProductData.costPrice),
        compositeInfo: compositeProductData.compositeInfo ? {
            ...compositeProductData.compositeInfo,
            recipeCost: parseDecimal(compositeProductData.compositeInfo.recipeCost),
            currentStock: compositeProductData.compositeInfo.currentStock || 0,
            expiryHours: compositeProductData.compositeInfo.expiryHours || 24,
            capacity: compositeProductData.compositeInfo.capacity || { quantity: 1, unit: 'phần' },
            childProducts: compositeProductData.compositeInfo.childProducts?.map(child => ({
                ...child,
                quantityPerServing: parseFloat(child.quantityPerServing) || 1,
                unit: child.unit || 'piece',
                costPrice: parseDecimal(child.costPrice),
                sellingPrice: parseDecimal(child.sellingPrice),
                retailPrice: parseDecimal(child.retailPrice),
                productId: typeof child.productId === 'object' ? {
                    ...child.productId,
                    costPrice: parseDecimal(child.productId.costPrice),
                    retailPrice: parseDecimal(child.productId.retailPrice)
                } : child.productId
            })) || []
        } : {}
    };
}

// Test the calculation logic from PrepareCompositeModal
function calculateRequirements(detailedProduct, quantityToPrepare = 1) {
    console.log('🧪 Testing calculateRequirements with:', quantityToPrepare);
    console.log('🧪 Detailed product:', detailedProduct);
    
    // Validate inputs
    if (!detailedProduct?.compositeInfo?.childProducts || !Array.isArray(detailedProduct.compositeInfo.childProducts)) {
        console.log('❌ No child products found or invalid structure');
        return [];
    }

    if (!detailedProduct.compositeInfo.capacity?.quantity || detailedProduct.compositeInfo.capacity.quantity <= 0) {
        console.log('❌ Invalid capacity configuration');
        return [];
    }

    if (!quantityToPrepare || quantityToPrepare < 1) {
        console.log('❌ Invalid quantity to prepare');
        return [];
    }
    
    const requirements = detailedProduct.compositeInfo.childProducts.map(child => {
        // Validate child product structure
        if (!child.productId) {
            console.warn('❌ Invalid child product structure - missing productId:', child);
            return null;
        }

        // Handle legacy data that might not have quantityPerServing and unit
        const quantityPerServing = parseFloat(child.quantityPerServing) || 1;
        const unit = child.unit || child.productId.unit || 'phần';
        const capacityQuantity = parseFloat(detailedProduct.compositeInfo.capacity.quantity) || 0;
        const totalNeeded = quantityPerServing * capacityQuantity * quantityToPrepare;
        
        // Safe parsing of prices
        const costPrice = parseDecimal(child.productId.costPrice) || parseDecimal(child.costPrice) || 0;
        const retailPrice = parseDecimal(child.productId.retailPrice) || parseDecimal(child.retailPrice) || 0;
        
        const requirement = {
            productId: child.productId._id,
            productName: child.productId.name || 'Unknown Product',
            quantityNeeded: totalNeeded,
            unit: unit,
            costPrice: costPrice,
            retailPrice: retailPrice,
            totalCost: costPrice * totalNeeded,
            totalRevenue: retailPrice * totalNeeded,
            isValid: totalNeeded > 0 && !isNaN(totalNeeded),
            isLegacyData: !child.quantityPerServing || !child.unit
        };
        
        console.log('✅ Child requirement:', requirement);
        console.log('📊 Calculation details:', {
            quantityPerServing,
            capacityQuantity,
            quantityToPrepare,
            totalNeeded,
            unit,
            isLegacyData: requirement.isLegacyData
        });
        
        return requirement;
    }).filter(req => req !== null && req.isValid);
    
    console.log('✅ Final requirements:', requirements);
    return requirements;
}

// Run the test
function runTest() {
    console.log('🧪 Testing PrepareCompositeModal calculation logic...\n');

    // Step 1: Parse the product data
    console.log('1. Parsing product data...');
    const parsedProduct = parseCompositeProductData(mockProduct);
    
    if (parsedProduct) {
        console.log('✅ Product parsed successfully');
        console.log('   - Name:', parsedProduct.name);
        console.log('   - Capacity:', parsedProduct.compositeInfo.capacity.quantity, parsedProduct.compositeInfo.capacity.unit);
        console.log('   - Child products count:', parsedProduct.compositeInfo.childProducts.length);
    } else {
        console.log('❌ Failed to parse product');
        return;
    }

    // Step 2: Test calculation with different quantities
    console.log('\n2. Testing calculations...');
    
    [1, 2, 5].forEach(quantity => {
        console.log(`\n--- Testing with ${quantity} batch(es) ---`);
        const requirements = calculateRequirements(parsedProduct, quantity);
        
        if (requirements.length > 0) {
            console.log(`✅ Generated ${requirements.length} requirements`);
            
            // Calculate totals
            const totalCost = requirements.reduce((sum, req) => {
                if (!req || typeof req.totalCost !== 'number' || isNaN(req.totalCost)) {
                    return sum;
                }
                return sum + req.totalCost;
            }, 0);
            
            const totalRevenue = requirements.reduce((sum, req) => {
                if (!req || typeof req.totalRevenue !== 'number' || isNaN(req.totalRevenue)) {
                    return sum;
                }
                return sum + req.totalRevenue;
            }, 0);
            
            const totalServings = parsedProduct.compositeInfo.capacity.quantity * quantity;
            const costPerServing = totalServings > 0 && totalCost > 0 ? totalCost / totalServings : 0;
            
            console.log('📊 Summary:');
            console.log(`   - Total servings: ${totalServings}`);
            console.log(`   - Total cost: ${totalCost.toLocaleString('vi-VN')} VND`);
            console.log(`   - Total revenue: ${totalRevenue.toLocaleString('vi-VN')} VND`);
            console.log(`   - Cost per serving: ${costPerServing.toLocaleString('vi-VN')} VND`);
            
            // Check for legacy data warnings
            const legacyItems = requirements.filter(req => req.isLegacyData);
            if (legacyItems.length > 0) {
                console.log(`⚠️  Warning: ${legacyItems.length} items using legacy data (default quantities)`);
            }
        } else {
            console.log('❌ No valid requirements generated');
        }
    });

    console.log('\n🎉 Test completed!');
}

// Run the test
runTest();
