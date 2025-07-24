import { isSupabaseConfigured } from '@/lib/supabase'

// Import both services
import * as databaseService from './database'
import * as localStorageService from './localStorage'

// Service selector - uses Supabase if configured, otherwise falls back to localStorage
const useSupabase = isSupabaseConfigured()

console.log(`Using ${useSupabase ? 'Supabase' : 'localStorage'} for data persistence`)

// Export the appropriate service based on configuration
export const sessionService = useSupabase 
  ? databaseService.sessionService 
  : localStorageService.sessionService

export const participantService = useSupabase 
  ? databaseService.participantService 
  : localStorageService.participantService

export const itemService = useSupabase 
  ? databaseService.itemService 
  : localStorageService.itemService

export const paymentService = useSupabase 
  ? databaseService.paymentService 
  : localStorageService.paymentService

// Export calculation service (always available)
export { BillCalculator, defaultCalculator, calculatePaymentInstructions, validateCalculation } from './calculations'

// Export utility to check which service is being used
export const getServiceType = () => useSupabase ? 'supabase' : 'localStorage'

// Export service status
export const getServiceStatus = () => ({
  type: getServiceType(),
  isOnline: useSupabase,
  isConfigured: useSupabase
})

