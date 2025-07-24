import { v4 as uuidv4 } from 'uuid'

// Generate unique session ID
export const generateSessionId = (): string => {
  return uuidv4()
}

// Generate unique participant ID
export const generateParticipantId = (): string => {
  return uuidv4()
}

// Generate unique item ID
export const generateItemId = (): string => {
  return uuidv4()
}

// Format currency for Malaysian Ringgit
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Round to 2 decimal places (Malaysian Ringgit)
export const roundToTwoDecimals = (amount: number): number => {
  return Math.round(amount * 100) / 100
}

// Calculate SST amount
export const calculateSst = (amount: number, rate: number = 0.06): number => {
  return roundToTwoDecimals(amount * rate)
}

// Calculate service charge
export const calculateServiceCharge = (amount: number, rate: number = 0.10): number => {
  return roundToTwoDecimals(amount * rate)
}

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate shareable session URL
export const generateSessionUrl = (sessionId: string, baseUrl: string = window.location.origin): string => {
  return `${baseUrl}/view/${sessionId}`
}

// Parse amount from string input
export const parseAmount = (input: string): number => {
  const cleaned = input.replace(/[^\d.-]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : roundToTwoDecimals(parsed)
}

// Validate Malaysian phone number format
export const isValidMalaysianPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Generate QR code data for DuitNow
export const generateDuitNowQR = (duitnowId: string, amount?: number, description?: string): string => {
  // This is a simplified version - actual DuitNow QR generation would require proper formatting
  let qrData = `duitnow://${duitnowId}`
  if (amount) {
    qrData += `?amount=${amount}`
  }
  if (description) {
    qrData += `${amount ? '&' : '?'}description=${encodeURIComponent(description)}`
  }
  return qrData
}

// Debounce function for search/input
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Local storage helpers
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Handle storage errors silently
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Handle storage errors silently
    }
  }
}

