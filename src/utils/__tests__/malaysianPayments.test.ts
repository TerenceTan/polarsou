import { describe, it, expect } from 'vitest'
import MalaysianPaymentService from '../payment/malaysianPayments'

describe('MalaysianPaymentService', () => {
  describe('formatCurrency', () => {
    it('should format Malaysian Ringgit correctly', () => {
      expect(MalaysianPaymentService.formatCurrency(10)).toMatch(/RM\s+10\.00/)
      expect(MalaysianPaymentService.formatCurrency(10.5)).toMatch(/RM\s+10\.50/)
      expect(MalaysianPaymentService.formatCurrency(1000)).toMatch(/RM\s+1,000\.00/)
    })

    it('should handle edge cases', () => {
      expect(MalaysianPaymentService.formatCurrency(0)).toMatch(/RM\s+0\.00/)
      expect(MalaysianPaymentService.formatCurrency(0.01)).toMatch(/RM\s+0\.01/)
      expect(MalaysianPaymentService.formatCurrency(999999.99)).toMatch(/RM\s+999,999\.99/)
    })
  })

  describe('generateTouchNGoLink', () => {
    it('should generate TouchNGo payment link correctly', () => {
      const link = MalaysianPaymentService.generateTouchNGoLink(
        25.50,
        'John Doe',
        'Dinner bill payment'
      )

      expect(link).toContain('touchngo://pay')
      expect(link).toContain('amount=25.50')
      expect(link).toContain('recipient=John+Doe')
      expect(link).toContain('description=Dinner+bill+payment')
    })

    it('should handle special characters in parameters', () => {
      const link = MalaysianPaymentService.generateTouchNGoLink(
        10.00,
        'Café & Restaurant',
        'Bill #123 - 50% discount'
      )

      expect(link).toContain('recipient=Caf%C3%A9+%26+Restaurant')
      expect(link).toContain('description=Bill+%23123+-+50%25+discount')
    })
  })

  describe('generateGrabPayLink', () => {
    it('should generate GrabPay payment link correctly', () => {
      const link = MalaysianPaymentService.generateGrabPayLink(
        15.75,
        'Jane Smith',
        'Lunch payment'
      )

      expect(link).toContain('grabpay://pay')
      expect(link).toContain('amount=15.75')
      expect(link).toContain('recipient=Jane+Smith')
      expect(link).toContain('description=Lunch+payment')
    })
  })

  describe('generateDuitNowQR', () => {
    it('should generate DuitNow QR data correctly', () => {
      const qrData = MalaysianPaymentService.generateDuitNowQR(
        '0123456789',
        50.00,
        'Restaurant bill'
      )

      expect(qrData).toContain('0123456789')
      expect(qrData).toContain('50.00')
      expect(qrData).toContain('Restaurant%20bill')
    })

    it('should handle different phone number formats', () => {
      const qrData1 = MalaysianPaymentService.generateDuitNowQR('+60123456789', 10, 'Test')
      const qrData2 = MalaysianPaymentService.generateDuitNowQR('60123456789', 10, 'Test')
      const qrData3 = MalaysianPaymentService.generateDuitNowQR('0123456789', 10, 'Test')

      // All should normalize to the same format
      expect(qrData1).toContain('0123456789')
      expect(qrData2).toContain('0123456789')
      expect(qrData3).toContain('0123456789')
    })
  })

  describe('getBankTransferDetails', () => {
    it('should return bank transfer details for supported banks', () => {
      const maybankDetails = MalaysianPaymentService.getBankTransferDetails('maybank')
      expect(maybankDetails).toEqual({
        bankName: 'Maybank',
        accountNumber: 'Please provide your account number',
        accountName: 'Please provide your account name',
        swiftCode: 'MBBEMYKL',
        instructions: 'Transfer to the above account and send screenshot as confirmation'
      })

      const cimbDetails = MalaysianPaymentService.getBankTransferDetails('cimb')
      expect(cimbDetails).toEqual({
        bankName: 'CIMB Bank',
        accountNumber: 'Please provide your account number',
        accountName: 'Please provide your account name',
        swiftCode: 'CIBBMYKL',
        instructions: 'Transfer to the above account and send screenshot as confirmation'
      })
    })

    it('should return null for unsupported banks', () => {
      const details = MalaysianPaymentService.getBankTransferDetails('unknown-bank')
      expect(details).toBeNull()
    })
  })

  describe('getAllPaymentMethods', () => {
    it('should return all available payment methods', () => {
      const methods = MalaysianPaymentService.getAllPaymentMethods()

      expect(methods).toHaveLength(6) // TouchNGo, GrabPay, DuitNow, Maybank, CIMB, Public Bank
      
      const touchngo = methods.find(m => m.id === 'touchngo')
      expect(touchngo).toEqual({
        id: 'touchngo',
        name: 'TouchNGo eWallet',
        type: 'ewallet',
        icon: '💳',
        description: 'Pay instantly with TouchNGo eWallet'
      })

      const grabpay = methods.find(m => m.id === 'grabpay')
      expect(grabpay).toEqual({
        id: 'grabpay',
        name: 'GrabPay',
        type: 'ewallet',
        icon: '🟢',
        description: 'Pay with GrabPay wallet'
      })

      const duitnow = methods.find(m => m.id === 'duitnow')
      expect(duitnow).toEqual({
        id: 'duitnow',
        name: 'DuitNow QR',
        type: 'qr',
        icon: '📱',
        description: 'Scan QR code to pay via DuitNow'
      })
    })

    it('should include all major Malaysian banks', () => {
      const methods = MalaysianPaymentService.getAllPaymentMethods()
      const bankMethods = methods.filter(m => m.type === 'bank')

      expect(bankMethods).toHaveLength(3)
      expect(bankMethods.map(m => m.id)).toEqual(['maybank', 'cimb', 'public-bank'])
    })
  })

  describe('validateAmount', () => {
    it('should validate payment amounts correctly', () => {
      expect(MalaysianPaymentService.validateAmount(10.50)).toBe(true)
      expect(MalaysianPaymentService.validateAmount(0.01)).toBe(true)
      expect(MalaysianPaymentService.validateAmount(9999.99)).toBe(true)
    })

    it('should reject invalid amounts', () => {
      expect(MalaysianPaymentService.validateAmount(0)).toBe(false)
      expect(MalaysianPaymentService.validateAmount(-10)).toBe(false)
      expect(MalaysianPaymentService.validateAmount(10000)).toBe(false)
      expect(MalaysianPaymentService.validateAmount(NaN)).toBe(false)
      expect(MalaysianPaymentService.validateAmount(Infinity)).toBe(false)
    })
  })

  describe('validatePhoneNumber', () => {
    it('should validate Malaysian phone numbers correctly', () => {
      expect(MalaysianPaymentService.validatePhoneNumber('0123456789')).toBe(true)
      expect(MalaysianPaymentService.validatePhoneNumber('+60123456789')).toBe(true)
      expect(MalaysianPaymentService.validatePhoneNumber('60123456789')).toBe(true)
      expect(MalaysianPaymentService.validatePhoneNumber('0187654321')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(MalaysianPaymentService.validatePhoneNumber('123456789')).toBe(false) // Too short
      expect(MalaysianPaymentService.validatePhoneNumber('01234567890')).toBe(false) // Too long
      expect(MalaysianPaymentService.validatePhoneNumber('0223456789')).toBe(false) // Invalid prefix
      expect(MalaysianPaymentService.validatePhoneNumber('abc1234567')).toBe(false) // Contains letters
      expect(MalaysianPaymentService.validatePhoneNumber('')).toBe(false) // Empty
    })
  })
})

