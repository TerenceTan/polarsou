// Core data models for the bill splitting app

export interface Session {
  id: string;
  name: string;
  organizerId?: string; // null for anonymous sessions
  participants: Participant[];
  items: BillItem[];
  paymentMethods: PaymentMethod[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Participant {
  id: string;
  name: string;
  userId?: string; // linked if user has account
  sessionId: string;
  totalOwed: number;
  totalPaid: number;
  netAmount: number; // positive = owes, negative = should receive
}

export interface BillItem {
  id: string;
  sessionId: string;
  name: string;
  totalAmount: number;
  paidBy: string; // participant ID
  sharedBy: string[]; // array of participant IDs
  hasSst: boolean;
  sstAmount?: number;
  perPersonAmount: number;
  createdAt: Date;
}

export interface TaxConfig {
  sstRate: number; // default 0.06 (6%)
  serviceChargeRate: number; // default 0.10 (10%)
  applyServiceChargeToAll: boolean; // default true
}

export interface PaymentMethod {
  id: string;
  userId?: string;
  sessionId?: string;
  type: 'qr_code' | 'duitnow' | 'bank_transfer';
  displayName: string;
  details: {
    qrCodeUrl?: string;
    duitnowId?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  paymentMethods: PaymentMethod[];
}

// OCR and Receipt Processing Types
export interface ReceiptItem {
  name: string;
  amount: number;
  confidence: number;
}

export interface ReceiptData {
  items: ReceiptItem[];
  subtotal?: number;
  sstAmount?: number;
  serviceCharge?: number;
  total?: number;
  confidence: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
  };
}

// Form Types
export interface CreateSessionForm {
  name: string;
  organizerName?: string;
}

export interface AddParticipantForm {
  name: string;
}

export interface AddItemForm {
  name: string;
  amount: number;
  paidBy: string;
  sharedBy: string[];
  hasSst: boolean;
}

export interface PaymentMethodForm {
  type: 'qr_code' | 'duitnow' | 'bank_transfer';
  displayName: string;
  qrCodeFile?: File;
  duitnowId?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

// Calculation Results
export interface CalculationResult {
  participants: ParticipantBalance[];
  summary: {
    totalAmount: number;
    totalSst: number;
    totalServiceCharge: number;
    itemCount: number;
  };
}

export interface ParticipantBalance {
  participant: Participant;
  participantId: string;
  name: string;
  totalOwed: number;
  totalPaid: number;
  netAmount: number;
  itemBreakdown: ItemContribution[];
  // Legacy properties for backward compatibility
  paid: number;
  owes: number;
  balance: number;
}

export interface ItemContribution {
  itemId: string;
  itemName: string;
  contribution: number;
  sstContribution: number;
  serviceChargeContribution: number;
}

