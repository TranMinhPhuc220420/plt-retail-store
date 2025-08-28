const {
  calculateRecipeIngredientCost,
  calculateProductCostFromRecipe,
  getCostBreakdown,
  updateProductPricingBasedOnCost
} = require('../../utils/costCalculation');
const Recipe = require('../../models/Recipe');
const Product = require('../../models/Product');
const Ingredient = require('../../models/Ingredient');

// Mock dependencies
jest.mock('../../models/Recipe');
jest.mock('../../models/Product');
jest.mock('../../models/Ingredient');

describe('Cost Calculation Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateRecipeIngredientCost', () => {
    it('should calculate total cost for a recipe with ingredients', async () => {
      const mockRecipe = {
        _id: 'recipe123',
        ingredients: [
          {
            ingredientId: {
              _id: 'ingredient1',
              name: 'Chicken Breast',
              standardCost: 15.00,
              averageCost: 14.50,
              unit: 'kg'
            },
            amountUsed: 2,
            unit: 'kg'
          },
          {
            ingredientId: {
              _id: 'ingredient2',
              name: 'Rice',
              standardCost: 3.00,
              unit: 'kg'
            },
            amountUsed: 1.5,
            unit: 'kg'
          }
        ],
        yield: { quantity: 4, unit: 'portions' }
      };

      const mockFind = {
        populate: jest.fn().mockResolvedValue(mockRecipe)
      };
      Recipe.findById.mockReturnValue(mockFind);

      const result = await calculateRecipeIngredientCost('recipe123');

      expect(Recipe.findById).toHaveBeenCalledWith('recipe123');
      expect(result.totalCost).toBe(33.5); // (14.50 * 2) + (3.00 * 1.5)
      expect(result.costPerUnit).toBe(8.375); // 33.5 / 4
      expect(result.costBreakdown).toHaveLength(2);
      expect(result.costBreakdown[0].ingredientName).toBe('Chicken Breast');
      expect(result.costBreakdown[0].totalCost).toBe(29); // 14.50 * 2
      expect(result.costBreakdown[1].totalCost).toBe(4.5); // 3.00 * 1.5
    });

    it('should handle recipe with no ingredients', async () => {
      const mockRecipe = {
        _id: 'recipe123',
        ingredients: [],
        yield: { quantity: 1, unit: 'portion' }
      };

      const mockFind = {
        populate: jest.fn().mockResolvedValue(mockRecipe)
      };
      Recipe.findById.mockReturnValue(mockFind);

      const result = await calculateRecipeIngredientCost('recipe123');

      expect(result.totalCost).toBe(0);
      expect(result.costPerUnit).toBe(0);
      expect(result.costBreakdown).toHaveLength(0);
    });

    it('should handle missing recipe', async () => {
      const mockFind = {
        populate: jest.fn().mockResolvedValue(null)
      };
      Recipe.findById.mockReturnValue(mockFind);

      await expect(calculateRecipeIngredientCost('invalid123')).rejects.toThrow('Recipe not found');
    });

    it('should skip ingredients with missing data', async () => {
      const mockRecipe = {
        _id: 'recipe123',
        ingredients: [
          {
            ingredientId: {
              _id: 'ingredient1',
              name: 'Valid Ingredient',
              standardCost: 10.00,
              unit: 'kg'
            },
            amountUsed: 1,
            unit: 'kg'
          },
          {
            ingredientId: null // Missing ingredient
          }
        ],
        yield: { quantity: 2, unit: 'portions' }
      };

      const mockFind = {
        populate: jest.fn().mockResolvedValue(mockRecipe)
      };
      Recipe.findById.mockReturnValue(mockFind);

      const result = await calculateRecipeIngredientCost('recipe123');

      expect(result.totalCost).toBe(10);
      expect(result.costBreakdown).toHaveLength(1);
    });

    it('should use averageCost when available, fallback to standardCost', async () => {
      const mockRecipe = {
        _id: 'recipe123',
        ingredients: [
          {
            ingredientId: {
              _id: 'ingredient1',
              name: 'Ingredient with Average',
              standardCost: 10.00,
              averageCost: 12.00,
              unit: 'kg'
            },
            amountUsed: 1,
            unit: 'kg'
          },
          {
            ingredientId: {
              _id: 'ingredient2',
              name: 'Ingredient without Average',
              standardCost: 8.00,
              unit: 'kg'
            },
            amountUsed: 1,
            unit: 'kg'
          }
        ],
        yield: { quantity: 1, unit: 'portion' }
      };

      const mockFind = {
        populate: jest.fn().mockResolvedValue(mockRecipe)
      };
      Recipe.findById.mockReturnValue(mockFind);

      const result = await calculateRecipeIngredientCost('recipe123');

      expect(result.totalCost).toBe(20); // 12.00 + 8.00
      expect(result.costBreakdown[0].unitCost).toBe(12); // Uses averageCost
      expect(result.costBreakdown[1].unitCost).toBe(8); // Uses standardCost
    });

    it('should handle zero costs gracefully', async () => {
      const mockRecipe = {
        _id: 'recipe123',
        ingredients: [
          {
            ingredientId: {
              _id: 'ingredient1',
              name: 'Free Ingredient',
              standardCost: 0,
              unit: 'kg'
            },
            amountUsed: 5,
            unit: 'kg'
          }
        ],
        yield: { quantity: 1, unit: 'portion' }
      };

      const mockFind = {
        populate: jest.fn().mockResolvedValue(mockRecipe)
      };
      Recipe.findById.mockReturnValue(mockFind);

      const result = await calculateRecipeIngredientCost('recipe123');

      expect(result.totalCost).toBe(0);
      expect(result.costPerUnit).toBe(0);
    });

    it('should handle decimal calculations correctly', async () => {
      const mockRecipe = {
        _id: 'recipe123',
        ingredients: [
          {
            ingredientId: {
              _id: 'ingredient1',
              name: 'Expensive Spice',
              standardCost: 25.333,
              unit: 'kg'
            },
            amountUsed: 0.15,
            unit: 'kg'
          }
        ],
        yield: { quantity: 3, unit: 'portions' }
      };

      const mockFind = {
        populate: jest.fn().mockResolvedValue(mockRecipe)
      };
      Recipe.findById.mockReturnValue(mockFind);

      const result = await calculateRecipeIngredientCost('recipe123');

      expect(result.totalCost).toBeCloseTo(3.79995, 4); // 25.333 * 0.15
      expect(result.costPerUnit).toBeCloseTo(1.26665, 4); // 3.79995 / 3
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very large numbers', async () => {
      const mockRecipe = {
        _id: 'recipe123',
        ingredients: [
          {
            ingredientId: {
              _id: 'ingredient1',
              name: 'Expensive Ingredient',
              standardCost: 999999.99
            },
            amountUsed: 100,
            unit: 'kg'
          }
        ],
        yield: { quantity: 1, unit: 'portion' }
      };

      const mockFind = {
        populate: jest.fn().mockResolvedValue(mockRecipe)
      };
      Recipe.findById.mockReturnValue(mockFind);

      const result = await calculateRecipeIngredientCost('recipe123');

      expect(result.totalCost).toBe(99999999);
      expect(result.costPerUnit).toBe(99999999);
    });

    it('should handle very small numbers', async () => {
      const mockRecipe = {
        _id: 'recipe123',
        ingredients: [
          {
            ingredientId: {
              _id: 'ingredient1',
              name: 'Trace Ingredient',
              standardCost: 0.001
            },
            amountUsed: 0.5,
            unit: 'gram'
          }
        ],
        yield: { quantity: 1000, unit: 'portions' }
      };

      const mockFind = {
        populate: jest.fn().mockResolvedValue(mockRecipe)
      };
      Recipe.findById.mockReturnValue(mockFind);

      const result = await calculateRecipeIngredientCost('recipe123');

      expect(result.totalCost).toBe(0.0005);
      expect(result.costPerUnit).toBeCloseTo(0.0000005, 7);
    });

    it('should handle missing yield gracefully', async () => {
      const mockRecipe = {
        _id: 'recipe123',
        ingredients: [
          {
            ingredientId: {
              _id: 'ingredient1',
              name: 'Test Ingredient',
              standardCost: 10.00
            },
            amountUsed: 2,
            unit: 'kg'
          }
        ]
        // No yield property
      };

      const mockFind = {
        populate: jest.fn().mockResolvedValue(mockRecipe)
      };
      Recipe.findById.mockReturnValue(mockFind);

      const result = await calculateRecipeIngredientCost('recipe123');

      expect(result.totalCost).toBe(20);
      expect(result.costPerUnit).toBe(20); // Defaults to dividing by 1
    });
  });
});