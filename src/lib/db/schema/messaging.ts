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

import { users } from './core'

export const emailVerificationRequests = pgTable(
  'email_verification_requests',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  }
)

export const messages = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),
    contextType: varchar('context_type', { length: 50 }).notNull(),
    contextId: varchar('context_id', { length: 255 }).notNull(),
    senderId: integer('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content'),
    messageType: varchar('message_type', { length: 50 })
      .notNull()
      .default('text'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    editedAt: timestamp('edited_at'),
    deletedAt: timestamp('deleted_at'),
    jobPostingId: integer('job_posting_id'),
    bidId: integer('bid_id'),
    milestoneId: integer('milestone_id'),
    isSystemMessage: boolean('is_system_message').notNull().default(false)
  },
  table => [
    index('idx_messages_context').on(table.contextType, table.contextId),
    index('idx_messages_created').on(table.createdAt),
    index('idx_messages_job_posting').on(table.jobPostingId),
    index('idx_messages_bid').on(table.bidId)
  ]
)

export const messageReads = pgTable(
  'message_reads',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contextType: varchar('context_type', { length: 50 }).notNull(),
    contextId: varchar('context_id', { length: 255 }).notNull(),
    lastReadMessageId: integer('last_read_message_id').references(
      () => messages.id,
      { onDelete: 'set null' }
    ),
    lastReadAt: timestamp('last_read_at').notNull().defaultNow()
  },
  table => [unique().on(table.userId, table.contextType, table.contextId)]
)

export const attachments = pgTable(
  'attachments',
  {
    id: serial('id').primaryKey(),
    messageId: integer('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    path: text('path').notNull(),
    size: integer('size').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [index('idx_attachments_message').on(table.messageId)]
)
