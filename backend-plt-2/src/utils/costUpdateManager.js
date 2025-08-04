const costCache = require('./costCache');
const { calculateRecipeIngredientCost } = require('./costCalculation_FIXED');

/**
 * Real-time Cost Update Manager
 * Handles automatic cost recalculation when dependencies change
 */
class CostUpdateManager {
  constructor() {
    this.updateQueue = [];
    this.isProcessing = false;
    this.websocketClients = new Set(); // For WebSocket support later
  }

  /**
   * Register a WebSocket client for real-time updates
   * @param {WebSocket} ws - WebSocket connection
   */
  registerWebSocketClient(ws) {
    this.websocketClients.add(ws);
    ws.on('close', () => {
      this.websocketClients.delete(ws);
    });
  }

  /**
   * Broadcast cost update to all connected clients
   * @param {Object} updateData - Update information
   */
  broadcastUpdate(updateData) {
    const message = JSON.stringify({
      type: 'COST_UPDATE',
      timestamp: new Date().toISOString(),
      data: updateData
    });

    this.websocketClients.forEach(ws => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        try {
          ws.send(message);
        } catch (error) {
          console.error('Error broadcasting to WebSocket client:', error);
          this.websocketClients.delete(ws);
        }
      }
    });
  }

  /**
   * Handle ingredient cost change
   * @param {string} ingredientId - Changed ingredient ID
   * @param {Object} newCostData - New cost information
   */
  async onIngredientCostChange(ingredientId, newCostData) {
    console.log(`💰 Ingredient cost changed: ${ingredientId}`);
    
    // Invalidate related caches
    costCache.invalidateIngredientRelated(ingredientId);

    // Find all recipes that use this ingredient
    const Recipe = require('../models/Recipe');
    const affectedRecipes = await Recipe.find({
      'ingredients.ingredientId': ingredientId,
      deleted: false
    }).select('_id dishName');

    // Queue updates for affected recipes
    const updateTasks = affectedRecipes.map(recipe => ({
      type: 'RECIPE_UPDATE',
      id: recipe._id.toString(),
      name: recipe.dishName,
      trigger: 'INGREDIENT_CHANGE',
      triggerId: ingredientId,
      priority: 1
    }));

    this.queueUpdates(updateTasks);

    // Broadcast immediate notification
    this.broadcastUpdate({
      type: 'INGREDIENT_COST_CHANGED',
      ingredientId,
      newCostData,
      affectedRecipes: affectedRecipes.length
    });
  }

  /**
   * Handle recipe cost change
   * @param {string} recipeId - Changed recipe ID
   * @param {Object} newCostData - New cost information
   */
  async onRecipeCostChange(recipeId, newCostData) {
    console.log(`🍳 Recipe cost changed: ${recipeId}`);
    
    // Invalidate related caches
    costCache.invalidateRecipeRelated(recipeId);

    // Find all products that use this recipe
    const Product = require('../models/Product');
    const affectedProducts = await Product.find({
      $or: [
        { defaultRecipeId: recipeId },
        { recipes: recipeId }
      ],
      deleted: false
    }).select('_id name isComposite');

    // Queue updates for affected products
    const updateTasks = affectedProducts.map(product => ({
      type: product.isComposite ? 'COMPOSITE_UPDATE' : 'PRODUCT_UPDATE',
      id: product._id.toString(),
      name: product.name,
      trigger: 'RECIPE_CHANGE',
      triggerId: recipeId,
      priority: 2
    }));

    this.queueUpdates(updateTasks);

    // Broadcast notification
    this.broadcastUpdate({
      type: 'RECIPE_COST_CHANGED',
      recipeId,
      newCostData,
      affectedProducts: affectedProducts.length
    });
  }

  /**
   * Handle product cost change
   * @param {string} productId - Changed product ID
   * @param {Object} newCostData - New cost information
   */
  async onProductCostChange(productId, newCostData) {
    console.log(`📦 Product cost changed: ${productId}`);
    
    // Invalidate related caches
    costCache.invalidateProductRelated(productId);

    // Find all composite products that use this product
    const Product = require('../models/Product');
    const affectedComposites = await Product.find({
      isComposite: true,
      'compositeInfo.childProducts.productId': productId,
      deleted: false
    }).select('_id name');

    // Queue updates for affected composites
    const updateTasks = affectedComposites.map(composite => ({
      type: 'COMPOSITE_UPDATE',
      id: composite._id.toString(),
      name: composite.name,
      trigger: 'PRODUCT_CHANGE',
      triggerId: productId,
      priority: 3
    }));

    this.queueUpdates(updateTasks);

    // Broadcast notification
    this.broadcastUpdate({
      type: 'PRODUCT_COST_CHANGED',
      productId,
      newCostData,
      affectedComposites: affectedComposites.length
    });
  }

  /**
   * Queue multiple update tasks
   * @param {Array} tasks - Array of update tasks
   */
  queueUpdates(tasks) {
    this.updateQueue.push(...tasks);
    this.updateQueue.sort((a, b) => a.priority - b.priority); // Sort by priority
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the update queue
   */
  async processQueue() {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing ${this.updateQueue.length} cost updates...`);

    while (this.updateQueue.length > 0) {
      const task = this.updateQueue.shift();
      
      try {
        await this.processUpdateTask(task);
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`❌ Error processing update task:`, task, error);
        
        // Broadcast error to clients
        this.broadcastUpdate({
          type: 'UPDATE_ERROR',
          task,
          error: error.message
        });
      }
    }

    this.isProcessing = false;
    console.log('✅ Finished processing cost updates');
  }

  /**
   * Process individual update task
   * @param {Object} task - Update task
   */
  async processUpdateTask(task) {
    const { type, id, name } = task;

    switch (type) {
      case 'RECIPE_UPDATE':
        await this.updateRecipeCost(id);
        break;
        
      case 'PRODUCT_UPDATE':
        await this.updateProductCost(id);
        break;
        
      case 'COMPOSITE_UPDATE':
        await this.updateCompositeCost(id);
        break;
        
      default:
        console.warn(`Unknown update task type: ${type}`);
    }

    console.log(`✅ Updated ${type}: ${name} (${id})`);
  }

  /**
   * Update recipe cost
   * @param {string} recipeId - Recipe ID
   */
  async updateRecipeCost(recipeId) {
    const Recipe = require('../models/Recipe');
    const mongoose = require('mongoose');

    // Recalculate cost (bypass cache)
    const newCost = await calculateRecipeIngredientCost(recipeId, false);
    
    // Update recipe in database
    await Recipe.findByIdAndUpdate(recipeId, {
      costPerUnit: mongoose.Types.Decimal128.fromString(newCost.costPerUnit.toString())
    });

    // Broadcast update
    this.broadcastUpdate({
      type: 'RECIPE_COST_UPDATED',
      recipeId,
      newCost: newCost.costPerUnit,
      totalCost: newCost.totalCost
    });

    // Trigger dependent updates
    await this.onRecipeCostChange(recipeId, newCost);
  }

  /**
   * Update product cost
   * @param {string} productId - Product ID
   */
  async updateProductCost(productId) {
    const Product = require('../models/Product');
    const { calculateProductCostFromRecipe } = require('./costCalculation_FIXED');
    const mongoose = require('mongoose');

    try {
      // Recalculate cost based on default recipe
      const newCost = await calculateProductCostFromRecipe(productId);
      
      // Update product in database
      await Product.findByIdAndUpdate(productId, {
        costPrice: mongoose.Types.Decimal128.fromString(newCost.suggestedCostPrice.toString())
      });

      // Broadcast update
      this.broadcastUpdate({
        type: 'PRODUCT_COST_UPDATED',
        productId,
        newCostPrice: newCost.suggestedCostPrice
      });

      // Trigger dependent updates
      await this.onProductCostChange(productId, newCost);
      
    } catch (error) {
      console.error(`Error updating product cost ${productId}:`, error);
    }
  }

  /**
   * Update composite product cost
   * @param {string} compositeId - Composite product ID
   */
  async updateCompositeCost(compositeId) {
    const Product = require('../models/Product');
    const mongoose = require('mongoose');

    try {
      // Get composite product with child products
      const composite = await Product.findById(compositeId)
        .populate('compositeInfo.childProducts.productId', 'costPrice');

      if (!composite || !composite.isComposite) {
        throw new Error('Composite product not found');
      }

      // Recalculate composite cost
      let totalCostPerServing = 0;
      for (const childProduct of composite.compositeInfo.childProducts) {
        const product = childProduct.productId;
        if (product) {
          const costPrice = parseFloat(product.costPrice?.toString() || 0);
          totalCostPerServing += costPrice * childProduct.quantityPerServing;
        }
      }

      // Update composite pricing
      const updates = {
        costPrice: mongoose.Types.Decimal128.fromString(totalCostPerServing.toString()),
        price: mongoose.Types.Decimal128.fromString((totalCostPerServing * 1.3).toString()),
        retailPrice: mongoose.Types.Decimal128.fromString((totalCostPerServing * 1.5).toString())
      };

      await Product.findByIdAndUpdate(compositeId, updates);

      // Broadcast update
      this.broadcastUpdate({
        type: 'COMPOSITE_COST_UPDATED',
        compositeId,
        newCostPrice: totalCostPerServing,
        newPrice: totalCostPerServing * 1.3,
        newRetailPrice: totalCostPerServing * 1.5
      });

    } catch (error) {
      console.error(`Error updating composite cost ${compositeId}:`, error);
    }
  }

  /**
   * Get current queue status
   * @returns {Object} Queue status
   */
  getQueueStatus() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.updateQueue.length,
      connectedClients: this.websocketClients.size
    };
  }
}

// Export singleton instance
module.exports = new CostUpdateManager();
