import type { 
  Session, 
  Participant, 
  BillItem, 
  PaymentMethod,
  CreateSessionForm,
  AddParticipantForm,
  AddItemForm,
  PaymentMethodForm
} from '@/types'
import { generateSessionId, generateParticipantId, generateItemId, storage } from '@/utils'

// Local storage keys
const STORAGE_KEYS = {
  SESSIONS: 'billsplit_sessions',
  PARTICIPANTS: 'billsplit_participants',
  ITEMS: 'billsplit_items',
  PAYMENT_METHODS: 'billsplit_payment_methods'
} as const

// Local storage service (fallback when Supabase is not configured)
export const localStorageService = {
  // Session operations
  sessions: {
    async create(data: CreateSessionForm & { organizerId?: string }): Promise<Session> {
      const sessions = storage.get<Session[]>(STORAGE_KEYS.SESSIONS) || []
      
      const newSession: Session = {
        id: generateSessionId(),
        name: data.name,
        organizerId: data.organizerId,
        participants: [],
        items: [],
        paymentMethods: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }

      sessions.push(newSession)
      storage.set(STORAGE_KEYS.SESSIONS, sessions)
      
      return newSession
    },

    async getById(id: string): Promise<Session | null> {
      const sessions = storage.get<Session[]>(STORAGE_KEYS.SESSIONS) || []
      const session = sessions.find(s => s.id === id)
      
      if (!session) return null

      // Load related data
      const participants = await this.participants.getBySession(id)
      const items = await this.items.getBySession(id)
      const paymentMethods = await this.paymentMethods.getBySession(id)

      return {
        ...session,
        participants,
        items,
        paymentMethods,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      }
    },

    async update(id: string, updates: Partial<Session>): Promise<Session> {
      const sessions = storage.get<Session[]>(STORAGE_KEYS.SESSIONS) || []
      const index = sessions.findIndex(s => s.id === id)
      
      if (index === -1) throw new Error('Session not found')

      sessions[index] = {
        ...sessions[index],
        ...updates,
        updatedAt: new Date()
      }

      storage.set(STORAGE_KEYS.SESSIONS, sessions)
      return sessions[index]
    },

    async delete(id: string): Promise<void> {
      const sessions = storage.get<Session[]>(STORAGE_KEYS.SESSIONS) || []
      const filtered = sessions.filter(s => s.id !== id)
      storage.set(STORAGE_KEYS.SESSIONS, filtered)

      // Clean up related data
      await this.participants.deleteBySession(id)
      await this.items.deleteBySession(id)
      await this.paymentMethods.deleteBySession(id)
    }
  },

  // Participant operations
  participants: {
    async add(sessionId: string, data: AddParticipantForm): Promise<Participant> {
      const participants = storage.get<Participant[]>(STORAGE_KEYS.PARTICIPANTS) || []
      
      const newParticipant: Participant = {
        id: generateParticipantId(),
        sessionId,
        name: data.name,
        userId: undefined,
        totalOwed: 0,
        totalPaid: 0,
        netAmount: 0
      }

      participants.push(newParticipant)
      storage.set(STORAGE_KEYS.PARTICIPANTS, participants)
      
      return newParticipant
    },

    async remove(participantId: string): Promise<void> {
      const participants = storage.get<Participant[]>(STORAGE_KEYS.PARTICIPANTS) || []
      const filtered = participants.filter(p => p.id !== participantId)
      storage.set(STORAGE_KEYS.PARTICIPANTS, filtered)
    },

    async updateBalances(participantId: string, balances: {
      totalOwed: number
      totalPaid: number
      netAmount: number
    }): Promise<Participant> {
      const participants = storage.get<Participant[]>(STORAGE_KEYS.PARTICIPANTS) || []
      const index = participants.findIndex(p => p.id === participantId)
      
      if (index === -1) throw new Error('Participant not found')

      participants[index] = {
        ...participants[index],
        ...balances
      }

      storage.set(STORAGE_KEYS.PARTICIPANTS, participants)
      return participants[index]
    },

    async getBySession(sessionId: string): Promise<Participant[]> {
      const participants = storage.get<Participant[]>(STORAGE_KEYS.PARTICIPANTS) || []
      return participants.filter(p => p.sessionId === sessionId)
    },

    async deleteBySession(sessionId: string): Promise<void> {
      const participants = storage.get<Participant[]>(STORAGE_KEYS.PARTICIPANTS) || []
      const filtered = participants.filter(p => p.sessionId !== sessionId)
      storage.set(STORAGE_KEYS.PARTICIPANTS, filtered)
    }
  },

  // Item operations
  items: {
    async add(sessionId: string, data: AddItemForm): Promise<BillItem> {
      const items = storage.get<BillItem[]>(STORAGE_KEYS.ITEMS) || []
      
      const newItem: BillItem = {
        id: generateItemId(),
        sessionId,
        name: data.name,
        totalAmount: data.amount,
        paidBy: data.paidBy,
        sharedBy: data.sharedBy,
        hasSst: data.hasSst,
        sstAmount: data.hasSst ? data.amount * 0.06 : 0,
        perPersonAmount: data.amount / data.sharedBy.length,
        createdAt: new Date()
      }

      items.push(newItem)
      storage.set(STORAGE_KEYS.ITEMS, items)
      
      return newItem
    },

    async update(itemId: string, data: Partial<AddItemForm>): Promise<BillItem> {
      const items = storage.get<BillItem[]>(STORAGE_KEYS.ITEMS) || []
      const index = items.findIndex(i => i.id === itemId)
      
      if (index === -1) throw new Error('Item not found')

      const currentItem = items[index]
      const updatedItem: BillItem = {
        ...currentItem,
        name: data.name || currentItem.name,
        totalAmount: data.amount || currentItem.totalAmount,
        paidBy: data.paidBy || currentItem.paidBy,
        sharedBy: data.sharedBy || currentItem.sharedBy,
        hasSst: data.hasSst !== undefined ? data.hasSst : currentItem.hasSst,
        sstAmount: data.hasSst ? (data.amount || currentItem.totalAmount) * 0.06 : 0,
        perPersonAmount: (data.amount || currentItem.totalAmount) / (data.sharedBy || currentItem.sharedBy).length
      }

      items[index] = updatedItem
      storage.set(STORAGE_KEYS.ITEMS, items)
      
      return updatedItem
    },

    async remove(itemId: string): Promise<void> {
      const items = storage.get<BillItem[]>(STORAGE_KEYS.ITEMS) || []
      const filtered = items.filter(i => i.id !== itemId)
      storage.set(STORAGE_KEYS.ITEMS, filtered)
    },

    async getBySession(sessionId: string): Promise<BillItem[]> {
      const items = storage.get<BillItem[]>(STORAGE_KEYS.ITEMS) || []
      return items
        .filter(i => i.sessionId === sessionId)
        .map(item => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }))
    },

    async deleteBySession(sessionId: string): Promise<void> {
      const items = storage.get<BillItem[]>(STORAGE_KEYS.ITEMS) || []
      const filtered = items.filter(i => i.sessionId !== sessionId)
      storage.set(STORAGE_KEYS.ITEMS, filtered)
    }
  },

  // Payment method operations
  paymentMethods: {
    async add(data: PaymentMethodForm & { userId?: string; sessionId?: string }): Promise<PaymentMethod> {
      const paymentMethods = storage.get<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS) || []
      
      const newPaymentMethod: PaymentMethod = {
        id: generateItemId(), // Reuse the ID generator
        userId: data.userId,
        sessionId: data.sessionId,
        type: data.type,
        displayName: data.displayName,
        details: {
          qrCodeUrl: data.type === 'qr_code' ? 'placeholder-url' : undefined,
          duitnowId: data.duitnowId,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountHolder: data.accountHolder
        }
      }

      paymentMethods.push(newPaymentMethod)
      storage.set(STORAGE_KEYS.PAYMENT_METHODS, paymentMethods)
      
      return newPaymentMethod
    },

    async remove(paymentMethodId: string): Promise<void> {
      const paymentMethods = storage.get<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS) || []
      const filtered = paymentMethods.filter(pm => pm.id !== paymentMethodId)
      storage.set(STORAGE_KEYS.PAYMENT_METHODS, filtered)
    },

    async getBySession(sessionId: string): Promise<PaymentMethod[]> {
      const paymentMethods = storage.get<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS) || []
      return paymentMethods.filter(pm => pm.sessionId === sessionId)
    },

    async getByUser(userId: string): Promise<PaymentMethod[]> {
      const paymentMethods = storage.get<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS) || []
      return paymentMethods.filter(pm => pm.userId === userId)
    },

    async deleteBySession(sessionId: string): Promise<void> {
      const paymentMethods = storage.get<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS) || []
      const filtered = paymentMethods.filter(pm => pm.sessionId !== sessionId)
      storage.set(STORAGE_KEYS.PAYMENT_METHODS, filtered)
    }
  }
}

// Export the service with the same interface as the database service
export const sessionService = localStorageService.sessions
export const participantService = localStorageService.participants
export const itemService = localStorageService.items
export const paymentService = localStorageService.paymentMethods

