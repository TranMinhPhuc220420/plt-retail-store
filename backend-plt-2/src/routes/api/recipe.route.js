const express = require('express');
const recipeController = require('../../controllers/recipeController');
const { validateRecipeUnits } = require('../../middlewares/unitValidation');

const router = express.Router();

// GET /api/recipes - Get all recipes
router.get('/', recipeController.getAll);

// GET /api/recipes/:id - Get recipe by ID
router.get('/:id', recipeController.getById);

// GET /api/recipes/:id/availability - Check if recipe can be prepared
router.get('/:id/availability', recipeController.checkAvailability);

// POST /api/recipes - Create new recipe (with unit validation)
router.post('/', validateRecipeUnits, recipeController.create);

// PUT /api/recipes/:id - Update recipe by ID (with unit validation)
router.put('/:id', validateRecipeUnits, recipeController.update);

// DELETE /api/recipes/:id - Delete recipe by ID
router.delete('/:id', recipeController.delete);

module.exports = router;
