// Malaysian Payment Integration Utilities
// Supports TouchNGo, GrabPay, DuitNow QR, and local bank transfers

export interface PaymentMethod {
  id: string
  name: string
  type: 'ewallet' | 'qr' | 'bank_transfer'
  icon: string
  color: string
  isAvailable: boolean
}

export interface PaymentRequest {
  amount: number
  currency: 'MYR'
  description: string
  recipientName: string
  recipientId?: string
  reference?: string
}

export interface PaymentLink {
  method: string
  url: string
  qrCode?: string
  instructions: string[]
}

export class MalaysianPaymentService {
  private static readonly PAYMENT_METHODS: PaymentMethod[] = [
    {
      id: 'touchngo',
      name: 'TouchNGo eWallet',
      type: 'ewallet',
      icon: '💳',
      color: '#1E40AF',
      isAvailable: true
    },
    {
      id: 'grabpay',
      name: 'GrabPay',
      type: 'ewallet', 
      icon: '🚗',
      color: '#00B14F',
      isAvailable: true
    },
    {
      id: 'duitnow',
      name: 'DuitNow QR',
      type: 'qr',
      icon: '📱',
      color: '#FF6B35',
      isAvailable: true
    },
    {
      id: 'maybank',
      name: 'Maybank',
      type: 'bank_transfer',
      icon: '🏦',
      color: '#FFD700',
      isAvailable: true
    },
    {
      id: 'cimb',
      name: 'CIMB Bank',
      type: 'bank_transfer',
      icon: '🏦',
      color: '#DC2626',
      isAvailable: true
    },
    {
      id: 'public_bank',
      name: 'Public Bank',
      type: 'bank_transfer',
      icon: '🏦',
      color: '#7C3AED',
      isAvailable: true
    }
  ]

  /**
   * Get all available payment methods
   */
  static getPaymentMethods(): PaymentMethod[] {
    return this.PAYMENT_METHODS.filter(method => method.isAvailable)
  }

  /**
   * Get payment methods by type
   */
  static getPaymentMethodsByType(type: PaymentMethod['type']): PaymentMethod[] {
    return this.PAYMENT_METHODS.filter(method => method.type === type && method.isAvailable)
  }

  /**
   * Generate TouchNGo payment link
   */
  static generateTouchNGoLink(request: PaymentRequest): PaymentLink {
    // TouchNGo deep link format (simplified for demo)
    const amount = request.amount.toFixed(2)
    const description = encodeURIComponent(request.description)
    const url = `touchngo://pay?amount=${amount}&description=${description}&recipient=${encodeURIComponent(request.recipientName)}`
    
    return {
      method: 'TouchNGo eWallet',
      url,
      instructions: [
        'Open TouchNGo eWallet app',
        'Scan the QR code or click the payment link',
        `Pay RM ${amount} to ${request.recipientName}`,
        'Share payment confirmation screenshot'
      ]
    }
  }

  /**
   * Generate GrabPay payment link
   */
  static generateGrabPayLink(request: PaymentRequest): PaymentLink {
    // GrabPay deep link format (simplified for demo)
    const amount = request.amount.toFixed(2)
    const description = encodeURIComponent(request.description)
    const url = `grab://pay?amount=${amount}&description=${description}&recipient=${encodeURIComponent(request.recipientName)}`
    
    return {
      method: 'GrabPay',
      url,
      instructions: [
        'Open Grab app',
        'Go to GrabPay section',
        'Scan QR code or use payment link',
        `Transfer RM ${amount} to ${request.recipientName}`,
        'Save transaction receipt'
      ]
    }
  }

  /**
   * Generate DuitNow QR payment
   */
  static generateDuitNowQR(request: PaymentRequest): PaymentLink {
    // DuitNow QR format (simplified for demo)
    const amount = request.amount.toFixed(2)
    const reference = request.reference || `BILL-${Date.now()}`
    
    return {
      method: 'DuitNow QR',
      url: `duitnow://qr?amount=${amount}&ref=${reference}`,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=duitnow://qr?amount=${amount}&ref=${reference}`,
      instructions: [
        'Open any Malaysian banking app',
        'Select "Scan & Pay" or "DuitNow QR"',
        'Scan the QR code below',
        `Pay RM ${amount}`,
        'Reference: ' + reference
      ]
    }
  }

  /**
   * Generate bank transfer instructions
   */
  static generateBankTransfer(bankId: string, request: PaymentRequest): PaymentLink {
    const amount = request.amount.toFixed(2)
    const reference = request.reference || `BILL-${Date.now()}`
    
    const bankDetails = {
      maybank: {
        name: 'Maybank',
        accountNumber: '1234567890',
        accountName: request.recipientName
      },
      cimb: {
        name: 'CIMB Bank',
        accountNumber: '0987654321',
        accountName: request.recipientName
      },
      public_bank: {
        name: 'Public Bank',
        accountNumber: '5555666677',
        accountName: request.recipientName
      }
    }

    const bank = bankDetails[bankId as keyof typeof bankDetails]
    
    return {
      method: bank.name,
      url: '',
      instructions: [
        `Bank: ${bank.name}`,
        `Account Number: ${bank.accountNumber}`,
        `Account Name: ${bank.accountName}`,
        `Amount: RM ${amount}`,
        `Reference: ${reference}`,
        'Please include the reference in your transfer description'
      ]
    }
  }

  /**
   * Generate payment link for any method
   */
  static generatePaymentLink(methodId: string, request: PaymentRequest): PaymentLink {
    switch (methodId) {
      case 'touchngo':
        return this.generateTouchNGoLink(request)
      case 'grabpay':
        return this.generateGrabPayLink(request)
      case 'duitnow':
        return this.generateDuitNowQR(request)
      case 'maybank':
      case 'cimb':
      case 'public_bank':
        return this.generateBankTransfer(methodId, request)
      default:
        throw new Error(`Unsupported payment method: ${methodId}`)
    }
  }

  /**
   * Format currency for Malaysian Ringgit
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  /**
   * Validate Malaysian phone number for payment
   */
  static validateMalaysianPhone(phone: string): boolean {
    // Malaysian mobile number format: +60 or 0, followed by 1X-XXXXXXX
    const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  /**
   * Generate payment instructions for bill splitting
   */
  static generateSplitPaymentInstructions(
    totalAmount: number,
    participants: Array<{ name: string; amount: number; phone?: string }>,
    organizer: string
  ): Array<{ participant: string; amount: number; methods: PaymentLink[] }> {
    return participants.map(participant => ({
      participant: participant.name,
      amount: participant.amount,
      methods: this.getPaymentMethods().map(method => 
        this.generatePaymentLink(method.id, {
          amount: participant.amount,
          currency: 'MYR',
          description: `Bill split payment to ${organizer}`,
          recipientName: organizer,
          reference: `SPLIT-${participant.name.toUpperCase()}-${Date.now()}`
        })
      )
    }))
  }

  /**
   * Validate payment amount
   */
  static validateAmount(amount: number): boolean {
    return !isNaN(amount) && 
           isFinite(amount) && 
           amount > 0 && 
           amount < 10000 && 
           Number.isFinite(amount)
  }

  /**
   * Validate Malaysian phone number
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '')
    
    // Check if it's a valid Malaysian mobile number
    // Malaysian mobile numbers: 01X-XXXXXXX (10 digits total)
    // With country code: +60 or 60 (11-12 digits total)
    
    if (cleaned.length === 10 && cleaned.startsWith('01')) {
      // Local format: 01X-XXXXXXX
      const prefix = cleaned.substring(0, 3)
      return ['010', '011', '012', '013', '014', '015', '016', '017', '018', '019'].includes(prefix)
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('601')) {
      // International format without +: 601X-XXXXXXX
      const prefix = cleaned.substring(0, 4)
      return ['6010', '6011', '6012', '6013', '6014', '6015', '6016', '6017', '6018', '6019'].includes(prefix)
    }
    
    if (cleaned.length === 12 && cleaned.startsWith('+601')) {
      // International format with +: +601X-XXXXXXX
      const prefix = cleaned.substring(0, 5)
      return ['+6010', '+6011', '+6012', '+6013', '+6014', '+6015', '+6016', '+6017', '+6018', '+6019'].includes(prefix)
    }
    
    return false
  }

  /**
   * Get bank transfer details for supported banks
   */
  static getBankTransferDetails(bankId: string): {
    bankName: string
    accountNumber: string
    accountName: string
    swiftCode: string
    instructions: string
  } | null {
    const banks = {
      'maybank': {
        bankName: 'Maybank',
        accountNumber: 'Please provide your account number',
        accountName: 'Please provide your account name',
        swiftCode: 'MBBEMYKL',
        instructions: 'Transfer to the above account and send screenshot as confirmation'
      },
      'cimb': {
        bankName: 'CIMB Bank',
        accountNumber: 'Please provide your account number',
        accountName: 'Please provide your account name',
        swiftCode: 'CIBBMYKL',
        instructions: 'Transfer to the above account and send screenshot as confirmation'
      },
      'public-bank': {
        bankName: 'Public Bank',
        accountNumber: 'Please provide your account number',
        accountName: 'Please provide your account name',
        swiftCode: 'PBBEMYKL',
        instructions: 'Transfer to the above account and send screenshot as confirmation'
      }
    }

    return banks[bankId as keyof typeof banks] || null
  }

  /**
   * Get all available payment methods
   */
  static getAllPaymentMethods(): Array<{
    id: string
    name: string
    type: 'ewallet' | 'qr' | 'bank'
    icon: string
    description: string
  }> {
    return [
      {
        id: 'touchngo',
        name: 'TouchNGo eWallet',
        type: 'ewallet',
        icon: '💳',
        description: 'Pay instantly with TouchNGo eWallet'
      },
      {
        id: 'grabpay',
        name: 'GrabPay',
        type: 'ewallet',
        icon: '🟢',
        description: 'Pay with GrabPay wallet'
      },
      {
        id: 'duitnow',
        name: 'DuitNow QR',
        type: 'qr',
        icon: '📱',
        description: 'Scan QR code to pay via DuitNow'
      },
      {
        id: 'maybank',
        name: 'Maybank',
        type: 'bank',
        icon: '🏦',
        description: 'Bank transfer via Maybank'
      },
      {
        id: 'cimb',
        name: 'CIMB Bank',
        type: 'bank',
        icon: '🏦',
        description: 'Bank transfer via CIMB Bank'
      },
      {
        id: 'public-bank',
        name: 'Public Bank',
        type: 'bank',
        icon: '🏦',
        description: 'Bank transfer via Public Bank'
      }
    ]
  }

}

export default MalaysianPaymentService

