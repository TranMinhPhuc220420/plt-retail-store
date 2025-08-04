const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const Store = require('../models/Store');
const Product = require('../models/Product');
const { checkIngredientAvailability } = require('../utils/unitConverter');
const { 
  calculateRecipeIngredientCost, 
  updateRecipeCostCalculation 
} = require('../utils/costCalculation');

const recipeController = {
  // Get all recipes with optional filtering by ownerId and storeCode
  getAll: async (req, res) => {
    try {
      const { storeCode } = req.query;
      const ownerId = req.user?._id;
      const filter = { deleted: false };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }
      
      const recipes = await Recipe.find(filter)
        .populate({
          path: 'ingredients.ingredientId',
          select: 'name unit stockQuantity',
          populate: {
            path: 'warehouseId',
            select: 'name'
          }
        })
        .populate('products', 'name productCode costPrice sellingPrice')
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode')
        .sort({ createdAt: -1 });
      res.status(200).json(recipes);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_recipes' });
    }
  },

  // Get recipe by ID with owner and store verification using storeCode
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const { storeCode } = req.query;
      const ownerId = req.user?._id;
      const filter = { _id: id, deleted: false };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }
      
      const recipe = await Recipe.findOne(filter)
        .populate({
          path: 'ingredients.ingredientId',
          select: 'name unit stockQuantity',
          populate: {
            path: 'warehouseId',
            select: 'name address'
          }
        })
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode');
      
      if (!recipe) {
        return res.status(404).json({ error: 'recipe_not_found' });
      }
      
      res.status(200).json(recipe);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_recipe' });
    }
  },

  // Create new recipe with ownerId and storeCode lookup
  create: async (req, res) => {
    try {
      const { dishName, ingredients, description, yield: recipeYield, expiryHours, storeCode } = req.body;
      const ownerId = req.user?._id;
      
      // Look up store by storeCode to get storeId
      let storeId = null;
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        storeId = store._id;
      }
      
      // Validate that all ingredients exist and belong to same owner/store if specified
      const ingredientIds = ingredients.map(ing => ing.ingredientId);
      const ingredientFilter = {
        _id: { $in: ingredientIds },
        deleted: false
      };
      
      // Add owner/store filters if available
      if (ownerId) ingredientFilter.ownerId = ownerId;
      if (storeId) ingredientFilter.storeId = storeId;
      
      const existingIngredients = await Ingredient.find(ingredientFilter);
      
      if (existingIngredients.length !== ingredientIds.length) {
        return res.status(400).json({ error: 'some_ingredients_not_found' });
      }
      
      // Prepare recipe data
      const recipeData = {
        dishName,
        ingredients,
        description,
        ownerId,
        storeId
      };
      
      // Add yield if provided
      if (recipeYield && recipeYield.quantity && recipeYield.unit) {
        recipeData.yield = {
          quantity: parseInt(recipeYield.quantity),
          unit: recipeYield.unit
        };
      }
      
      // Add expiry hours if provided
      if (expiryHours !== undefined) {
        recipeData.expiryHours = parseInt(expiryHours);
      }
      
      const newRecipe = new Recipe(recipeData);
      
      const savedRecipe = await newRecipe.save();
      
      // Populate ingredient details before returning
      await savedRecipe.populate({
        path: 'ingredients.ingredientId',
        select: 'name unit stockQuantity'
      });
      
      res.status(201).json(savedRecipe);
    } catch (error) {
      console.error('Failed to create recipe:', error);
      res.status(500).json({ error: 'failed_to_create_recipe' });
    }
  },

  // Update recipe by ID with owner and store verification using storeCode
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { dishName, ingredients, description, yield: recipeYield, expiryHours, storeCode: queryStoreCode } = req.body;
      const ownerId = req.user?._id;
      const filter = { _id: id, deleted: false };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided in query
      if (queryStoreCode) {
        const store = await Store.findOne({ storeCode: queryStoreCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }
      
      const recipe = await Recipe.findOne(filter);
      if (!recipe) {
        return res.status(404).json({ error: 'recipe_not_found' });
      }
      
      // If updating ingredients, validate they exist and belong to same owner/store
      if (ingredients) {
        const ingredientIds = ingredients.map(ing => ing.ingredientId);
        const ingredientFilter = {
          _id: { $in: ingredientIds },
          deleted: false
        };
        
        // Add owner/store filters based on recipe's current values
        if (recipe.ownerId) ingredientFilter.ownerId = recipe.ownerId;
        if (recipe.storeId) ingredientFilter.storeId = recipe.storeId;
        
        const existingIngredients = await Ingredient.find(ingredientFilter);
        
        if (existingIngredients.length !== ingredientIds.length) {
          return res.status(400).json({ error: 'some_ingredients_not_found' });
        }
      }
      
      // Update fields if provided
      if (dishName !== undefined) recipe.dishName = dishName;
      if (ingredients !== undefined) recipe.ingredients = ingredients;
      if (description !== undefined) recipe.description = description;
      
      // Update yield if provided
      if (recipeYield !== undefined) {
        if (recipeYield && recipeYield.quantity && recipeYield.unit) {
          recipe.yield = {
            quantity: parseInt(recipeYield.quantity),
            unit: recipeYield.unit
          };
        } else {
          // If yield is explicitly set to null/empty, reset to default
          recipe.yield = {
            quantity: 1,
            unit: 'phần'
          };
        }
      }
      
      // Update expiry hours if provided
      if (expiryHours !== undefined) {
        recipe.expiryHours = parseInt(expiryHours);
      }
      
      const updatedRecipe = await recipe.save();
      
      // Populate ingredient details before returning
      await updatedRecipe.populate({
        path: 'ingredients.ingredientId',
        select: 'name unit stockQuantity'
      });
      
      res.status(200).json(updatedRecipe);
    } catch (error) {
      console.error('Failed to update recipe:', error);
      res.status(500).json({ error: 'failed_to_update_recipe' });
    }
  },

  // Soft delete recipe by ID with owner and store verification using storeCode
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { storeCode } = req.query;
      const ownerId = req.user?._id;
      const filter = { _id: id, deleted: false };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }
      
      const recipe = await Recipe.findOne(filter);
      
      if (!recipe) {
        return res.status(404).json({ error: 'recipe_not_found' });
      }
      
      recipe.deleted = true;
      await recipe.save();
      
      res.status(200).json({ message: 'recipe_deleted_successfully' });
    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_recipe' });
    }
  },

  // Check if recipe can be prepared based on ingredient availability with owner and store verification using storeCode
  checkAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { storeCode } = req.query;
      const ownerId = req.user?._id;
      const filter = { _id: id, deleted: false };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }
      
      const recipe = await Recipe.findOne(filter)
        .populate('ingredients.ingredientId', 'name unit stockQuantity');
      
      if (!recipe) {
        return res.status(404).json({ error: 'recipe_not_found' });
      }
      
      const availability = recipe.ingredients.map(recipeIngredient => {
        const ingredient = recipeIngredient.ingredientId;
        
        // Use unit converter to properly check availability
        const availabilityCheck = checkIngredientAvailability(
          ingredient.stockQuantity,
          ingredient.unit,
          recipeIngredient.amountUsed,
          recipeIngredient.unit
        );
        
        return {
          ingredientName: ingredient.name,
          required: recipeIngredient.amountUsed,
          available: ingredient.stockQuantity,
          availableInRequiredUnit: availabilityCheck.stockInRequiredUnit,
          stockUnit: ingredient.unit,
          requiredUnit: recipeIngredient.unit,
          isAvailable: availabilityCheck.isAvailable,
          message: availabilityCheck.message
        };
      });
      
      const canPrepare = availability.every(item => item.isAvailable);
      
      // Filter out items that couldn't be prepared due to unit incompatibility
      const missingIngredients = availability.filter(item => !item.isAvailable);
      
      res.status(200).json({
        canPrepare,
        availability,
        missingIngredients: missingIngredients.map(item => ({
          name: item.ingredientName,
          needed: item.required,
          available: item.availableInRequiredUnit || item.available,
          unit: item.requiredUnit,
          stockUnit: item.stockUnit,
          message: item.message
        }))
      });
    } catch (error) {
      res.status(500).json({ error: 'failed_to_check_recipe_availability' });
    }
  },

  // Link product to recipe
  linkProductToRecipe: async (req, res) => {
    try {
      const { recipeId, productId } = req.params;
      
      const recipe = await Recipe.findOne({ 
        _id: recipeId, 
        ownerId: req.user._id,
        deleted: false 
      });
      
      if (!recipe) {
        return res.status(404).json({ error: 'recipe_not_found' });
      }

      const product = await Product.findOne({ 
        _id: productId, 
        ownerId: req.user._id,
        storeId: recipe.storeId,
        deleted: false 
      });
      
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }

      // Add product to recipe if not already linked
      if (!recipe.products.includes(productId)) {
        await Recipe.findByIdAndUpdate(recipeId, {
          $addToSet: { products: productId }
        });
      }

      // Add recipe to product if not already linked
      if (!product.recipes.includes(recipeId)) {
        const updateProduct = { $addToSet: { recipes: recipeId } };
        
        // Set as default if no default exists
        if (!product.defaultRecipeId) {
          updateProduct.defaultRecipeId = recipeId;
        }
        
        await Product.findByIdAndUpdate(productId, updateProduct);
      }

      const updatedRecipe = await Recipe.findById(recipeId)
        .populate('products', 'name productCode price')
        .populate('ingredients.ingredientId', 'name unit');

      res.status(200).json({
        message: 'product_linked_successfully',
        recipe: updatedRecipe
      });
      
    } catch (error) {
      console.error('Link product error:', error);
      res.status(500).json({ error: 'failed_to_link_product' });
    }
  },

  // Unlink product from recipe
  unlinkProductFromRecipe: async (req, res) => {
    try {
      const { recipeId, productId } = req.params;
      
      const recipe = await Recipe.findOne({ 
        _id: recipeId, 
        ownerId: req.user._id,
        deleted: false 
      });
      
      if (!recipe) {
        return res.status(404).json({ error: 'recipe_not_found' });
      }

      // Remove product from recipe
      await Recipe.findByIdAndUpdate(recipeId, {
        $pull: { products: productId }
      });

      // Remove recipe from product and clear default if needed
      const product = await Product.findById(productId);
      if (product) {
        const updateProduct = { $pull: { recipes: recipeId } };
        
        if (product.defaultRecipeId?.toString() === recipeId) {
          updateProduct.defaultRecipeId = null;
        }
        
        await Product.findByIdAndUpdate(productId, updateProduct);
      }

      const updatedRecipe = await Recipe.findById(recipeId)
        .populate('products', 'name productCode price')
        .populate('ingredients.ingredientId', 'name unit');

      res.status(200).json({
        message: 'product_unlinked_successfully',
        recipe: updatedRecipe
      });
      
    } catch (error) {
      console.error('Unlink product error:', error);
      res.status(500).json({ error: 'failed_to_unlink_product' });
    }
  },

  // Get recipe with products
  getRecipeWithProducts: async (req, res) => {
    try {
      const { recipeId } = req.params;
      
      const recipe = await Recipe.findOne({ 
        _id: recipeId, 
        ownerId: req.user._id,
        deleted: false 
      })
      .populate({
        path: 'products',
        select: 'name productCode price retailPrice costPrice categories',
        populate: {
          path: 'categories',
          select: 'name'
        }
      })
      .populate('ingredients.ingredientId', 'name unit standardCost stockQuantity');

      if (!recipe) {
        return res.status(404).json({ error: 'recipe_not_found' });
      }

      res.status(200).json(recipe);
      
    } catch (error) {
      console.error('Get recipe with products error:', error);
      res.status(500).json({ error: 'failed_to_fetch_recipe_products' });
    }
  },

  // Calculate recipe cost
  calculateRecipeCost: async (req, res) => {
    try {
      const { recipeId } = req.params;
      
      const costCalculation = await calculateRecipeIngredientCost(recipeId);
      res.status(200).json(costCalculation);
      
    } catch (error) {
      console.error('Calculate recipe cost error:', error);
      res.status(500).json({ error: 'failed_to_calculate_recipe_cost' });
    }
  },

  // Update recipe cost calculation
  updateRecipeCostCalculation: async (req, res) => {
    try {
      const { recipeId } = req.params;
      
      const result = await updateRecipeCostCalculation(recipeId);
      
      res.status(200).json({
        message: 'recipe_cost_updated_successfully',
        result
      });
      
    } catch (error) {
      console.error('Update recipe cost error:', error);
      res.status(500).json({ error: 'failed_to_update_recipe_cost' });
    }
  },

  // Get all recipes with cost information
  getAllWithCosts: async (req, res) => {
    try {
      const { storeCode } = req.query;
      const ownerId = req.user?._id;
      const filter = { deleted: false };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }
      
      const recipes = await Recipe.find(filter)
        .populate({
          path: 'ingredients.ingredientId',
          select: 'name unit stockQuantity standardCost averageCost',
          populate: {
            path: 'warehouseId',
            select: 'name'
          }
        })
        .populate('products', 'name productCode price')
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode')
        .sort({ createdAt: -1 });

      // Calculate costs for each recipe
      const recipesWithCosts = await Promise.all(
        recipes.map(async (recipe) => {
          try {
            const costCalculation = await calculateRecipeIngredientCost(recipe._id);
            return {
              ...recipe.toObject(),
              calculatedCost: costCalculation
            };
          } catch (error) {
            return {
              ...recipe.toObject(),
              calculatedCost: {
                totalCost: 0,
                costPerUnit: 0,
                error: error.message
              }
            };
          }
        })
      );

      res.status(200).json(recipesWithCosts);
    } catch (error) {
      console.error('Get all recipes with costs error:', error);
      res.status(500).json({ error: 'failed_to_fetch_recipes_with_costs' });
    }
  }
};

module.exports = recipeController;
