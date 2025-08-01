const express = require('express');
const ingredientController = require('../../controllers/ingredientController');
const { validateIngredient } = require('../../middlewares/ingredientInventoryValidation');
const { validateIngredientUnit } = require('../../middlewares/unitValidation');

const router = express.Router();

// GET /api/ingredients - Get all ingredients
// Query parameters: storeCode, category, status, warehouseId
router.get('/', ingredientController.getAll);

// GET /api/ingredients/:id - Get ingredient by ID
// Query parameters: storeCode, includeStock
router.get('/:id', ingredientController.getById);

// GET /api/ingredients/warehouse/:warehouseId - Get ingredients by warehouse ID
// Query parameters: storeCode, includeStock
router.get('/warehouse/:warehouseId', ingredientController.getByWarehouse);

// POST /api/ingredients - Create new ingredient (with enhanced validation)
router.post('/', validateIngredient, validateIngredientUnit, ingredientController.create);

// PUT /api/ingredients/:id - Update ingredient by ID (with enhanced validation)
// Query parameters: storeCode
router.put('/:id', validateIngredient, validateIngredientUnit, ingredientController.update);

// DELETE /api/ingredients/:id - Delete ingredient by ID
// Query parameters: storeCode
router.delete('/:id', ingredientController.delete);

module.exports = router;
