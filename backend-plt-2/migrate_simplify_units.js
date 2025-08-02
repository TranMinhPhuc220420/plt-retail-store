/**
 * Migration Script: Simplify Units to KG and Liter Only
 * 
 * This script converts all existing ingredients and recipes from old units (g, ml, piece, etc.)
 * to the simplified system using only kg and liter.
 * 
 * Conversion rules:
 * - Weight units (g, mg, lb, oz) -> kg
 * - Volume units (ml, cup, tbsp, tsp) -> l
 * - Count units (piece, pack, box) -> kg (assume 1 piece = 0.1 kg average)
 */

const mongoose = require('mongoose');
const Ingredient = require('./src/models/Ingredient');
const Recipe = require('./src/models/Recipe');
const IngredientStockBalance = require('./src/models/IngredientStockBalance');
const IngredientStockTransaction = require('./src/models/IngredientStockTransaction');

// Unit conversion factors to new simplified system
const UNIT_CONVERSIONS = {
  // Weight conversions to kg
  'g': 0.001,
  'mg': 0.000001,
  'lb': 0.453592,
  'oz': 0.0283495,
  'kg': 1, // already correct
  
  // Volume conversions to liter
  'ml': 0.001,
  'cup': 0.236588,
  'tbsp': 0.0147868,
  'tsp': 0.00492892,
  'l': 1, // already correct
  
  // Count conversions (estimate - assume average item weight)
  'piece': { unit: 'kg', factor: 0.1 },  // assume 1 piece = 100g
  'pack': { unit: 'kg', factor: 0.5 },   // assume 1 pack = 500g
  'box': { unit: 'kg', factor: 1.0 }     // assume 1 box = 1kg
};

/**
 * Convert old unit to new simplified unit system
 * @param {number} quantity - Original quantity
 * @param {string} oldUnit - Original unit
 * @returns {Object} {quantity, unit} - Converted quantity and unit
 */
function convertToSimplifiedUnit(quantity, oldUnit) {
  if (!oldUnit) return { quantity, unit: 'kg' }; // default to kg
  
  const conversion = UNIT_CONVERSIONS[oldUnit.toLowerCase()];
  
  if (!conversion) {
    console.log(`Unknown unit: ${oldUnit}, defaulting to kg`);
    return { quantity, unit: 'kg' };
  }
  
  // Handle count units (they convert to kg with different logic)
  if (typeof conversion === 'object') {
    return {
      quantity: quantity * conversion.factor,
      unit: conversion.unit
    };
  }
  
  // Handle weight/volume units
  if (['g', 'mg', 'lb', 'oz', 'kg'].includes(oldUnit.toLowerCase())) {
    return {
      quantity: quantity * conversion,
      unit: 'kg'
    };
  }
  
  if (['ml', 'cup', 'tbsp', 'tsp', 'l'].includes(oldUnit.toLowerCase())) {
    return {
      quantity: quantity * conversion,
      unit: 'l'
    };
  }
  
  // Default to kg for unknown units
  console.log(`Defaulting unit ${oldUnit} to kg`);
  return { quantity, unit: 'kg' };
}

/**
 * Migrate ingredients to simplified units
 */
async function migrateIngredients() {
  console.log('🔄 Starting ingredient migration...');
  
  try {
    const ingredients = await Ingredient.find({});
    let updatedCount = 0;
    
    for (const ingredient of ingredients) {
      const oldUnit = ingredient.unit;
      const oldQuantity = ingredient.stockQuantity || 0;
      const oldMinStock = ingredient.minStock || 0;
      const oldMaxStock = ingredient.maxStock || 0;
      
      const converted = convertToSimplifiedUnit(oldQuantity, oldUnit);
      const convertedMin = convertToSimplifiedUnit(oldMinStock, oldUnit);
      const convertedMax = convertToSimplifiedUnit(oldMaxStock, oldUnit);
      
      // Update ingredient
      await Ingredient.findByIdAndUpdate(ingredient._id, {
        unit: converted.unit,
        stockQuantity: converted.quantity,
        minStock: convertedMin.quantity,
        maxStock: convertedMax.quantity > 0 ? convertedMax.quantity : null
      });
      
      updatedCount++;
      console.log(`✅ Updated ingredient: ${ingredient.name} (${oldQuantity} ${oldUnit} -> ${converted.quantity.toFixed(3)} ${converted.unit})`);
    }
    
    console.log(`✅ Successfully migrated ${updatedCount} ingredients`);
  } catch (error) {
    console.error('❌ Error migrating ingredients:', error);
    throw error;
  }
}

/**
 * Migrate recipes to simplified units
 */
async function migrateRecipes() {
  console.log('🔄 Starting recipe migration...');
  
  try {
    const recipes = await Recipe.find({});
    let updatedCount = 0;
    
    for (const recipe of recipes) {
      let hasUpdates = false;
      
      // Update recipe ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        for (let ingredient of recipe.ingredients) {
          const oldUnit = ingredient.unit;
          const oldAmount = ingredient.amountUsed || 0;
          
          const converted = convertToSimplifiedUnit(oldAmount, oldUnit);
          
          if (oldUnit !== converted.unit || oldAmount !== converted.quantity) {
            ingredient.unit = converted.unit;
            ingredient.amountUsed = converted.quantity;
            hasUpdates = true;
            console.log(`  📝 Recipe ingredient: ${oldAmount} ${oldUnit} -> ${converted.quantity.toFixed(3)} ${converted.unit}`);
          }
        }
      }
      
      // Update recipe yield unit
      if (recipe.yield && recipe.yield.unit) {
        const oldYieldUnit = recipe.yield.unit;
        const oldYieldQuantity = recipe.yield.quantity || 1;
        
        const convertedYield = convertToSimplifiedUnit(oldYieldQuantity, oldYieldUnit);
        
        if (oldYieldUnit !== convertedYield.unit || oldYieldQuantity !== convertedYield.quantity) {
          recipe.yield.unit = convertedYield.unit;
          recipe.yield.quantity = convertedYield.quantity;
          hasUpdates = true;
        }
      }
      
      if (hasUpdates) {
        await Recipe.findByIdAndUpdate(recipe._id, recipe);
        updatedCount++;
        console.log(`✅ Updated recipe: ${recipe.name}`);
      }
    }
    
    console.log(`✅ Successfully migrated ${updatedCount} recipes`);
  } catch (error) {
    console.error('❌ Error migrating recipes:', error);
    throw error;
  }
}

/**
 * Migrate stock balances to simplified units
 */
async function migrateStockBalances() {
  console.log('🔄 Starting stock balance migration...');
  
  try {
    const stockBalances = await IngredientStockBalance.find({});
    let updatedCount = 0;
    
    for (const balance of stockBalances) {
      const oldUnit = balance.unit;
      const oldQuantity = balance.currentQuantity || 0;
      
      const converted = convertToSimplifiedUnit(oldQuantity, oldUnit);
      
      if (oldUnit !== converted.unit || oldQuantity !== converted.quantity) {
        await IngredientStockBalance.findByIdAndUpdate(balance._id, {
          unit: converted.unit,
          currentQuantity: converted.quantity
        });
        
        updatedCount++;
        console.log(`✅ Updated stock balance: ${oldQuantity} ${oldUnit} -> ${converted.quantity.toFixed(3)} ${converted.unit}`);
      }
    }
    
    console.log(`✅ Successfully migrated ${updatedCount} stock balances`);
  } catch (error) {
    console.error('❌ Error migrating stock balances:', error);
    throw error;
  }
}

/**
 * Migrate stock transactions to simplified units
 */
async function migrateStockTransactions() {
  console.log('🔄 Starting stock transaction migration...');
  
  try {
    const transactions = await IngredientStockTransaction.find({});
    let updatedCount = 0;
    
    for (const transaction of transactions) {
      const oldUnit = transaction.unit;
      const oldQuantity = transaction.quantity || 0;
      const oldPreviousQuantity = transaction.previousQuantity || 0;
      const oldNewQuantity = transaction.newQuantity || 0;
      
      const converted = convertToSimplifiedUnit(Math.abs(oldQuantity), oldUnit);
      const convertedPrevious = convertToSimplifiedUnit(oldPreviousQuantity, oldUnit);
      const convertedNew = convertToSimplifiedUnit(oldNewQuantity, oldUnit);
      
      // Preserve the sign (positive/negative) of the original quantity
      const finalQuantity = oldQuantity < 0 ? -converted.quantity : converted.quantity;
      
      if (oldUnit !== converted.unit) {
        await IngredientStockTransaction.findByIdAndUpdate(transaction._id, {
          unit: converted.unit,
          quantity: finalQuantity,
          previousQuantity: convertedPrevious.quantity,
          newQuantity: convertedNew.quantity
        });
        
        updatedCount++;
        console.log(`✅ Updated transaction: ${oldQuantity} ${oldUnit} -> ${finalQuantity.toFixed(3)} ${converted.unit}`);
      }
    }
    
    console.log(`✅ Successfully migrated ${updatedCount} stock transactions`);
  } catch (error) {
    console.error('❌ Error migrating stock transactions:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function main() {
  try {
    console.log('🚀 Starting unit simplification migration...');
    console.log('📋 Converting all units to kg (weight) and l (volume) only\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plt-retail-store');
    console.log('✅ Connected to MongoDB\n');
    
    // Run all migrations
    await migrateIngredients();
    console.log('');
    
    await migrateRecipes();
    console.log('');
    
    await migrateStockBalances();
    console.log('');
    
    await migrateStockTransactions();
    console.log('');
    
    console.log('🎉 Unit simplification migration completed successfully!');
    console.log('📊 Summary:');
    console.log('   - All weight units (g, mg, lb, oz) converted to kg');
    console.log('   - All volume units (ml, cup, tbsp, tsp) converted to l');
    console.log('   - All count units (piece, pack, box) converted to kg with estimated weights');
    console.log('   - System now uses only kg and l for consistency\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  convertToSimplifiedUnit,
  migrateIngredients,
  migrateRecipes,
  migrateStockBalances,
  migrateStockTransactions
};
