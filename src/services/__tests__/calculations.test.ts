import { describe, it, expect } from 'vitest'
import { calculateBillSplit, calculateParticipantBalances, generatePaymentInstructions } from '../calculations'
import type { BillItem, Participant } from '@/types'

describe('Calculation Service', () => {
  const mockParticipants: Participant[] = [
    { id: '1', name: 'Alice', sessionId: 'session1' },
    { id: '2', name: 'Bob', sessionId: 'session1' },
    { id: '3', name: 'Charlie', sessionId: 'session1' }
  ]

  const mockItems: BillItem[] = [
    {
      id: '1',
      sessionId: 'session1',
      name: 'Pizza',
      amount: 30,
      paidBy: '1', // Alice
      sharedBy: ['1', '2', '3'], // All three
      hasSst: false
    },
    {
      id: '2',
      sessionId: 'session1',
      name: 'Drinks',
      amount: 15,
      paidBy: '2', // Bob
      sharedBy: ['2', '3'], // Bob and Charlie
      hasSst: true
    }
  ]

  describe('calculateBillSplit', () => {
    it('should calculate bill split correctly', () => {
      const result = calculateBillSplit(mockItems, mockParticipants)

      expect(result.totalAmount).toBe(45) // 30 + 15
      expect(result.totalWithTaxes).toBe(45.9) // 30 + (15 * 1.06)
      expect(result.participantShares).toHaveLength(3)

      // Alice: paid 30, owes 10 (30/3) = balance +20
      const alice = result.participantShares.find(p => p.participantId === '1')
      expect(alice?.paid).toBe(30)
      expect(alice?.owes).toBe(10)
      expect(alice?.balance).toBe(20)

      // Bob: paid 15.9 (with SST), owes 10 + 7.95 = balance -2.05
      const bob = result.participantShares.find(p => p.participantId === '2')
      expect(bob?.paid).toBe(15.9)
      expect(bob?.owes).toBe(17.95)
      expect(bob?.balance).toBeCloseTo(-2.05, 2)

      // Charlie: paid 0, owes 10 + 7.95 = balance -17.95
      const charlie = result.participantShares.find(p => p.participantId === '3')
      expect(charlie?.paid).toBe(0)
      expect(charlie?.owes).toBe(17.95)
      expect(charlie?.balance).toBeCloseTo(-17.95, 2)
    })

    it('should handle empty items', () => {
      const result = calculateBillSplit([], mockParticipants)

      expect(result.totalAmount).toBe(0)
      expect(result.totalWithTaxes).toBe(0)
      expect(result.participantShares).toHaveLength(3)
      
      result.participantShares.forEach(share => {
        expect(share.paid).toBe(0)
        expect(share.owes).toBe(0)
        expect(share.balance).toBe(0)
      })
    })

    it('should handle single participant', () => {
      const singleParticipant = [mockParticipants[0]]
      const singleItem = [{
        ...mockItems[0],
        sharedBy: ['1']
      }]

      const result = calculateBillSplit(singleItem, singleParticipant)

      expect(result.participantShares).toHaveLength(1)
      const participant = result.participantShares[0]
      expect(participant.paid).toBe(30)
      expect(participant.owes).toBe(30)
      expect(participant.balance).toBe(0)
    })
  })

  describe('calculateParticipantBalances', () => {
    it('should calculate participant balances correctly', () => {
      const balances = calculateParticipantBalances(mockItems, mockParticipants)

      expect(balances).toHaveLength(3)
      
      const alice = balances.find(b => b.participantId === '1')
      expect(alice?.name).toBe('Alice')
      expect(alice?.paid).toBe(30)
      expect(alice?.owes).toBe(10)
      expect(alice?.balance).toBe(20)

      const bob = balances.find(b => b.participantId === '2')
      expect(bob?.name).toBe('Bob')
      expect(bob?.paid).toBe(15.9)
      expect(bob?.owes).toBeCloseTo(17.95, 2)
      expect(bob?.balance).toBeCloseTo(-2.05, 2)
    })

    it('should handle participants with no items', () => {
      const emptyItems: BillItem[] = []
      const balances = calculateParticipantBalances(emptyItems, mockParticipants)

      expect(balances).toHaveLength(3)
      balances.forEach(balance => {
        expect(balance.paid).toBe(0)
        expect(balance.owes).toBe(0)
        expect(balance.balance).toBe(0)
      })
    })
  })

  describe('generatePaymentInstructions', () => {
    it('should generate payment instructions correctly', () => {
      const balances = calculateParticipantBalances(mockItems, mockParticipants)
      const instructions = generatePaymentInstructions(balances)

      // Should have instructions for people who owe money
      expect(instructions.length).toBeGreaterThan(0)
      
      // All instructions should have positive amounts
      instructions.forEach(instruction => {
        expect(instruction.amount).toBeGreaterThan(0)
        expect(instruction.from).toBeTruthy()
        expect(instruction.to).toBeTruthy()
        expect(instruction.description).toBeTruthy()
      })

      // Total amount owed should equal total amount to receive
      const totalOwed = instructions.reduce((sum, inst) => sum + inst.amount, 0)
      const totalToReceive = balances
        .filter(b => b.balance > 0)
        .reduce((sum, b) => sum + b.balance, 0)
      
      expect(totalOwed).toBeCloseTo(totalToReceive, 2)
    })

    it('should handle balanced scenario', () => {
      const balancedItems: BillItem[] = [{
        id: '1',
        sessionId: 'session1',
        name: 'Shared Item',
        amount: 30,
        paidBy: '1',
        sharedBy: ['1'],
        hasSst: false
      }]

      const balances = calculateParticipantBalances(balancedItems, [mockParticipants[0]])
      const instructions = generatePaymentInstructions(balances)

      expect(instructions).toHaveLength(0)
    })

    it('should optimize payment instructions', () => {
      // Create a scenario where optimization is possible
      const complexItems: BillItem[] = [
        {
          id: '1',
          sessionId: 'session1',
          name: 'Item 1',
          amount: 60,
          paidBy: '1', // Alice pays 60
          sharedBy: ['1', '2', '3'], // Split 3 ways (20 each)
          hasSst: false
        },
        {
          id: '2',
          sessionId: 'session1',
          name: 'Item 2',
          amount: 30,
          paidBy: '2', // Bob pays 30
          sharedBy: ['2', '3'], // Split 2 ways (15 each)
          hasSst: false
        }
      ]

      const balances = calculateParticipantBalances(complexItems, mockParticipants)
      const instructions = generatePaymentInstructions(balances)

      // Should minimize number of transactions
      expect(instructions.length).toBeLessThanOrEqual(2)
      
      // Verify the math works out
      const totalTransferred = instructions.reduce((sum, inst) => sum + inst.amount, 0)
      const totalDeficit = balances
        .filter(b => b.balance < 0)
        .reduce((sum, b) => sum + Math.abs(b.balance), 0)
      
      expect(totalTransferred).toBeCloseTo(totalDeficit, 2)
    })
  })
})

