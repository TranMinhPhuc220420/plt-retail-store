const express = require('express');
const router = express.Router();
const productController = require('../../controllers/productController');
const recipeController = require('../../controllers/recipeController');
const verifyJWT = require('../../middlewares/verifyJWT');

// Product-Recipe relationship routes
router.post('/products/:productId/recipes/:recipeId', productController.linkRecipeToProduct);
router.delete('/products/:productId/recipes/:recipeId', productController.unlinkRecipeFromProduct);
router.put('/products/:productId/default-recipe/:recipeId', productController.setDefaultRecipe);
router.get('/products/:productId/recipes', productController.getProductWithRecipes);

// Recipe-Product relationship routes
router.post('/recipes/:recipeId/products/:productId', recipeController.linkProductToRecipe);
router.delete('/recipes/:recipeId/products/:productId', recipeController.unlinkProductFromRecipe);
router.get('/recipes/:recipeId/products', recipeController.getRecipeWithProducts);

// Cost calculation routes
router.get('/products/:productId/cost-calculation', productController.calculateProductCost);
router.get('/products/:productId/cost-breakdown', productController.getCostBreakdown);
router.put('/products/:productId/update-pricing', productController.updateProductPricing);

router.get('/recipes/:recipeId/cost-calculation', recipeController.calculateRecipeCost);
router.put('/recipes/:recipeId/update-cost', recipeController.updateRecipeCostCalculation);
router.get('/recipes/with-costs', recipeController.getAllWithCosts);

// Production routes
router.get('/products/:productId/production-feasibility', productController.checkProductionFeasibility);
router.post('/products/:productId/production', productController.createProduction);

module.exports = router;
