import { describe, it, expect } from 'vitest'
import MalaysianTaxCalculator from '../malaysian/taxCalculator'

describe('MalaysianTaxCalculator', () => {
  describe('calculateTaxes', () => {
    it('should calculate SST correctly for taxable items', () => {
      const items = [
        { amount: 100, hasSST: true, hasServiceCharge: false, isExempt: false }
      ]
      
      const result = MalaysianTaxCalculator.calculateTaxes(items)
      
      expect(result.subtotal).toBe(100)
      expect(result.sstAmount).toBe(6) // 6% SST
      expect(result.serviceChargeAmount).toBe(0)
      expect(result.totalBeforeRounding).toBe(106)
      expect(result.roundingAdjustment).toBe(0)
      expect(result.finalTotal).toBe(106)
    })

    it('should calculate service charge correctly', () => {
      const items = [
        { amount: 100, hasSST: false, hasServiceCharge: true, isExempt: false }
      ]
      
      const result = MalaysianTaxCalculator.calculateTaxes(items)
      
      expect(result.subtotal).toBe(100)
      expect(result.sstAmount).toBe(0)
      expect(result.serviceChargeAmount).toBe(10) // 10% service charge
      expect(result.totalBeforeRounding).toBe(110)
      expect(result.finalTotal).toBe(110)
    })

    it('should calculate both SST and service charge', () => {
      const items = [
        { amount: 100, hasSST: true, hasServiceCharge: true, isExempt: false }
      ]
      
      const result = MalaysianTaxCalculator.calculateTaxes(items)
      
      expect(result.subtotal).toBe(100)
      expect(result.serviceChargeAmount).toBe(10) // 10% service charge
      expect(result.sstAmount).toBe(6.6) // 6% SST on (100 + 10)
      expect(result.totalBeforeRounding).toBe(116.6)
      expect(result.finalTotal).toBe(116.6)
    })

    it('should handle exempt items correctly', () => {
      const items = [
        { amount: 100, hasSST: true, hasServiceCharge: true, isExempt: true }
      ]
      
      const result = MalaysianTaxCalculator.calculateTaxes(items)
      
      expect(result.subtotal).toBe(100)
      expect(result.sstAmount).toBe(0)
      expect(result.serviceChargeAmount).toBe(0)
      expect(result.finalTotal).toBe(100)
    })

    it('should handle multiple items correctly', () => {
      const items = [
        { amount: 50, hasSST: true, hasServiceCharge: false, isExempt: false },
        { amount: 30, hasSST: false, hasServiceCharge: true, isExempt: false },
        { amount: 20, hasSST: true, hasServiceCharge: true, isExempt: false }
      ]
      
      const result = MalaysianTaxCalculator.calculateTaxes(items)
      
      expect(result.subtotal).toBe(100)
      expect(result.serviceChargeAmount).toBe(5) // 10% on 30 + 20
      // SST calculation: 6% on (50 + 20 + 2 service charge for item 3) = 6% on 72 = 4.32
      expect(result.sstAmount).toBe(4.32)
      expect(result.totalBeforeRounding).toBe(109.32)
    })
  })

  describe('applyMalaysianRounding', () => {
    it('should round to nearest 5 sen correctly', () => {
      expect(MalaysianTaxCalculator.applyMalaysianRounding(10.01)).toBe(10.00)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(10.02)).toBe(10.00)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(10.03)).toBe(10.05)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(10.04)).toBe(10.05)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(10.05)).toBe(10.05)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(10.06)).toBe(10.05)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(10.07)).toBe(10.05)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(10.08)).toBe(10.10)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(10.09)).toBe(10.10)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(10.10)).toBe(10.10)
    })

    it('should handle edge cases', () => {
      expect(MalaysianTaxCalculator.applyMalaysianRounding(0)).toBe(0)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(0.01)).toBe(0.00)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(0.03)).toBe(0.05)
      expect(MalaysianTaxCalculator.applyMalaysianRounding(999.99)).toBe(1000.00)
    })
  })

  describe('suggestTaxSettings', () => {
    it('should suggest correct tax settings for common Malaysian food items', () => {
      expect(MalaysianTaxCalculator.suggestTaxSettings('Nasi Lemak')).toEqual({
        hasSST: false,
        hasServiceCharge: false,
        reason: 'Basic food items are typically SST-exempt'
      })

      expect(MalaysianTaxCalculator.suggestTaxSettings('Burger')).toEqual({
        hasSST: true,
        hasServiceCharge: false,
        reason: 'Fast food items are typically subject to SST'
      })

      expect(MalaysianTaxCalculator.suggestTaxSettings('Coffee')).toEqual({
        hasSST: true,
        hasServiceCharge: false,
        reason: 'Beverages are typically subject to SST'
      })
    })

    it('should suggest service charge for restaurant items', () => {
      expect(MalaysianTaxCalculator.suggestTaxSettings('Fine Dining')).toEqual({
        hasSST: true,
        hasServiceCharge: true,
        reason: 'Restaurant items typically have both SST and service charge'
      })
    })

    it('should handle unknown items', () => {
      expect(MalaysianTaxCalculator.suggestTaxSettings('Unknown Item')).toEqual({
        hasSST: false,
        hasServiceCharge: false,
        reason: 'Default: no taxes applied'
      })
    })
  })

  describe('formatCurrency', () => {
    it('should format Malaysian Ringgit correctly', () => {
      expect(MalaysianTaxCalculator.formatCurrency(10)).toBe('RM 10.00')
      expect(MalaysianTaxCalculator.formatCurrency(10.5)).toBe('RM 10.50')
      expect(MalaysianTaxCalculator.formatCurrency(1000)).toBe('RM 1,000.00')
      expect(MalaysianTaxCalculator.formatCurrency(1234.56)).toBe('RM 1,234.56')
    })

    it('should handle edge cases', () => {
      expect(MalaysianTaxCalculator.formatCurrency(0)).toBe('RM 0.00')
      expect(MalaysianTaxCalculator.formatCurrency(0.01)).toBe('RM 0.01')
      expect(MalaysianTaxCalculator.formatCurrency(999999.99)).toBe('RM 999,999.99')
    })
  })
})

