import type { trades, users, userTradingStats } from '@/lib/db/schema'

import type { TradeStatus } from './listings'

// Re-export TRADE_STATUS for convenience with better typing
export const TRADE_STATUS: Record<string, string> = {
  created: 'Created',
  awaiting_deposit: 'Awaiting Deposit',
  funded: 'Funded',
  payment_sent: 'Payment Sent',
  payment_confirmed: 'Payment Confirmed',
  delivered: 'Delivered',
  confirmed: 'Confirmed',
  disputed: 'Disputed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  deposit_timeout: 'Deposit Timeout',
  refunded: 'Refunded'
}

// Base trade type from database
export type Trade = typeof trades.$inferSelect
export type NewTrade = typeof trades.$inferInsert

// Extended trade types with relations - override metadata to be properly typed
export interface TradeWithUsers
  extends Omit<Trade, 'metadata' | 'listingCategory'> {
  buyer: typeof users.$inferSelect
  seller: typeof users.$inferSelect
  metadata: TradeMetadata | null
  listingCategory: 'p2p' | 'domain'
}

export interface TradeWithStats extends TradeWithUsers {
  buyerStats?: typeof userTradingStats.$inferSelect
  sellerStats?: typeof userTradingStats.$inferSelect
}

// Trade filters for search
export interface TradeFilters {
  userId?: number
  role?: 'buyer' | 'seller' | 'both'
  status?: TradeStatus | TradeStatus[]
  chainId?: number
  startDate?: Date
  endDate?: Date
  minAmount?: string
  maxAmount?: string
  page?: number
  limit?: number
}

// Trade metadata structure
export interface TradeMetadata {
  originalListingId?: number
  paymentMethod?: string
  paymentProof?: string[]
  paymentProofImages?: string[] // URLs to payment proof screenshots
  deliveryProof?: string[]
  disputeReason?: string
  disputeEvidence?: string[]
  notes?: string
  rating?: {
    fromBuyer?: number
    fromSeller?: number
  }
  completedAt?: string
  fundedAt?: string
  deliveredAt?: string
  disputedAt?: string
  escrowContractAddress?: string
  cryptoDepositTxHash?: string // Transaction hash for seller's crypto deposit
  claimTxHash?: string // Transaction hash for seller releasing funds to buyer
  paymentProofUploadedAt?: string // When buyer uploaded payment proof
  escrowFeeAmount?: string // Platform fee amount
  escrowNetAmount?: string // Amount seller receives after fees
  // Domain-specific metadata
  domainName?: string
  registrar?: string
  domainAge?: string
  expiryDate?: string
  monthlyTraffic?: string
  monthlyRevenue?: string
  // Nested domain info (for compatibility with service layer)
  domainInfo?: {
    domainName: string
    registrar: string
    expirationDate?: string
    transferMethod?: string
  }
}

// Trade action types
export type TradeAction =
  | 'deposit'
  | 'fund'
  | 'payment_sent'
  | 'confirm'
  | 'dispute'
  | 'cancel'
  | 'resolve'

// Trade transition rules - Updated for new P2P flow
export const TRADE_TRANSITIONS: Record<string, TradeAction[]> = {
  created: ['cancel'],
  awaiting_deposit: ['deposit', 'cancel'],
  funded: ['payment_sent', 'dispute', 'cancel'],
  payment_sent: ['confirm', 'dispute'],
  payment_confirmed: [],
  delivered: ['confirm', 'dispute'],
  confirmed: [],
  disputed: ['resolve', 'cancel'],
  completed: [],
  cancelled: [],
  deposit_timeout: [],
  refunded: []
}

// Response types
export interface TradeResponse {
  success: boolean
  trade?: Trade | TradeWithUsers
  error?: string
}

export interface TradesListResponse {
  success: boolean
  trades: TradeWithUsers[]
  total: number
  page: number
  limit: number
  error?: string
}

// Type guards
export function canPerformAction(
  currentStatus: TradeStatus,
  action: TradeAction
): boolean {
  const allowedActions = TRADE_TRANSITIONS[currentStatus]
  return allowedActions?.includes(action) ?? false
}

export function isValidTradeAction(action: string): action is TradeAction {
  return [
    'deposit',
    'fund',
    'payment_sent',
    'confirm',
    'dispute',
    'cancel',
    'resolve'
  ].includes(action)
}
