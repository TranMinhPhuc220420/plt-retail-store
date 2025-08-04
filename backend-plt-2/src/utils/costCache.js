const NodeCache = require('node-cache');

/**
 * Cost Calculation Cache Manager
 * Caches frequently accessed cost calculations to improve performance
 */
class CostCache {
  constructor() {
    // Cache for 5 minutes (300 seconds) by default
    this.recipeCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
    this.productCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
    this.compositeCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
    this.ingredientCache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // Longer cache for ingredients
  }

  /**
   * Get cached recipe cost calculation
   * @param {string} recipeId - Recipe ID
   * @returns {Object|null} Cached cost data or null
   */
  getRecipeCost(recipeId) {
    const key = `recipe_cost_${recipeId}`;
    const cached = this.recipeCache.get(key);
    if (cached) {
      console.log(`📦 Cache HIT for recipe cost: ${recipeId}`);
      return cached;
    }
    console.log(`🔍 Cache MISS for recipe cost: ${recipeId}`);
    return null;
  }

  /**
   * Cache recipe cost calculation
   * @param {string} recipeId - Recipe ID
   * @param {Object} costData - Cost calculation result
   */
  setRecipeCost(recipeId, costData) {
    const key = `recipe_cost_${recipeId}`;
    this.recipeCache.set(key, {
      ...costData,
      cachedAt: new Date(),
      cacheSource: 'recipe_calculation'
    });
    console.log(`💾 Cached recipe cost: ${recipeId}`);
  }

  /**
   * Get cached product cost calculation
   * @param {string} productId - Product ID
   * @param {string} recipeId - Optional recipe ID
   * @returns {Object|null} Cached cost data or null
   */
  getProductCost(productId, recipeId = null) {
    const key = `product_cost_${productId}_${recipeId || 'default'}`;
    const cached = this.productCache.get(key);
    if (cached) {
      console.log(`📦 Cache HIT for product cost: ${productId}`);
      return cached;
    }
    console.log(`🔍 Cache MISS for product cost: ${productId}`);
    return null;
  }

  /**
   * Cache product cost calculation
   * @param {string} productId - Product ID
   * @param {Object} costData - Cost calculation result
   * @param {string} recipeId - Optional recipe ID
   */
  setProductCost(productId, costData, recipeId = null) {
    const key = `product_cost_${productId}_${recipeId || 'default'}`;
    this.productCache.set(key, {
      ...costData,
      cachedAt: new Date(),
      cacheSource: 'product_calculation'
    });
    console.log(`💾 Cached product cost: ${productId}`);
  }

  /**
   * Get cached composite product cost
   * @param {string} compositeId - Composite product ID
   * @returns {Object|null} Cached cost data or null
   */
  getCompositeCost(compositeId) {
    const key = `composite_cost_${compositeId}`;
    const cached = this.compositeCache.get(key);
    if (cached) {
      console.log(`📦 Cache HIT for composite cost: ${compositeId}`);
      return cached;
    }
    console.log(`🔍 Cache MISS for composite cost: ${compositeId}`);
    return null;
  }

  /**
   * Cache composite product cost
   * @param {string} compositeId - Composite product ID
   * @param {Object} costData - Cost calculation result
   */
  setCompositeCost(compositeId, costData) {
    const key = `composite_cost_${compositeId}`;
    this.compositeCache.set(key, {
      ...costData,
      cachedAt: new Date(),
      cacheSource: 'composite_calculation'
    });
    console.log(`💾 Cached composite cost: ${compositeId}`);
  }

  /**
   * Get cached ingredient cost data
   * @param {string} ingredientId - Ingredient ID
   * @returns {Object|null} Cached ingredient data or null
   */
  getIngredientCost(ingredientId) {
    const key = `ingredient_cost_${ingredientId}`;
    const cached = this.ingredientCache.get(key);
    if (cached) {
      console.log(`📦 Cache HIT for ingredient cost: ${ingredientId}`);
      return cached;
    }
    return null;
  }

  /**
   * Cache ingredient cost data
   * @param {string} ingredientId - Ingredient ID
   * @param {Object} ingredientData - Ingredient cost data
   */
  setIngredientCost(ingredientId, ingredientData) {
    const key = `ingredient_cost_${ingredientId}`;
    this.ingredientCache.set(key, {
      ...ingredientData,
      cachedAt: new Date(),
      cacheSource: 'ingredient_data'
    });
    console.log(`💾 Cached ingredient cost: ${ingredientId}`);
  }

  /**
   * Invalidate cache when ingredient costs change
   * @param {string} ingredientId - Ingredient ID that changed
   */
  invalidateIngredientRelated(ingredientId) {
    // Clear ingredient cache
    const ingredientKey = `ingredient_cost_${ingredientId}`;
    this.ingredientCache.del(ingredientKey);

    // Clear all recipe and product caches since they might be affected
    this.recipeCache.flushAll();
    this.productCache.flushAll();
    this.compositeCache.flushAll();

    console.log(`🗑️  Invalidated all caches due to ingredient change: ${ingredientId}`);
  }

  /**
   * Invalidate cache when recipe changes
   * @param {string} recipeId - Recipe ID that changed
   */
  invalidateRecipeRelated(recipeId) {
    // Clear specific recipe cache
    const recipeKey = `recipe_cost_${recipeId}`;
    this.recipeCache.del(recipeKey);

    // Clear all product and composite caches that might use this recipe
    this.productCache.flushAll();
    this.compositeCache.flushAll();

    console.log(`🗑️  Invalidated recipe-related caches: ${recipeId}`);
  }

  /**
   * Invalidate cache when product changes
   * @param {string} productId - Product ID that changed
   */
  invalidateProductRelated(productId) {
    // Clear specific product caches
    const keys = this.productCache.keys();
    keys.forEach(key => {
      if (key.startsWith(`product_cost_${productId}_`)) {
        this.productCache.del(key);
      }
    });

    // Clear composite caches that might use this product
    this.compositeCache.flushAll();

    console.log(`🗑️  Invalidated product-related caches: ${productId}`);
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      recipe: {
        keys: this.recipeCache.keys().length,
        hits: this.recipeCache.getStats().hits,
        misses: this.recipeCache.getStats().misses
      },
      product: {
        keys: this.productCache.keys().length,
        hits: this.productCache.getStats().hits,
        misses: this.productCache.getStats().misses
      },
      composite: {
        keys: this.compositeCache.keys().length,
        hits: this.compositeCache.getStats().hits,
        misses: this.compositeCache.getStats().misses
      },
      ingredient: {
        keys: this.ingredientCache.keys().length,
        hits: this.ingredientCache.getStats().hits,
        misses: this.ingredientCache.getStats().misses
      }
    };
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.recipeCache.flushAll();
    this.productCache.flushAll();
    this.compositeCache.flushAll();
    this.ingredientCache.flushAll();
    console.log('🗑️  Cleared all caches');
  }
}

// Export singleton instance
module.exports = new CostCache();
