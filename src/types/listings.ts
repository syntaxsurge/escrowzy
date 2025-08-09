import type { escrowListings, trades, users } from '@/lib/db/schema'

// Listing categories
export const LISTING_CATEGORIES = {
  P2P: 'p2p',
  DOMAIN: 'domain'
} as const

export type ListingCategory =
  (typeof LISTING_CATEGORIES)[keyof typeof LISTING_CATEGORIES]

// Base listing type from database
export type EscrowListing = typeof escrowListings.$inferSelect
export type NewEscrowListing = typeof escrowListings.$inferInsert

// Legacy type aliases for backward compatibility
export type P2PListing = EscrowListing
export type NewP2PListing = NewEscrowListing

// Trade type from database
export type Trade = typeof trades.$inferSelect
export type NewTrade = typeof trades.$inferInsert

// Domain-specific metadata
export interface DomainMetadata {
  domainName: string
  registrar: string
  domainAge?: number
  expiryDate?: string
  transferMethod: 'manual' | 'api'
  websiteUrl?: string
  monthlyTraffic?: number
  monthlyRevenue?: number
  adminTransferEmail?: string
}

// Extended types with relations
export interface EscrowListingWithUser extends EscrowListing {
  user: typeof users.$inferSelect
}

// Legacy alias for backward compatibility
export interface P2PListingWithUser extends EscrowListingWithUser {}

// Listing filters for search
export interface ListingFilters {
  listingCategory?: ListingCategory
  listingType?: 'buy' | 'sell' // For P2P
  tokenOffered?: string // For P2P
  minAmount?: string
  maxAmount?: string
  paymentMethod?: string
  userId?: number
  isActive?: boolean
  domainName?: string // For domains
  registrar?: string // For domains
}

// Legacy alias for backward compatibility
export interface P2PListingFilters
  extends Omit<
    ListingFilters,
    'listingCategory' | 'domainName' | 'registrar'
  > {}

// Payment methods enum - for P2P trades
export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  PAYPAL: 'paypal',
  CRYPTO: 'crypto',
  CASH: 'cash',
  MOBILE_PAYMENT: 'mobile_payment',
  WIRE_TRANSFER: 'wire_transfer'
} as const

// P2P specific payment methods (all methods)
export const P2P_PAYMENT_METHODS = PAYMENT_METHODS

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

// Domain registrars
export const DOMAIN_REGISTRARS = {
  GODADDY: 'GoDaddy',
  NAMECHEAP: 'Namecheap',
  GOOGLE_DOMAINS: 'Google Domains',
  CLOUDFLARE: 'Cloudflare',
  GANDI: 'Gandi',
  ENOM: 'eNom',
  HOSTINGER: 'Hostinger',
  BLUEHOST: 'Bluehost',
  NETWORK_SOLUTIONS: 'Network Solutions',
  OTHER: 'Other'
} as const

export type DomainRegistrar =
  (typeof DOMAIN_REGISTRARS)[keyof typeof DOMAIN_REGISTRARS]

// Response types
export interface CreateListingResponse {
  success: boolean
  listing?: EscrowListing
  error?: string
}

export interface AcceptListingResponse {
  success: boolean
  trade?: Trade
  error?: string
}

// Type guards
export function isValidListingCategory(
  category: string
): category is ListingCategory {
  return Object.values(LISTING_CATEGORIES).includes(category as ListingCategory)
}

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

export function isValidDomainRegistrar(
  registrar: string
): registrar is DomainRegistrar {
  return Object.values(DOMAIN_REGISTRARS).includes(registrar as DomainRegistrar)
}
