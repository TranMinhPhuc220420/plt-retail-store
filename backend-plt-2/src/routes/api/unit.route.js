const express = require('express');
const { 
  getAllowedUnits, 
  isUnitAllowed, 
  suggestBetterUnit 
} = require('../../middlewares/unitValidation');
const { 
  convertUnit, 
  areUnitsCompatible, 
  checkIngredientAvailability,
  getRecommendedUnits 
} = require('../../utils/unitConverter');

const router = express.Router();

/**
 * GET /api/units/allowed - Get list of allowed units
 */
router.get('/allowed', (req, res) => {
  try {
    const allowedUnits = getAllowedUnits();
    const recommendedUnits = getRecommendedUnits();
    
    res.status(200).json({
      allowedUnits,
      recommendedUnits,
      message: 'These are the standardized units allowed in the system'
    });
  } catch (error) {
    res.status(500).json({ error: 'failed_to_get_allowed_units' });
  }
});

/**
 * POST /api/units/validate - Validate a unit
 */
router.post('/validate', (req, res) => {
  try {
    const { unit } = req.body;
    
    if (!unit) {
      return res.status(400).json({ error: 'unit_required' });
    }
    
    const isValid = isUnitAllowed(unit);
    
    res.status(200).json({
      unit,
      isValid,
      message: isValid ? 'Unit is valid' : 'Unit is not allowed in the system'
    });
  } catch (error) {
    res.status(500).json({ error: 'failed_to_validate_unit' });
  }
});

/**
 * POST /api/units/convert - Convert between units
 */
router.post('/convert', (req, res) => {
  try {
    const { quantity, fromUnit, toUnit } = req.body;
    
    if (!quantity || !fromUnit || !toUnit) {
      return res.status(400).json({ 
        error: 'missing_parameters',
        message: 'quantity, fromUnit, and toUnit are required'
      });
    }
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ 
        error: 'invalid_quantity',
        message: 'quantity must be a positive number'
      });
    }
    
    const compatible = areUnitsCompatible(fromUnit, toUnit);
    if (!compatible) {
      return res.status(400).json({
        error: 'incompatible_units',
        message: `Cannot convert between ${fromUnit} and ${toUnit} - they are different unit types`
      });
    }
    
    const convertedQuantity = convertUnit(quantity, fromUnit, toUnit);
    
    if (convertedQuantity === null) {
      return res.status(400).json({
        error: 'conversion_failed',
        message: `Failed to convert from ${fromUnit} to ${toUnit}`
      });
    }
    
    res.status(200).json({
      originalQuantity: quantity,
      originalUnit: fromUnit,
      convertedQuantity,
      convertedUnit: toUnit,
      message: `Successfully converted ${quantity} ${fromUnit} to ${convertedQuantity} ${toUnit}`
    });
  } catch (error) {
    res.status(500).json({ error: 'failed_to_convert_units' });
  }
});

/**
 * POST /api/units/check-compatibility - Check if two units are compatible
 */
router.post('/check-compatibility', (req, res) => {
  try {
    const { unit1, unit2 } = req.body;
    
    if (!unit1 || !unit2) {
      return res.status(400).json({ 
        error: 'missing_parameters',
        message: 'unit1 and unit2 are required'
      });
    }
    
    const compatible = areUnitsCompatible(unit1, unit2);
    
    res.status(200).json({
      unit1,
      unit2,
      compatible,
      message: compatible 
        ? `${unit1} and ${unit2} are compatible and can be converted between each other`
        : `${unit1} and ${unit2} are not compatible - they represent different types of measurements`
    });
  } catch (error) {
    res.status(500).json({ error: 'failed_to_check_compatibility' });
  }
});

/**
 * POST /api/units/check-availability - Check ingredient availability with unit conversion
 */
router.post('/check-availability', (req, res) => {
  try {
    const { stockQuantity, stockUnit, requiredQuantity, requiredUnit } = req.body;
    
    if (!stockQuantity || !stockUnit || !requiredQuantity || !requiredUnit) {
      return res.status(400).json({ 
        error: 'missing_parameters',
        message: 'stockQuantity, stockUnit, requiredQuantity, and requiredUnit are required'
      });
    }
    
    if (typeof stockQuantity !== 'number' || typeof requiredQuantity !== 'number') {
      return res.status(400).json({ 
        error: 'invalid_quantities',
        message: 'stockQuantity and requiredQuantity must be numbers'
      });
    }
    
    const result = checkIngredientAvailability(
      stockQuantity, 
      stockUnit, 
      requiredQuantity, 
      requiredUnit
    );
    
    res.status(200).json({
      stockQuantity,
      stockUnit,
      requiredQuantity,
      requiredUnit,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: 'failed_to_check_availability' });
  }
});

/**
 * POST /api/units/suggest - Suggest better unit for a quantity
 */
router.post('/suggest', (req, res) => {
  try {
    const { quantity, unit } = req.body;
    
    if (!quantity || !unit) {
      return res.status(400).json({ 
        error: 'missing_parameters',
        message: 'quantity and unit are required'
      });
    }
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ 
        error: 'invalid_quantity',
        message: 'quantity must be a positive number'
      });
    }
    
    const suggestion = suggestBetterUnit(quantity, unit);
    
    res.status(200).json({
      originalQuantity: quantity,
      originalUnit: unit,
      ...suggestion
    });
  } catch (error) {
    res.status(500).json({ error: 'failed_to_suggest_unit' });
  }
});

module.exports = router;
