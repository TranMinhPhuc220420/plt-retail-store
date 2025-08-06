/**
 * Test Unit Conversion Functions
 * Test the unit simplification migration logic
 */

const { convertToSimplifiedUnit } = require('./migrate_simplify_units');

console.log('🧪 Testing Unit Conversion Functions\n');

// Test cases for weight conversions
console.log('📏 Weight Conversions:');
console.log('1000g → ', convertToSimplifiedUnit(1000, 'g'));
console.log('500g → ', convertToSimplifiedUnit(500, 'g'));
console.log('2kg → ', convertToSimplifiedUnit(2, 'kg'));
console.log('1lb → ', convertToSimplifiedUnit(1, 'lb'));
console.log('16oz → ', convertToSimplifiedUnit(16, 'oz'));

console.log('\n🧪 Volume Conversions:');
console.log('1000ml → ', convertToSimplifiedUnit(1000, 'ml'));
console.log('500ml → ', convertToSimplifiedUnit(500, 'ml'));
console.log('2l → ', convertToSimplifiedUnit(2, 'l'));
console.log('1cup → ', convertToSimplifiedUnit(1, 'cup'));
console.log('4tbsp → ', convertToSimplifiedUnit(4, 'tbsp'));
console.log('12tsp → ', convertToSimplifiedUnit(12, 'tsp'));

console.log('\n📦 Count Conversions:');
console.log('10 piece → ', convertToSimplifiedUnit(10, 'piece'));
console.log('5 pack → ', convertToSimplifiedUnit(5, 'pack'));
console.log('2 box → ', convertToSimplifiedUnit(2, 'box'));

console.log('\n✅ Existing Correct Units:');
console.log('2.5kg → ', convertToSimplifiedUnit(2.5, 'kg'));
console.log('1.5l → ', convertToSimplifiedUnit(1.5, 'l'));

console.log('\n❓ Unknown Units:');
console.log('5 unknown → ', convertToSimplifiedUnit(5, 'unknown'));
console.log('null unit → ', convertToSimplifiedUnit(10, null));
console.log('empty unit → ', convertToSimplifiedUnit(10, ''));

console.log('\n🎉 Unit conversion testing completed!');
