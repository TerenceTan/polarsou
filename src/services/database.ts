import { supabase, TABLES } from '@/lib/supabase'
import type { 
  Session, 
  Participant, 
  BillItem, 
  PaymentMethod, 
  User,
  CreateSessionForm,
  AddParticipantForm,
  AddItemForm,
  PaymentMethodForm
} from '@/types'

// Session operations
export const sessionService = {
  // Create a new session
  async create(data: CreateSessionForm & { organizerId?: string }): Promise<Session> {
    const sessionData = {
      name: data.name,
      organizer_id: data.organizerId || null,
      organizer_name: data.organizerName || null,
    }

    const { data: session, error } = await supabase
      .from(TABLES.SESSIONS)
      .insert(sessionData)
      .select()
      .single()

    if (error) throw error
    return this.mapSessionFromDb(session)
  },

  // Get session by ID
  async getById(id: string): Promise<Session | null> {
    const { data: session, error } = await supabase
      .from(TABLES.SESSIONS)
      .select(`
        *,
        participants (*),
        bill_items (
          *,
          bill_item_participants (
            participant_id
          )
        ),
        payment_methods (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return this.mapSessionFromDb(session)
  },

  // Update session
  async update(id: string, updates: Partial<Session>): Promise<Session> {
    const { data: session, error } = await supabase
      .from(TABLES.SESSIONS)
      .update({
        name: updates.name,
        is_active: updates.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.mapSessionFromDb(session)
  },

  // Delete session
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.SESSIONS)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get sessions by organizer
  async getByOrganizer(organizerId: string): Promise<Session[]> {
    const { data: sessions, error } = await supabase
      .from(TABLES.SESSIONS)
      .select(`
        *,
        participants (*),
        bill_items (*),
        payment_methods (*)
      `)
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return sessions.map(this.mapSessionFromDb)
  },

  // Get sessions by user (alias for getByOrganizer)
  async getByUser(userId: string): Promise<Session[]> {
    return this.getByOrganizer(userId)
  },

  // Map database session to app session
  mapSessionFromDb(dbSession: any): Session {
    return {
      id: dbSession.id,
      name: dbSession.name,
      organizerId: dbSession.organizer_id,
      participants: dbSession.participants?.map(participantService.mapParticipantFromDb) || [],
      items: dbSession.bill_items?.map(itemService.mapItemFromDb) || [],
      paymentMethods: dbSession.payment_methods?.map(paymentService.mapPaymentMethodFromDb) || [],
      createdAt: new Date(dbSession.created_at),
      updatedAt: new Date(dbSession.updated_at),
      isActive: dbSession.is_active
    }
  }
}

// Participant operations
export const participantService = {
  // Add participant to session
  async add(sessionId: string, data: AddParticipantForm): Promise<Participant> {
    const participantData = {
      session_id: sessionId,
      name: data.name,
      user_id: null, // For now, all participants are anonymous
    }

    const { data: participant, error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .insert(participantData)
      .select()
      .single()

    if (error) throw error
    return this.mapParticipantFromDb(participant)
  },

  // Remove participant from session
  async remove(participantId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .delete()
      .eq('id', participantId)

    if (error) throw error
  },

  // Update participant balances
  async updateBalances(participantId: string, balances: {
    totalOwed: number
    totalPaid: number
    netAmount: number
  }): Promise<Participant> {
    const { data: participant, error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .update({
        total_owed: balances.totalOwed,
        total_paid: balances.totalPaid,
        net_amount: balances.netAmount
      })
      .eq('id', participantId)
      .select()
      .single()

    if (error) throw error
    return this.mapParticipantFromDb(participant)
  },

  // Get participants by session
  async getBySession(sessionId: string): Promise<Participant[]> {
    const { data: participants, error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .select('*')
      .eq('session_id', sessionId)

    if (error) throw error
    return participants.map(this.mapParticipantFromDb)
  },

  // Map database participant to app participant
  mapParticipantFromDb(dbParticipant: any): Participant {
    // Ensure all numeric values are properly parsed and default to 0 if invalid
    const totalOwed = parseFloat(dbParticipant.total_owed || '0') || 0
    const totalPaid = parseFloat(dbParticipant.total_paid || '0') || 0
    const netAmount = parseFloat(dbParticipant.net_amount || '0') || 0

    return {
      id: dbParticipant.id,
      name: dbParticipant.name || '',
      userId: dbParticipant.user_id,
      sessionId: dbParticipant.session_id,
      totalOwed,
      totalPaid,
      netAmount
    }
  }
}

// Bill item operations
export const itemService = {
  // Add item to session
  async add(sessionId: string, data: AddItemForm): Promise<BillItem> {
    // Ensure amount is a valid number
    const amount = parseFloat(String(data.amount)) || 0
    if (amount <= 0) {
      throw new Error('Invalid amount: must be greater than 0')
    }

    const sharedByCount = data.sharedBy?.length || 1
    const sstAmount = data.hasSst ? amount * 0.06 : 0
    const perPersonAmount = amount / sharedByCount

    const itemData = {
      session_id: sessionId,
      name: data.name || '',
      total_amount: amount,
      paid_by: data.paidBy,
      has_sst: Boolean(data.hasSst),
      sst_amount: sstAmount,
      per_person_amount: perPersonAmount
    }

    const { data: item, error } = await supabase
      .from(TABLES.BILL_ITEMS)
      .insert(itemData)
      .select()
      .single()

    if (error) throw error

    // Add participants who shared this item
    if (data.sharedBy && data.sharedBy.length > 0) {
      const participantData = data.sharedBy.map(participantId => ({
        bill_item_id: item.id,
        participant_id: participantId
      }))

      const { error: participantError } = await supabase
        .from('bill_item_participants')
        .insert(participantData)

      if (participantError) throw participantError
    }

    return this.mapItemFromDb({ ...item, shared_by: data.sharedBy || [] })
  },

  // Update item
  async update(itemId: string, data: Partial<AddItemForm>): Promise<BillItem> {
    const updateData: any = {}
    
    if (data.name) updateData.name = data.name
    if (data.amount) {
      updateData.total_amount = data.amount
      updateData.sst_amount = data.hasSst ? data.amount * 0.06 : 0
      updateData.per_person_amount = data.sharedBy ? data.amount / data.sharedBy.length : updateData.per_person_amount
    }
    if (data.paidBy) updateData.paid_by = data.paidBy
    if (data.hasSst !== undefined) {
      updateData.has_sst = data.hasSst
      updateData.sst_amount = data.hasSst ? (data.amount || 0) * 0.06 : 0
    }

    const { data: item, error } = await supabase
      .from(TABLES.BILL_ITEMS)
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error

    // Update shared participants if provided
    if (data.sharedBy) {
      // Remove existing participants
      await supabase
        .from('bill_item_participants')
        .delete()
        .eq('bill_item_id', itemId)

      // Add new participants
      const participantData = data.sharedBy.map(participantId => ({
        bill_item_id: itemId,
        participant_id: participantId
      }))

      await supabase
        .from('bill_item_participants')
        .insert(participantData)
    }

    return this.mapItemFromDb(item)
  },

  // Remove item
  async remove(itemId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.BILL_ITEMS)
      .delete()
      .eq('id', itemId)

    if (error) throw error
  },

  // Get items by session
  async getBySession(sessionId: string): Promise<BillItem[]> {
    const { data: items, error } = await supabase
      .from(TABLES.BILL_ITEMS)
      .select(`
        *,
        bill_item_participants (
          participant_id
        )
      `)
      .eq('session_id', sessionId)

    if (error) throw error
    return items.map(this.mapItemFromDb)
  },

  // Map database item to app item
  mapItemFromDb(dbItem: any): BillItem {
    // Ensure all numeric values are properly parsed and default to 0 if invalid
    const totalAmount = parseFloat(dbItem.total_amount) || 0
    const sstAmount = parseFloat(dbItem.sst_amount || '0') || 0
    const perPersonAmount = parseFloat(dbItem.per_person_amount) || 0

    return {
      id: dbItem.id,
      sessionId: dbItem.session_id,
      name: dbItem.name || '',
      totalAmount,
      paidBy: dbItem.paid_by,
      sharedBy: dbItem.bill_item_participants?.map((p: any) => p.participant_id) || dbItem.shared_by || [],
      hasSst: Boolean(dbItem.has_sst),
      sstAmount,
      perPersonAmount,
      createdAt: new Date(dbItem.created_at)
    }
  }
}

// Payment method operations
export const paymentService = {
  // Add payment method
  async add(data: PaymentMethodForm & { userId?: string; sessionId?: string }): Promise<PaymentMethod> {
    let qrCodeUrl = null
    
    // Handle QR code file upload
    if (data.type === 'qr_code' && data.qrCodeFile) {
      try {
        // Convert file to base64 data URL for simple storage
        qrCodeUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(data.qrCodeFile!)
        })
      } catch (error) {
        console.error('Error processing QR code file:', error)
        throw new Error('Failed to process QR code image')
      }
    }

    const paymentData = {
      user_id: data.userId || null,
      session_id: data.sessionId || null,
      type: data.type,
      display_name: data.displayName,
      qr_code_url: qrCodeUrl,
      duitnow_id: data.duitnowId || null,
      bank_name: data.bankName || null,
      account_number: data.accountNumber || null,
      account_holder: data.accountHolder || null
    }

    const { data: paymentMethod, error } = await supabase
      .from(TABLES.PAYMENT_METHODS)
      .insert(paymentData)
      .select()
      .single()

    if (error) throw error
    return this.mapPaymentMethodFromDb(paymentMethod)
  },

  // Remove payment method
  async remove(paymentMethodId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.PAYMENT_METHODS)
      .delete()
      .eq('id', paymentMethodId)

    if (error) throw error
  },

  // Get payment methods by session
  async getBySession(sessionId: string): Promise<PaymentMethod[]> {
    const { data: paymentMethods, error } = await supabase
      .from(TABLES.PAYMENT_METHODS)
      .select('*')
      .eq('session_id', sessionId)

    if (error) throw error
    return paymentMethods.map(this.mapPaymentMethodFromDb)
  },

  // Get payment methods by user
  async getByUser(userId: string): Promise<PaymentMethod[]> {
    const { data: paymentMethods, error } = await supabase
      .from(TABLES.PAYMENT_METHODS)
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return paymentMethods.map(this.mapPaymentMethodFromDb)
  },

  // Map database payment method to app payment method
  mapPaymentMethodFromDb(dbPaymentMethod: any): PaymentMethod {
    return {
      id: dbPaymentMethod.id,
      userId: dbPaymentMethod.user_id,
      sessionId: dbPaymentMethod.session_id,
      type: dbPaymentMethod.type,
      displayName: dbPaymentMethod.display_name,
      details: {
        qrCodeUrl: dbPaymentMethod.qr_code_url,
        duitnowId: dbPaymentMethod.duitnow_id,
        bankName: dbPaymentMethod.bank_name,
        accountNumber: dbPaymentMethod.account_number,
        accountHolder: dbPaymentMethod.account_holder
      }
    }
  }
}

