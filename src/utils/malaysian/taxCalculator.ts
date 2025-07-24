// Enhanced Malaysian Tax Calculator
// Handles SST (6%), Service Charge (10%), and Malaysian Ringgit rounding

export interface TaxBreakdown {
  subtotal: number
  serviceCharge: number
  sstAmount: number
  total: number
  roundingAdjustment: number
}

export interface TaxableItem {
  amount: number
  hasSST: boolean
  hasServiceCharge: boolean
  isExempt: boolean
}

export interface TaxSuggestion {
  hasSST: boolean
  hasServiceCharge: boolean
  reason: string
}

export class MalaysianTaxCalculator {
  private static readonly SST_RATE = 0.06 // 6%
  private static readonly SERVICE_CHARGE_RATE = 0.10 // 10%
  
  /**
   * Calculate Malaysian taxes with proper rounding
   */
  static calculateTaxes(items: TaxableItem[]): {
    subtotal: number
    serviceChargeAmount: number
    sstAmount: number
    totalBeforeRounding: number
    roundingAdjustment: number
    finalTotal: number
  } {
    let subtotal = 0
    let serviceChargeBase = 0
    let sstBase = 0
    
    // Calculate base amounts
    for (const item of items) {
      if (item.isExempt) {
        subtotal += item.amount
        continue
      }
      
      subtotal += item.amount
      
      if (item.hasServiceCharge) {
        serviceChargeBase += item.amount
      }
      
      if (item.hasSST) {
        sstBase += item.amount
      }
    }
    
    // Calculate service charge (applied before SST)
    const serviceChargeAmount = this.roundToSen(serviceChargeBase * this.SERVICE_CHARGE_RATE)
    
    // SST is applied only on items that have SST, including their service charge portion
    let sstAmount = 0
    for (const item of items) {
      if (!item.isExempt && item.hasSST) {
        const itemServiceCharge = item.hasServiceCharge ? item.amount * this.SERVICE_CHARGE_RATE : 0
        sstAmount += (item.amount + itemServiceCharge) * this.SST_RATE
      }
    }
    sstAmount = this.roundToSen(sstAmount)
    
    // Calculate total before final rounding
    const totalBeforeRounding = subtotal + serviceChargeAmount + sstAmount
    
    // Apply Malaysian rounding rules (round to nearest 5 sen)
    const finalTotal = this.applyMalaysianRounding(totalBeforeRounding)
    const roundingAdjustment = finalTotal - totalBeforeRounding
    
    return {
      subtotal: this.roundToSen(subtotal),
      serviceChargeAmount,
      sstAmount,
      totalBeforeRounding,
      roundingAdjustment: this.roundToSen(roundingAdjustment),
      finalTotal
    }
  }
  
  /**
   * Round to nearest sen (0.01)
   */
  private static roundToSen(amount: number): number {
    return Math.round(amount * 100) / 100
  }
  
  /**
   * Apply Malaysian rounding rules (round to nearest 5 sen)
   */
  static applyMalaysianRounding(amount: number): number {
    const cents = Math.round(amount * 100)
    const lastDigit = cents % 10
    
    let roundedCents: number
    if (lastDigit <= 2) {
      roundedCents = cents - lastDigit
    } else if (lastDigit <= 7) {
      roundedCents = cents - lastDigit + 5
    } else {
      roundedCents = cents - lastDigit + 10
    }
    
    return roundedCents / 100
  }
  
  /**
   * Format currency in Malaysian Ringgit
   */
  static formatCurrency(amount: number): string {
    return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }
  
  /**
   * Get tax breakdown for a single item
   */
  static calculateItemTax(amount: number, hasSST: boolean, hasServiceCharge: boolean = false): TaxBreakdown {
    const result = this.calculateTaxes([{
      amount,
      hasSST,
      hasServiceCharge,
      isExempt: false
    }])
    
    return {
      subtotal: result.subtotal,
      serviceCharge: result.serviceChargeAmount,
      sstAmount: result.sstAmount,
      total: result.finalTotal,
      roundingAdjustment: result.roundingAdjustment
    }
  }
  
  /**
   * Common Malaysian food items and their typical tax status
   */
  static readonly COMMON_ITEMS = {
    // Tax-exempt items
    'rice': { hasSST: false, hasServiceCharge: false, reason: 'Basic food items are typically SST-exempt' },
    'nasi lemak': { hasSST: false, hasServiceCharge: false, reason: 'Basic food items are typically SST-exempt' },
    'roti canai': { hasSST: false, hasServiceCharge: false, reason: 'Basic food items are typically SST-exempt' },
    'teh tarik': { hasSST: false, hasServiceCharge: false, reason: 'Basic food items are typically SST-exempt' },
    'kopi': { hasSST: false, hasServiceCharge: false, reason: 'Basic food items are typically SST-exempt' },
    
    // SST applicable items
    'burger': { hasSST: true, hasServiceCharge: false, reason: 'Fast food items are typically subject to SST' },
    'pizza': { hasSST: true, hasServiceCharge: false, reason: 'Fast food items are typically subject to SST' },
    'coffee': { hasSST: true, hasServiceCharge: false, reason: 'Beverages are typically subject to SST' },
    'western food': { hasSST: true, hasServiceCharge: false, reason: 'Fast food items are typically subject to SST' },
    
    // Service charge applicable (restaurants)
    'fine dining': { hasSST: true, hasServiceCharge: true, reason: 'Restaurant items typically have both SST and service charge' },
    'hotel restaurant': { hasSST: true, hasServiceCharge: true, reason: 'Restaurant items typically have both SST and service charge' }
  }
  
  /**
   * Suggest tax settings based on item name
   */
  static suggestTaxSettings(itemName: string): TaxSuggestion {
    const name = itemName.toLowerCase().trim()
    
    // Check exact matches first
    if (this.COMMON_ITEMS[name]) {
      return this.COMMON_ITEMS[name]
    }
    
    // Check partial matches
    for (const [key, value] of Object.entries(this.COMMON_ITEMS)) {
      if (name.includes(key) || key.includes(name)) {
        return value
      }
    }
    
    // Default: no tax for local food, SST for others
    const localFoodKeywords = ['nasi', 'mee', 'char', 'wan tan', 'laksa', 'cendol', 'abc', 'teh', 'kopi']
    const hasLocalKeyword = localFoodKeywords.some(keyword => name.includes(keyword))
    
    return {
      hasSST: false,
      hasServiceCharge: false,
      reason: 'Default: no taxes applied'
    }
  }
}

export default MalaysianTaxCalculator
