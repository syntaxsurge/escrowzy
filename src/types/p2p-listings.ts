import type { p2pListings, trades, users } from '@/lib/db/schema'

// Base P2P listing type from database
export type P2PListing = typeof p2pListings.$inferSelect
export type NewP2PListing = typeof p2pListings.$inferInsert

// Trade type from database
export type Trade = typeof trades.$inferSelect
export type NewTrade = typeof trades.$inferInsert

// Extended types with relations
export interface P2PListingWithUser extends P2PListing {
  user: typeof users.$inferSelect
}

// Listing filters for search
export interface P2PListingFilters {
  listingType?: 'buy' | 'sell'
  tokenOffered?: string
  minAmount?: string
  maxAmount?: string
  paymentMethod?: string
  userId?: number
  isActive?: boolean
}

// Payment methods enum
export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  PAYPAL: 'paypal',
  CRYPTO: 'crypto',
  CASH: 'cash',
  MOBILE_PAYMENT: 'mobile_payment',
  WIRE_TRANSFER: 'wire_transfer'
} as const

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS]

// Supported tokens
export const SUPPORTED_TOKENS = {
  XTZ: 'XTZ',
  ETH: 'ETH',
  BTC: 'BTC',
  USDT: 'USDT',
  USDC: 'USDC'
} as const

export type SupportedToken =
  (typeof SUPPORTED_TOKENS)[keyof typeof SUPPORTED_TOKENS]

// Trade status enum
export const TRADE_STATUS = {
  CREATED: 'created',
  AWAITING_DEPOSIT: 'awaiting_deposit',
  FUNDED: 'funded',
  PAYMENT_SENT: 'payment_sent',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  DELIVERED: 'delivered',
  CONFIRMED: 'confirmed',
  DISPUTED: 'disputed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DEPOSIT_TIMEOUT: 'deposit_timeout',
  REFUNDED: 'refunded'
} as const

export type TradeStatus = (typeof TRADE_STATUS)[keyof typeof TRADE_STATUS]

// Response types
export interface CreateListingResponse {
  success: boolean
  listing?: P2PListing
  error?: string
}

export interface AcceptListingResponse {
  success: boolean
  trade?: Trade
  error?: string
}

// Type guards
export function isValidListingType(type: string): type is 'buy' | 'sell' {
  return type === 'buy' || type === 'sell'
}

export function isValidPaymentMethod(method: string): method is PaymentMethod {
  return Object.values(PAYMENT_METHODS).includes(method as PaymentMethod)
}

export function isValidToken(token: string): token is SupportedToken {
  return Object.values(SUPPORTED_TOKENS).includes(token as SupportedToken)
}

export function isValidTradeStatus(status: string): status is TradeStatus {
  return Object.values(TRADE_STATUS).includes(status as TradeStatus)
}
