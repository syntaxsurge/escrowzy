import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index
} from 'drizzle-orm/pg-core'

import { users } from './core'

export const trades = pgTable(
  'trades',
  {
    id: serial('id').primaryKey(),
    escrowId: integer('escrow_id'),
    chainId: integer('chain_id').notNull(),
    buyerId: integer('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sellerId: integer('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: varchar('amount', { length: 50 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default(''),
    listingCategory: varchar('listing_category', { length: 20 })
      .notNull()
      .default('p2p'),
    status: varchar('status', { length: 50 }).notNull().default('created'),
    metadata: jsonb('metadata'),
    depositDeadline: timestamp('deposit_deadline'),
    depositedAt: timestamp('deposited_at'),
    paymentSentAt: timestamp('payment_sent_at'),
    paymentConfirmedAt: timestamp('payment_confirmed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    jobPostingId: integer('job_posting_id'),
    bidId: integer('bid_id'),
    milestoneId: integer('milestone_id'),
    deliverables: jsonb('deliverables').default('[]'),
    revisionCount: integer('revision_count').default(0),
    freelancerDeliveredAt: timestamp('freelancer_delivered_at'),
    clientApprovedAt: timestamp('client_approved_at'),
    disputeReason: text('dispute_reason'),
    disputedAt: timestamp('disputed_at')
  },
  table => [
    index('idx_trades_escrow').on(table.chainId, table.escrowId),
    index('idx_trades_status').on(table.status),
    index('idx_trades_buyer').on(table.buyerId),
    index('idx_trades_seller').on(table.sellerId),
    index('idx_trades_deposit_deadline').on(table.depositDeadline),
    index('idx_trades_category').on(table.listingCategory),
    index('idx_trades_job_posting').on(table.jobPostingId),
    index('idx_trades_bid').on(table.bidId),
    index('idx_trades_milestone').on(table.milestoneId)
  ]
)

export const escrowListings = pgTable(
  'escrow_listings',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    listingCategory: varchar('listing_category', { length: 20 })
      .notNull()
      .default('p2p'),
    listingType: varchar('listing_type', { length: 10 }).notNull(),
    chainId: varchar('chain_id', { length: 20 }),
    tokenAddress: varchar('token_address', { length: 255 }),
    tokenOffered: varchar('token_offered', { length: 10 }),
    amount: varchar('amount', { length: 50 }),
    pricePerUnit: varchar('price_per_unit', { length: 50 }),
    minAmount: varchar('min_amount', { length: 50 }),
    maxAmount: varchar('max_amount', { length: 50 }),
    paymentMethods: jsonb('payment_methods').notNull().default('[]'),
    paymentWindow: integer('payment_window').notNull().default(15),
    metadata: jsonb('metadata').notNull().default('{}'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_escrow_listings_user').on(table.userId),
    index('idx_escrow_listings_active').on(table.isActive),
    index('idx_escrow_listings_type').on(table.listingType),
    index('idx_escrow_listings_category').on(table.listingCategory)
  ]
)
