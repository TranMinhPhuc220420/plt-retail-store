import { describe, it, expect } from 'vitest'
import { 
  parseDecimal, 
  parseCompositeProductData, 
  formatPrice, 
  formatNumber,
  calculatePercentage,
  formatHoursElapsed,
  isValidPositiveNumber,
  safeDivide
} from '../numberUtils'

describe('numberUtils', () => {
  describe('parseDecimal', () => {
    it('should parse MongoDB Decimal128 format correctly', () => {
      const decimal128Value = { $numberDecimal: '123.45' }
      const result = parseDecimal(decimal128Value)
      expect(result).toBe(123.45)
    })

    it('should parse regular numbers correctly', () => {
      expect(parseDecimal(100)).toBe(100)
      expect(parseDecimal(99.99)).toBe(99.99)
    })

    it('should parse string numbers correctly', () => {
      expect(parseDecimal('200')).toBe(200)
      expect(parseDecimal('150.75')).toBe(150.75)
    })

    it('should return 0 for null or undefined values', () => {
      expect(parseDecimal(null)).toBe(0)
      expect(parseDecimal(undefined)).toBe(0)
    })

    it('should return 0 for invalid string values', () => {
      expect(parseDecimal('invalid')).toBe(0)
      expect(parseDecimal('abc123')).toBe(0)
      expect(parseDecimal('')).toBe(0)
    })

    it('should handle edge cases', () => {
      expect(parseDecimal(0)).toBe(0)
      expect(parseDecimal('0')).toBe(0)
      expect(parseDecimal('0.00')).toBe(0)
    })
  })

  describe('parseCompositeProductData', () => {
    it('should parse composite product data correctly', () => {
      const mockData = {
        _id: 'product123',
        name: 'Test Product',
        price: { $numberDecimal: '100000' },
        retailPrice: { $numberDecimal: '120000' },
        costPrice: { $numberDecimal: '80000' }
      }

      const result = parseCompositeProductData(mockData)
      
      expect(result).toEqual(expect.objectContaining({
        _id: 'product123',
        name: 'Test Product',
        price: 100000,
        retailPrice: 120000,
        costPrice: 80000,
        compositeInfo: {}
      }))
    })

    it('should return null for null input', () => {
      const result = parseCompositeProductData(null)
      expect(result).toBeNull()
    })

    it('should return null for undefined input', () => {
      const result = parseCompositeProductData(undefined)
      expect(result).toBeNull()
    })

    it('should handle empty objects', () => {
      const result = parseCompositeProductData({})
      expect(result).toEqual(expect.objectContaining({
        price: 0,
        retailPrice: 0,
        costPrice: 0,
        compositeInfo: {}
      }))
    })
  })

  describe('formatPrice', () => {
    it('should format price in Vietnamese currency', () => {
      const result = formatPrice(100000)
      expect(result).toContain('100.000')
      expect(result).toContain('₫')
    })

    it('should handle zero values', () => {
      const result = formatPrice(0)
      expect(result).toContain('0')
      expect(result).toContain('₫')
    })

    it('should handle decimal values', () => {
      const result = formatPrice(99.99)
      expect(result).toContain('100')
      expect(result).toContain('₫')
    })

    it('should handle Decimal128 format', () => {
      const decimal128Value = { $numberDecimal: '150000' }
      const result = formatPrice(decimal128Value)
      expect(result).toContain('150.000')
      expect(result).toContain('₫')
    })
  })

  describe('formatNumber', () => {
    it('should format number with thousand separators', () => {
      const result = formatNumber(1234567)
      expect(result).toBe('1.234.567')
    })

    it('should handle zero', () => {
      const result = formatNumber(0)
      expect(result).toBe('0')
    })

    it('should handle decimal numbers', () => {
      const result = formatNumber(1234.56)
      expect(result).toContain('1.234')
    })

    it('should handle Decimal128 format', () => {
      const decimal128Value = { $numberDecimal: '987654' }
      const result = formatNumber(decimal128Value)
      expect(result).toBe('987.654')
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      const result = calculatePercentage(25, 100)
      expect(result).toBe(25)
    })

    it('should handle zero total', () => {
      const result = calculatePercentage(10, 0)
      expect(result).toBe(0)
    })

    it('should round to nearest integer', () => {
      const result = calculatePercentage(1, 3)
      expect(result).toBe(33) // 33.33... rounded to 33
    })

    it('should handle Decimal128 format', () => {
      const value = { $numberDecimal: '75' }
      const total = { $numberDecimal: '300' }
      const result = calculatePercentage(value, total)
      expect(result).toBe(25)
    })
  })

  describe('formatHoursElapsed', () => {
    it('should format minutes for less than 1 hour', () => {
      const result = formatHoursElapsed(0.5)
      expect(result).toBe('30m')
    })

    it('should format hours for less than 24 hours', () => {
      const result = formatHoursElapsed(5)
      expect(result).toBe('5h')
    })

    it('should format days and hours for more than 24 hours', () => {
      const result = formatHoursElapsed(30)
      expect(result).toBe('1d 6h')
    })

    it('should handle exact days', () => {
      const result = formatHoursElapsed(48)
      expect(result).toBe('2d 0h')
    })
  })

  describe('isValidPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isValidPositiveNumber(100)).toBe(true)
      expect(isValidPositiveNumber(0.1)).toBe(true)
      expect(isValidPositiveNumber('50')).toBe(true)
    })

    it('should return false for zero or negative numbers', () => {
      expect(isValidPositiveNumber(0)).toBe(false)
      expect(isValidPositiveNumber(-10)).toBe(false)
      expect(isValidPositiveNumber('-5')).toBe(false)
    })

    it('should return false for invalid values', () => {
      expect(isValidPositiveNumber('invalid')).toBe(false)
      expect(isValidPositiveNumber(null)).toBe(false)
      expect(isValidPositiveNumber(undefined)).toBe(false)
    })

    it('should handle Decimal128 format', () => {
      const positiveDecimal = { $numberDecimal: '100' }
      const zeroDecimal = { $numberDecimal: '0' }
      expect(isValidPositiveNumber(positiveDecimal)).toBe(true)
      expect(isValidPositiveNumber(zeroDecimal)).toBe(false)
    })
  })

  describe('safeDivide', () => {
    it('should divide numbers correctly', () => {
      const result = safeDivide(100, 4)
      expect(result).toBe(25)
    })

    it('should return default value when divisor is zero', () => {
      const result = safeDivide(100, 0, -1)
      expect(result).toBe(-1)
    })

    it('should use 0 as default when no default provided', () => {
      const result = safeDivide(100, 0)
      expect(result).toBe(0)
    })

    it('should handle decimal results', () => {
      const result = safeDivide(10, 3)
      expect(result).toBeCloseTo(3.333, 3)
    })

    it('should handle Decimal128 format', () => {
      const dividend = { $numberDecimal: '150' }
      const divisor = { $numberDecimal: '3' }
      const result = safeDivide(dividend, divisor)
      expect(result).toBe(50)
    })
  })

  describe('business calculations', () => {
    it('should calculate profit margin correctly', () => {
      const cost = 100000
      const selling = 120000
      const margin = calculatePercentage(selling - cost, cost)
      expect(margin).toBe(20)
    })

    it('should calculate discount percentage correctly', () => {
      const original = 200000
      const discounted = 150000
      const discount = calculatePercentage(original - discounted, original)
      expect(discount).toBe(25)
    })

    it('should handle cost analysis', () => {
      const totalCost = { $numberDecimal: '500000' }
      const quantity = { $numberDecimal: '50' }
      const unitCost = safeDivide(totalCost, quantity)
      expect(unitCost).toBe(10000)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle mixed data types', () => {
      const decimal128 = { $numberDecimal: '100' }
      const regularNumber = 50
      const stringNumber = '25'
      
      expect(parseDecimal(decimal128)).toBe(100)
      expect(parseDecimal(regularNumber)).toBe(50)
      expect(parseDecimal(stringNumber)).toBe(25)
    })

    it('should handle very large numbers', () => {
      const largeNumber = 1234567890
      const formatted = formatNumber(largeNumber)
      expect(formatted).toBe('1.234.567.890')
    })

    it('should handle very small numbers', () => {
      const smallNumber = 0.001
      expect(isValidPositiveNumber(smallNumber)).toBe(true)
      expect(parseDecimal(smallNumber)).toBe(0.001)
    })
  })
})
