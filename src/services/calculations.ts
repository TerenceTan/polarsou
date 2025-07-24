import type { 
  Session, 
  Participant, 
  BillItem, 
  TaxConfig, 
  CalculationResult, 
  ParticipantBalance, 
  ItemContribution 
} from '@/types'
import { roundToTwoDecimals } from '@/utils'

// Default Malaysian tax configuration
const DEFAULT_TAX_CONFIG: TaxConfig = {
  sstRate: 0.06, // 6% SST
  serviceChargeRate: 0.10, // 10% service charge
  applyServiceChargeToAll: true
}

export class BillCalculator {
  private taxConfig: TaxConfig

  constructor(taxConfig: TaxConfig = DEFAULT_TAX_CONFIG) {
    this.taxConfig = taxConfig
  }

  // Main calculation function
  calculateSession(session: Session): CalculationResult {
    const participants = session.participants
    const items = session.items

    if (participants.length === 0 || items.length === 0) {
      return this.createEmptyResult(participants)
    }

    // Calculate each participant's contributions
    const participantBalances = participants.map(participant => 
      this.calculateParticipantBalance(participant, items, participants.length)
    )

    // Calculate summary
    const summary = this.calculateSummary(items)

    return {
      participants: participantBalances,
      summary
    }
  }

  // Calculate individual participant balance
  private calculateParticipantBalance(
    participant: Participant, 
    items: BillItem[], 
    totalParticipants: number
  ): ParticipantBalance {
    let totalOwed = 0
    let totalPaid = 0
    const itemBreakdown: ItemContribution[] = []

    items.forEach(item => {
      const contribution = this.calculateItemContribution(participant, item, totalParticipants)
      
      if (contribution.contribution > 0) {
        totalOwed += contribution.contribution + contribution.sstContribution + contribution.serviceChargeContribution
        itemBreakdown.push(contribution)
      }

      // Check if this participant paid for the item
      if (item.paidBy === participant.id) {
        totalPaid += item.totalAmount
        if (item.hasSst && item.sstAmount) {
          totalPaid += item.sstAmount
        }
        // Add service charge (applied to all items)
        totalPaid += this.calculateServiceCharge(item.totalAmount)
      }
    })

    const netAmount = roundToTwoDecimals(totalOwed - totalPaid)

    return {
      participant,
      participantId: participant.id,
      name: participant.name,
      totalOwed: roundToTwoDecimals(totalOwed),
      totalPaid: roundToTwoDecimals(totalPaid),
      netAmount,
      itemBreakdown,
      // Legacy properties for backward compatibility
      paid: roundToTwoDecimals(totalPaid),
      owes: roundToTwoDecimals(totalOwed),
      balance: netAmount
    }
  }

  // Calculate contribution for a specific item
  private calculateItemContribution(
    participant: Participant, 
    item: BillItem, 
    totalParticipants: number
  ): ItemContribution {
    const isSharing = item.sharedBy.includes(participant.id)
    
    if (!isSharing) {
      return {
        itemId: item.id,
        itemName: item.name,
        contribution: 0,
        sstContribution: 0,
        serviceChargeContribution: 0
      }
    }

    const shareCount = item.sharedBy.length
    const baseContribution = roundToTwoDecimals(item.totalAmount / shareCount)
    
    // SST is only applied to participants who consumed the item
    const sstContribution = item.hasSst && item.sstAmount 
      ? roundToTwoDecimals(item.sstAmount / shareCount)
      : 0

    // Service charge is split among all participants (Malaysian practice)
    const serviceChargeAmount = this.calculateServiceCharge(item.totalAmount)
    const serviceChargeContribution = this.taxConfig.applyServiceChargeToAll
      ? roundToTwoDecimals(serviceChargeAmount / totalParticipants)
      : roundToTwoDecimals(serviceChargeAmount / shareCount)

    return {
      itemId: item.id,
      itemName: item.name,
      contribution: baseContribution,
      sstContribution,
      serviceChargeContribution
    }
  }

  // Calculate service charge for an item
  private calculateServiceCharge(amount: number): number {
    return roundToTwoDecimals(amount * this.taxConfig.serviceChargeRate)
  }

  // Calculate SST for an item
  private calculateSst(amount: number): number {
    return roundToTwoDecimals(amount * this.taxConfig.sstRate)
  }

  // Calculate session summary
  private calculateSummary(items: BillItem[]) {
    let totalAmount = 0
    let totalSst = 0
    let totalServiceCharge = 0

    items.forEach(item => {
      totalAmount += item.totalAmount
      
      if (item.hasSst && item.sstAmount) {
        totalSst += item.sstAmount
      }
      
      totalServiceCharge += this.calculateServiceCharge(item.totalAmount)
    })

    return {
      totalAmount: roundToTwoDecimals(totalAmount),
      totalSst: roundToTwoDecimals(totalSst),
      totalServiceCharge: roundToTwoDecimals(totalServiceCharge),
      itemCount: items.length
    }
  }

  // Create empty result for sessions with no data
  private createEmptyResult(participants: Participant[]): CalculationResult {
    return {
      participants: participants.map(p => ({
        participantId: p.id,
        name: p.name,
        totalOwed: 0,
        totalPaid: 0,
        netAmount: 0,
        itemBreakdown: []
      })),
      summary: {
        totalAmount: 0,
        totalSst: 0,
        totalServiceCharge: 0,
        itemCount: 0
      }
    }
  }

  // Update tax configuration
  updateTaxConfig(newConfig: Partial<TaxConfig>): void {
    this.taxConfig = { ...this.taxConfig, ...newConfig }
  }

  // Get current tax configuration
  getTaxConfig(): TaxConfig {
    return { ...this.taxConfig }
  }
}

// Utility functions for specific calculations

// Calculate how much each person should pay/receive
export function calculatePaymentInstructions(result: CalculationResult): {
  toPay: Array<{ name: string; amount: number; to: string[] }>
  toReceive: Array<{ name: string; amount: number; from: string[] }>
} {
  const toPay: Array<{ name: string; amount: number; to: string[] }> = []
  const toReceive: Array<{ name: string; amount: number; from: string[] }> = []

  result.participants.forEach(participant => {
    if (participant.netAmount > 0) {
      // This person owes money
      toPay.push({
        name: participant.name,
        amount: participant.netAmount,
        to: [] // Will be populated with who to pay
      })
    } else if (participant.netAmount < 0) {
      // This person should receive money
      toReceive.push({
        name: participant.name,
        amount: Math.abs(participant.netAmount),
        from: [] // Will be populated with who should pay them
      })
    }
  })

  // Simple algorithm: match payers with receivers
  // In a real app, you might want a more sophisticated algorithm
  toPay.forEach(payer => {
    let remainingAmount = payer.amount
    
    toReceive.forEach(receiver => {
      if (remainingAmount > 0 && receiver.amount > 0) {
        const transferAmount = Math.min(remainingAmount, receiver.amount)
        
        payer.to.push(`${receiver.name} (RM ${transferAmount.toFixed(2)})`)
        receiver.from.push(`${payer.name} (RM ${transferAmount.toFixed(2)})`)
        
        remainingAmount -= transferAmount
        receiver.amount -= transferAmount
      }
    })
  })

  return { toPay, toReceive }
}

// Validate calculation results
export function validateCalculation(result: CalculationResult): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check if total owed equals total paid
  const totalOwed = result.participants.reduce((sum, p) => sum + p.totalOwed, 0)
  const totalPaid = result.participants.reduce((sum, p) => sum + p.totalPaid, 0)
  
  if (Math.abs(totalOwed - totalPaid) > 0.01) { // Allow for small rounding differences
    errors.push(`Total owed (${totalOwed.toFixed(2)}) does not match total paid (${totalPaid.toFixed(2)})`)
  }

  // Check if net amounts sum to zero
  const netSum = result.participants.reduce((sum, p) => sum + p.netAmount, 0)
  if (Math.abs(netSum) > 0.01) {
    errors.push(`Net amounts do not sum to zero (sum: ${netSum.toFixed(2)})`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export default calculator instance
export const defaultCalculator = new BillCalculator()



// Export individual functions for testing
export function calculateParticipantBalances(items: BillItem[], participants: Participant[]): ParticipantBalance[] {
  return defaultCalculator.calculateSession({ 
    id: 'test', 
    name: 'test', 
    participants, 
    items, 
    createdAt: new Date(), 
    updatedAt: new Date() 
  }).participants
}

export function generatePaymentInstructions(balances: ParticipantBalance[]): Array<{
  from: string
  to: string
  amount: number
}> {
  const instructions: Array<{ from: string; to: string; amount: number }> = []
  
  // Create copies to avoid mutating original data
  const debtors = balances.filter(b => b.netAmount < 0).map(b => ({ ...b }))
  const creditors = balances.filter(b => b.netAmount > 0).map(b => ({ ...b }))
  
  // Optimize payments using greedy algorithm
  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0]
    const creditor = creditors[0]
    
    const paymentAmount = Math.min(Math.abs(debtor.netAmount), creditor.netAmount)
    
    instructions.push({
      from: debtor.participant.name,
      to: creditor.participant.name,
      amount: roundToTwoDecimals(paymentAmount)
    })
    
    // Update balances
    debtor.netAmount += paymentAmount
    creditor.netAmount -= paymentAmount
    
    // Remove settled participants
    if (Math.abs(debtor.netAmount) < 0.01) {
      debtors.shift()
    }
    if (Math.abs(creditor.netAmount) < 0.01) {
      creditors.shift()
    }
  }
  
  return instructions
}


// Legacy function exports for backward compatibility with tests
export function calculateBillSplit(items: BillItem[], participants: Participant[]): {
  totalAmount: number
  participantShares: Array<{
    participantId: string
    name: string
    share: number
    paid: number
    balance: number
  }>
} {
  const session = {
    id: 'test',
    name: 'test',
    participants,
    items,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const result = defaultCalculator.calculateSession(session)
  
  return {
    totalAmount: result.summary.totalAmount,
    participantShares: result.participants.map(p => ({
      participantId: p.participantId,
      name: p.name,
      share: p.totalOwed,
      paid: p.totalPaid,
      balance: p.netAmount
    }))
  }
}

