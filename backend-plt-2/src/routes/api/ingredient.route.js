const express = require('express');
const ingredientController = require('../../controllers/ingredientController');

const router = express.Router();

// GET /api/ingredients - Get all ingredients
router.get('/', ingredientController.getAll);

// GET /api/ingredients/:id - Get ingredient by ID
router.get('/:id', ingredientController.getById);

// GET /api/ingredients/warehouse/:warehouseId - Get ingredients by warehouse ID
router.get('/warehouse/:warehouseId', ingredientController.getByWarehouse);

// POST /api/ingredients - Create new ingredient
router.post('/', ingredientController.create);

// PUT /api/ingredients/:id - Update ingredient by ID
router.put('/:id', ingredientController.update);

// DELETE /api/ingredients/:id - Delete ingredient by ID
router.delete('/:id', ingredientController.delete);

module.exports = router;
