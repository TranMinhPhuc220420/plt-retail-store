const express = require('express');
const router = express.Router();
const costCache = require('../../utils/costCache');
const costUpdateManager = require('../../utils/costUpdateManager');
const websocketManager = require('../../utils/websocketManager');
const { calculateRecipeIngredientCost } = require('../../utils/costCalculation_FIXED');
const Recipe = require('../../models/Recipe');
const Product = require('../../models/Product');
const Ingredient = require('../../models/Ingredient');

/**
 * Cost Analysis API Routes
 * Provides comprehensive cost analysis and management endpoints
 */

/**
 * GET /api/cost-analysis/cache-stats
 * Get current cache statistics
 */
router.get('/cache-stats', async (req, res) => {
  try {
    const cacheStats = costCache.getStats();
    const queueStatus = costUpdateManager.getQueueStatus();
    const wsStats = websocketManager.getStats();

    res.json({
      cache: cacheStats,
      updateQueue: queueStatus,
      websockets: wsStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cost analysis stats:', error);
    res.status(500).json({ error: 'failed_to_get_stats' });
  }
});

/**
 * POST /api/cost-analysis/clear-cache
 * Clear all cost calculation caches
 */
router.post('/clear-cache', async (req, res) => {
  try {
    costCache.clearAll();

    // Broadcast cache clear event
    websocketManager.broadcast({
      type: 'CACHE_CLEARED',
      message: 'All cost calculation caches have been cleared',
      clearedBy: req.user.username
    });

    res.json({
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'failed_to_clear_cache' });
  }
});

/**
 * POST /api/cost-analysis/recalculate-all
 * Trigger recalculation of all recipes and products
 */
router.post('/recalculate-all', async (req, res) => {
  try {
    const { storeId, recipeIds, productIds } = req.body;

    let recipesToUpdate = [];
    let productsToUpdate = [];

    if (recipeIds && Array.isArray(recipeIds)) {
      recipesToUpdate = recipeIds;
    } else {
      // Get all recipes for the store
      const recipes = await Recipe.find({
        storeId: storeId || { $exists: true },
        deleted: false
      }).select('_id dishName');
      recipesToUpdate = recipes.map(r => r._id.toString());
    }

    if (productIds && Array.isArray(productIds)) {
      productsToUpdate = productIds;
    } else {
      // Get all products for the store
      const products = await Product.find({
        storeId: storeId || { $exists: true },
        deleted: false,
        defaultRecipeId: { $exists: true, $ne: null }
      }).select('_id name isComposite');
      productsToUpdate = products.map(p => p._id.toString());
    }

    // Clear caches first
    costCache.clearAll();

    // Queue all updates
    const updateTasks = [
      ...recipesToUpdate.map(id => ({
        type: 'RECIPE_UPDATE',
        id,
        trigger: 'MANUAL_RECALCULATION',
        priority: 1
      })),
      ...productsToUpdate.map(id => ({
        type: 'PRODUCT_UPDATE',
        id,
        trigger: 'MANUAL_RECALCULATION',
        priority: 2
      }))
    ];

    costUpdateManager.queueUpdates(updateTasks);

    // Broadcast recalculation start
    websocketManager.broadcast({
      type: 'MASS_RECALCULATION_STARTED',
      recipesCount: recipesToUpdate.length,
      productsCount: productsToUpdate.length,
      totalTasks: updateTasks.length,
      initiatedBy: req.user.username
    });

    res.json({
      message: 'Mass recalculation initiated',
      recipesQueued: recipesToUpdate.length,
      productsQueued: productsToUpdate.length,
      totalTasks: updateTasks.length,
      queueStatus: costUpdateManager.getQueueStatus()
    });

  } catch (error) {
    console.error('Error initiating mass recalculation:', error);
    res.status(500).json({ error: 'failed_to_initiate_recalculation' });
  }
});

/**
 * GET /api/cost-analysis/cost-trends/:type/:id
 * Get cost trend analysis for recipe/product
 */
router.get('/cost-trends/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { days = 30 } = req.query;

    if (!['recipe', 'product'].includes(type)) {
      return res.status(400).json({ error: 'invalid_type' });
    }

    // For now, return mock data structure
    // In a real implementation, you'd track historical cost data
    const trendData = {
      type,
      id,
      period: `${days} days`,
      currentCost: 0,
      averageCost: 0,
      minCost: 0,
      maxCost: 0,
      trend: 'stable', // 'increasing', 'decreasing', 'stable'
      dataPoints: [],
      factors: [] // What caused cost changes
    };

    if (type === 'recipe') {
      const costData = await calculateRecipeIngredientCost(id);
      trendData.currentCost = costData.costPerUnit;
      trendData.factors = costData.conversionErrors || [];
    }

    res.json(trendData);

  } catch (error) {
    console.error('Error getting cost trends:', error);
    res.status(500).json({ error: 'failed_to_get_cost_trends' });
  }
});

/**
 * GET /api/cost-analysis/profitability-report/:storeId
 * Get comprehensive profitability report
 */
router.get('/profitability-report/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    // Get all products with their recipes
    const products = await Product.find({
      storeId,
      deleted: false
    }).populate('defaultRecipeId').populate('recipes');

    const profitabilityData = [];

    for (const product of products) {
      try {
        const costPrice = parseFloat(product.costPrice?.toString() || 0);
        const retailPrice = parseFloat(product.retailPrice?.toString() || 0);
        const margin = retailPrice - costPrice;
        const marginPercent = costPrice > 0 ? (margin / costPrice) * 100 : 0;

        profitabilityData.push({
          productId: product._id,
          productName: product.name,
          productCode: product.productCode,
          isComposite: product.isComposite,
          costPrice,
          retailPrice,
          margin,
          marginPercent,
          profitabilityRating: marginPercent > 50 ? 'high' : marginPercent > 20 ? 'medium' : 'low'
        });
      } catch (error) {
        console.error(`Error calculating profitability for product ${product._id}:`, error);
      }
    }

    // Sort by margin percentage
    profitabilityData.sort((a, b) => b.marginPercent - a.marginPercent);

    const summary = {
      totalProducts: profitabilityData.length,
      averageMargin: profitabilityData.reduce((sum, p) => sum + p.marginPercent, 0) / profitabilityData.length,
      highProfitProducts: profitabilityData.filter(p => p.profitabilityRating === 'high').length,
      mediumProfitProducts: profitabilityData.filter(p => p.profitabilityRating === 'medium').length,
      lowProfitProducts: profitabilityData.filter(p => p.profitabilityRating === 'low').length
    };

    res.json({
      summary,
      products: profitabilityData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating profitability report:', error);
    res.status(500).json({ error: 'failed_to_generate_profitability_report' });
  }
});

/**
 * GET /api/cost-analysis/ingredient-impact/:ingredientId
 * Analyze the impact of an ingredient across all recipes
 */
router.get('/ingredient-impact/:ingredientId', async (req, res) => {
  try {
    const { ingredientId } = req.params;

    // Get ingredient details
    const ingredient = await Ingredient.findById(ingredientId);
    if (!ingredient) {
      return res.status(404).json({ error: 'ingredient_not_found' });
    }

    // Find all recipes using this ingredient
    const recipes = await Recipe.find({
      'ingredients.ingredientId': ingredientId,
      deleted: false
    }).populate('ingredients.ingredientId', 'name unit');

    const impact = {
      ingredient: {
        id: ingredient._id,
        name: ingredient.name,
        currentCost: parseFloat(ingredient.averageCost?.toString() || ingredient.standardCost?.toString() || 0),
        unit: ingredient.unit
      },
      usage: {
        recipesCount: recipes.length,
        totalUsage: 0, // Total amount used across all recipes
        averageUsage: 0 // Average amount per recipe
      },
      recipes: []
    };

    let totalUsage = 0;

    for (const recipe of recipes) {
      const ingredientUsage = recipe.ingredients.find(
        ing => ing.ingredientId._id.toString() === ingredientId
      );

      if (ingredientUsage) {
        totalUsage += ingredientUsage.amountUsed;

        try {
          const recipeCost = await calculateRecipeIngredientCost(recipe._id);
          const ingredientCostInRecipe = recipeCost.costBreakdown.find(
            cb => cb.ingredientId.toString() === ingredientId
          );

          impact.recipes.push({
            recipeId: recipe._id,
            recipeName: recipe.dishName,
            amountUsed: ingredientUsage.amountUsed,
            unit: ingredientUsage.unit,
            costContribution: ingredientCostInRecipe?.totalCost || 0,
            costPercentage: recipeCost.totalCost > 0 ? 
              ((ingredientCostInRecipe?.totalCost || 0) / recipeCost.totalCost) * 100 : 0
          });
        } catch (error) {
          console.error(`Error calculating cost for recipe ${recipe._id}:`, error);
        }
      }
    }

    impact.usage.totalUsage = totalUsage;
    impact.usage.averageUsage = recipes.length > 0 ? totalUsage / recipes.length : 0;

    // Sort recipes by cost contribution
    impact.recipes.sort((a, b) => b.costContribution - a.costContribution);

    res.json(impact);

  } catch (error) {
    console.error('Error analyzing ingredient impact:', error);
    res.status(500).json({ error: 'failed_to_analyze_ingredient_impact' });
  }
});

module.exports = router;
