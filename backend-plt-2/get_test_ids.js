const mongoose = require('mongoose');
const Store = require('./src/models/Store');
const Recipe = require('./src/models/Recipe');
const Product = require('./src/models/Product');

async function getTestIds() {
  try {
    await mongoose.connect('mongodb://localhost:27017/retail_store_plt_solutions');
    console.log('Connected to MongoDB');
    
    // Get first store
    const store = await Store.findOne({});
    console.log('Store:', store ? { id: store._id, code: store.storeCode, name: store.name } : 'No store found');
    
    // Get first recipe
    const recipe = await Recipe.findOne({});
    console.log('Recipe:', recipe ? { id: recipe._id, name: recipe.dishName } : 'No recipe found');
    
    // Get first 2 regular products
    const products = await Product.find({ isComposite: false }).limit(2);
    console.log('Products:');
    products.forEach((p, i) => {
      console.log(`  Product ${i+1}: { id: ${p._id}, name: ${p.name}, code: ${p.productCode} }`);
    });
    
    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    mongoose.disconnect();
  }
}

getTestIds();
