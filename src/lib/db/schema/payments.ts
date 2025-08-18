import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  unique
} from 'drizzle-orm/pg-core'

import { users, teams } from './core'

export const paymentHistory = pgTable('payment_history', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  planId: varchar('plan_id', { length: 50 }).notNull(),
  transactionHash: varchar('transaction_hash', { length: 66 }).notNull(),
  chainId: integer('chain_id').notNull(),
  amount: varchar('amount', { length: 50 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export const userSubscriptions = pgTable('user_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  planId: varchar('plan_id', { length: 50 }).notNull(),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const adminSettings = pgTable('admin_settings', {
  id: serial('id').primaryKey(),
  category: varchar('category', { length: 50 }).notNull(),
  key: varchar('key', { length: 100 }).notNull(),
  value: text('value'),
  metadata: text('metadata'),
  updatedByUserId: integer('updated_by_user_id').references(() => users.id, {
    onDelete: 'set null'
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const earnings = pgTable(
  'earnings',
  {
    id: serial('id').primaryKey(),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: integer('job_id'),
    milestoneId: integer('milestone_id'),
    invoiceId: integer('invoice_id'),
    amount: varchar('amount', { length: 50 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    type: varchar('type', { length: 50 }).notNull().default('milestone'),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    availableAt: timestamp('available_at'),
    platformFee: varchar('platform_fee', { length: 50 }),
    netAmount: varchar('net_amount', { length: 50 }).notNull(),
    description: text('description'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_earnings_freelancer').on(table.freelancerId),
    index('idx_earnings_job').on(table.jobId),
    index('idx_earnings_milestone').on(table.milestoneId),
    index('idx_earnings_status').on(table.status),
    index('idx_earnings_available_at').on(table.availableAt)
  ]
)

export const withdrawals = pgTable(
  'withdrawals',
  {
    id: serial('id').primaryKey(),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: varchar('amount', { length: 50 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    method: varchar('method', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    destinationAccount: text('destination_account').notNull(),
    transactionId: varchar('transaction_id', { length: 100 }),
    fee: varchar('fee', { length: 50 }),
    netAmount: varchar('net_amount', { length: 50 }).notNull(),
    processedAt: timestamp('processed_at'),
    failureReason: text('failure_reason'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_withdrawals_freelancer').on(table.freelancerId),
    index('idx_withdrawals_status').on(table.status),
    index('idx_withdrawals_created').on(table.createdAt)
  ]
)

export const paymentReminders = pgTable(
  'payment_reminders',
  {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id').notNull(),
    recipientId: integer('recipient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reminderType: varchar('reminder_type', { length: 50 }).notNull(),
    sentAt: timestamp('sent_at'),
    viewedAt: timestamp('viewed_at'),
    scheduledFor: timestamp('scheduled_for').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('scheduled'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_payment_reminders_invoice').on(table.invoiceId),
    index('idx_payment_reminders_recipient').on(table.recipientId),
    index('idx_payment_reminders_scheduled').on(table.scheduledFor),
    index('idx_payment_reminders_status').on(table.status)
  ]
)

export const taxDocuments = pgTable(
  'tax_documents',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    documentType: varchar('document_type', { length: 50 }).notNull(),
    documentUrl: text('document_url'),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    taxInfo: jsonb('tax_info').notNull().default('{}'),
    totalEarnings: varchar('total_earnings', { length: 50 }),
    totalTaxWithheld: varchar('total_tax_withheld', { length: 50 }),
    generatedAt: timestamp('generated_at'),
    sentAt: timestamp('sent_at'),
    acknowledgedAt: timestamp('acknowledged_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_tax_documents_user').on(table.userId),
    index('idx_tax_documents_year').on(table.year),
    index('idx_tax_documents_type').on(table.documentType),
    unique('unique_tax_document').on(
      table.userId,
      table.year,
      table.documentType
    )
  ]
)
