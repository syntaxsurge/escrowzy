import { relations } from 'drizzle-orm'
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

/*
Tables
*/

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull().unique(),
  email: varchar('email', { length: 255 }).unique(),
  name: varchar('name', { length: 100 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  emailVerified: boolean('email_verified').notNull().default(false),
  avatarPath: text('avatar_path'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  planId: varchar('plan_id', { length: 50 }).notNull().default('free'),
  isTeamPlan: boolean('is_team_plan').notNull().default(false),
  teamOwnerId: integer('team_owner_id').references(() => users.id),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow()
})

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  // Notification-specific fields
  read: boolean('read').notNull().default(false),
  notificationType: varchar('notification_type', { length: 50 }),
  title: text('title'),
  message: text('message'),
  actionUrl: text('action_url'),
  metadata: jsonb('metadata')
})

export const teamInvitations = pgTable('team_invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  invitedByUserId: integer('invited_by_user_id')
    .notNull()
    .references(() => users.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 10 }).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  permissions: jsonb('permissions').notNull().default('[]'),
  rateLimitPerHour: integer('rate_limit_per_hour').notNull().default(1000),
  usageCount: integer('usage_count').notNull().default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const paymentHistory = pgTable('payment_history', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
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
    .references(() => users.id),
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
  updatedByUserId: integer('updated_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const emailVerificationRequests = pgTable(
  'email_verification_requests',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
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
      .references(() => users.id),
    content: text('content'),
    messageType: varchar('message_type', { length: 50 })
      .notNull()
      .default('text'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    editedAt: timestamp('edited_at'),
    deletedAt: timestamp('deleted_at')
  },
  table => [
    index('idx_messages_context').on(table.contextType, table.contextId),
    index('idx_messages_created').on(table.createdAt)
  ]
)

export const messageReads = pgTable(
  'message_reads',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    contextType: varchar('context_type', { length: 50 }).notNull(),
    contextId: varchar('context_id', { length: 255 }).notNull(),
    lastReadMessageId: integer('last_read_message_id').references(
      () => messages.id
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
      .references(() => messages.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    path: text('path').notNull(),
    size: integer('size').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [index('idx_attachments_message').on(table.messageId)]
)

export const userGameData = pgTable(
  'user_game_data',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id)
      .unique(),
    xp: integer('xp').notNull().default(0),
    level: integer('level').notNull().default(1),
    combatPower: integer('combat_power').notNull().default(100),
    loginStreak: integer('login_streak').notNull().default(0),
    lastLoginDate: timestamp('last_login_date'),
    totalLogins: integer('total_logins').notNull().default(0),
    achievements: jsonb('achievements').notNull().default('{}'),
    questProgress: jsonb('quest_progress').notNull().default('{}'),
    stats: jsonb('stats').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [index('idx_user_game_data_user').on(table.userId)]
)

export const achievementNFTs = pgTable(
  'achievement_nfts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    achievementId: varchar('achievement_id', { length: 50 }).notNull(),
    tokenId: integer('token_id'),
    mintedAt: timestamp('minted_at').notNull().defaultNow(),
    txHash: varchar('tx_hash', { length: 66 })
  },
  table => [
    index('idx_achievement_nfts_user').on(table.userId),
    unique().on(table.userId, table.achievementId)
  ]
)

export const platformContracts = pgTable(
  'platform_contracts',
  {
    id: serial('id').primaryKey(),
    chainId: integer('chain_id').notNull(),
    chainName: varchar('chain_name', { length: 50 }).notNull(),
    contractType: varchar('contract_type', { length: 50 }).notNull(),
    contractAddress: varchar('contract_address', { length: 66 }).notNull(),
    deployedAt: timestamp('deployed_at').notNull().defaultNow(),
    isActive: boolean('is_active').notNull().default(true)
  },
  table => [unique().on(table.chainId, table.contractType)]
)

export const trades = pgTable(
  'trades',
  {
    id: serial('id').primaryKey(),
    escrowId: integer('escrow_id'),
    chainId: integer('chain_id').notNull(),
    buyerId: integer('buyer_id')
      .notNull()
      .references(() => users.id),
    sellerId: integer('seller_id')
      .notNull()
      .references(() => users.id),
    amount: varchar('amount', { length: 50 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('XTZ'),
    // The category of assets being traded: 'p2p' (crypto/fiat) | 'domain' (domain names)
    listingCategory: varchar('listing_category', { length: 20 })
      .notNull()
      .default('p2p'), // 'p2p' | 'domain'
    status: varchar('status', { length: 50 }).notNull().default('created'),
    metadata: jsonb('metadata'),
    depositDeadline: timestamp('deposit_deadline'),
    depositedAt: timestamp('deposited_at'),
    paymentSentAt: timestamp('payment_sent_at'),
    paymentConfirmedAt: timestamp('payment_confirmed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at')
  },
  table => [
    index('idx_trades_escrow').on(table.chainId, table.escrowId),
    index('idx_trades_status').on(table.status),
    index('idx_trades_buyer').on(table.buyerId),
    index('idx_trades_seller').on(table.sellerId),
    index('idx_trades_deposit_deadline').on(table.depositDeadline),
    index('idx_trades_category').on(table.listingCategory)
  ]
)

export const escrowListings = pgTable(
  'escrow_listings',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    // The category of assets being listed: 'p2p' (crypto/fiat) | 'domain' (domain names)
    listingCategory: varchar('listing_category', { length: 20 })
      .notNull()
      .default('p2p'), // 'p2p' | 'domain'
    // The direction of the trade: 'buy' (creator wants to buy) | 'sell' (creator wants to sell)
    listingType: varchar('listing_type', { length: 10 }).notNull(), // 'buy' | 'sell'
    tokenOffered: varchar('token_offered', { length: 10 }), // For P2P trading
    amount: varchar('amount', { length: 50 }), // Amount or price
    pricePerUnit: varchar('price_per_unit', { length: 50 }), // For P2P
    minAmount: varchar('min_amount', { length: 50 }),
    maxAmount: varchar('max_amount', { length: 50 }),
    paymentMethods: jsonb('payment_methods').notNull().default('[]'),
    paymentWindow: integer('payment_window').notNull().default(15), // in minutes
    metadata: jsonb('metadata').notNull().default('{}'), // Domain-specific data
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

export const battles = pgTable(
  'battles',
  {
    id: serial('id').primaryKey(),
    player1Id: integer('player1_id')
      .notNull()
      .references(() => users.id),
    player2Id: integer('player2_id')
      .notNull()
      .references(() => users.id),
    winnerId: integer('winner_id').references(() => users.id),
    player1CP: integer('player1_cp').notNull(),
    player2CP: integer('player2_cp').notNull(),
    feeDiscountPercent: integer('fee_discount_percent'),
    discountExpiresAt: timestamp('discount_expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_battles_player1').on(table.player1Id),
    index('idx_battles_player2').on(table.player2Id),
    index('idx_battles_winner').on(table.winnerId)
  ]
)

export const userTradingStats = pgTable(
  'user_trading_stats',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id)
      .unique(),
    totalTrades: integer('total_trades').notNull().default(0),
    successfulTrades: integer('successful_trades').notNull().default(0),
    totalVolume: varchar('total_volume', { length: 50 }).notNull().default('0'),
    avgCompletionTime: integer('avg_completion_time'),
    disputesWon: integer('disputes_won').notNull().default(0),
    disputesLost: integer('disputes_lost').notNull().default(0),
    rating: integer('rating').notNull().default(5),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [index('idx_user_trading_stats_user').on(table.userId)]
)

/*
Relations
*/

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(teamInvitations),
  paymentHistory: many(paymentHistory)
}))

export const usersRelations = relations(users, ({ many, one }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  sentInvitations: many(teamInvitations),
  paymentHistory: many(paymentHistory),
  subscriptions: many(userSubscriptions),
  emailVerificationRequests: many(emailVerificationRequests),
  messages: many(messages),
  messageReads: many(messageReads),
  gameData: one(userGameData, {
    fields: [users.id],
    references: [userGameData.userId]
  }),
  achievementNFTs: many(achievementNFTs),
  tradesAsBuyer: many(trades, { relationName: 'buyer' }),
  tradesAsSeller: many(trades, { relationName: 'seller' }),
  escrowListings: many(escrowListings),
  battlesAsPlayer1: many(battles, { relationName: 'player1' }),
  battlesAsPlayer2: many(battles, { relationName: 'player2' }),
  battlesWon: many(battles, { relationName: 'winner' }),
  tradingStats: one(userTradingStats, {
    fields: [users.id],
    references: [userTradingStats.userId]
  })
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id]
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id]
  })
}))

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id]
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id]
  })
}))

export const teamInvitationsRelations = relations(
  teamInvitations,
  ({ one }) => ({
    team: one(teams, {
      fields: [teamInvitations.teamId],
      references: [teams.id]
    }),
    invitedBy: one(users, {
      fields: [teamInvitations.invitedByUserId],
      references: [users.id]
    })
  })
)

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
  team: one(teams, {
    fields: [paymentHistory.teamId],
    references: [teams.id]
  }),
  user: one(users, {
    fields: [paymentHistory.userId],
    references: [users.id]
  })
}))

export const userSubscriptionsRelations = relations(
  userSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [userSubscriptions.userId],
      references: [users.id]
    })
  })
)

export const adminSettingsRelations = relations(adminSettings, ({ one }) => ({
  updatedBy: one(users, {
    fields: [adminSettings.updatedByUserId],
    references: [users.id]
  })
}))

export const emailVerificationRequestsRelations = relations(
  emailVerificationRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [emailVerificationRequests.userId],
      references: [users.id]
    })
  })
)

export const messagesRelations = relations(messages, ({ one, many }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id]
  }),
  messageReads: many(messageReads),
  attachments: many(attachments)
}))

export const messageReadsRelations = relations(messageReads, ({ one }) => ({
  user: one(users, {
    fields: [messageReads.userId],
    references: [users.id]
  }),
  message: one(messages, {
    fields: [messageReads.lastReadMessageId],
    references: [messages.id]
  })
}))

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  message: one(messages, {
    fields: [attachments.messageId],
    references: [messages.id]
  }),
  user: one(users, {
    fields: [attachments.userId],
    references: [users.id]
  })
}))

export const userGameDataRelations = relations(userGameData, ({ one }) => ({
  user: one(users, {
    fields: [userGameData.userId],
    references: [users.id]
  })
}))

export const achievementNFTsRelations = relations(
  achievementNFTs,
  ({ one }) => ({
    user: one(users, {
      fields: [achievementNFTs.userId],
      references: [users.id]
    })
  })
)

export const platformContractsRelations = relations(
  platformContracts,
  () => ({})
)

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id]
  }),
  team: one(teams, {
    fields: [apiKeys.teamId],
    references: [teams.id]
  })
}))

export const tradesRelations = relations(trades, ({ one }) => ({
  buyer: one(users, {
    fields: [trades.buyerId],
    references: [users.id],
    relationName: 'buyer'
  }),
  seller: one(users, {
    fields: [trades.sellerId],
    references: [users.id],
    relationName: 'seller'
  })
}))

export const escrowListingsRelations = relations(escrowListings, ({ one }) => ({
  user: one(users, {
    fields: [escrowListings.userId],
    references: [users.id]
  })
}))

export const battlesRelations = relations(battles, ({ one }) => ({
  player1: one(users, {
    fields: [battles.player1Id],
    references: [users.id],
    relationName: 'player1'
  }),
  player2: one(users, {
    fields: [battles.player2Id],
    references: [users.id],
    relationName: 'player2'
  }),
  winner: one(users, {
    fields: [battles.winnerId],
    references: [users.id],
    relationName: 'winner'
  })
}))

export const userTradingStatsRelations = relations(
  userTradingStats,
  ({ one }) => ({
    user: one(users, {
      fields: [userTradingStats.userId],
      references: [users.id]
    })
  })
)

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'walletAddress' | 'email'>
  })[]
}

export enum ActivityType {
  // Security activities
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  SIGN_UP = 'SIGN_UP',
  WALLET_CONNECTED = 'WALLET_CONNECTED',
  WALLET_DISCONNECTED = 'WALLET_DISCONNECTED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_UPDATED_BY_ADMIN = 'USER_UPDATED_BY_ADMIN',
  USER_DELETED_BY_ADMIN = 'USER_DELETED_BY_ADMIN',
  BULK_USER_ROLES_UPDATED = 'BULK_USER_ROLES_UPDATED',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  UPDATE_PROFILE = 'UPDATE_PROFILE',

  // Team activities
  CREATE_TEAM = 'CREATE_TEAM',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  REJECT_INVITATION = 'REJECT_INVITATION',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  UPDATE_TEAM_MEMBER_ROLE = 'UPDATE_TEAM_MEMBER_ROLE',
  TEAM_CREATED = 'TEAM_CREATED',
  TEAM_UPDATED = 'TEAM_UPDATED',
  TEAM_DELETED = 'TEAM_DELETED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',

  // Billing activities
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  SUBSCRIPTION_ACTIVATED = 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_CANCELED = 'SUBSCRIPTION_CANCELED',
  SUBSCRIPTION_UPGRADED = 'SUBSCRIPTION_UPGRADED',
  SUBSCRIPTION_UPDATED_BY_ADMIN = 'SUBSCRIPTION_UPDATED_BY_ADMIN',
  TEAM_PLAN_DOWNGRADED = 'TEAM_PLAN_DOWNGRADED',
  SUBSCRIPTION_DOWNGRADED = 'SUBSCRIPTION_DOWNGRADED',

  // Trade activities
  TRADE_CREATED = 'TRADE_CREATED',
  TRADE_FUNDED = 'TRADE_FUNDED',
  TRADE_DELIVERED = 'TRADE_DELIVERED',
  TRADE_COMPLETED = 'TRADE_COMPLETED',
  TRADE_DISPUTED = 'TRADE_DISPUTED',
  TRADE_REFUNDED = 'TRADE_REFUNDED',
  TRADE_CANCELLED = 'TRADE_CANCELLED',

  // Listing activities
  LISTING_CREATED = 'LISTING_CREATED',
  LISTING_UPDATED = 'LISTING_UPDATED',
  LISTING_DELETED = 'LISTING_DELETED',
  LISTING_ACCEPTED = 'LISTING_ACCEPTED',

  // Chat/Message activities
  NEW_MESSAGE = 'NEW_MESSAGE',
  UNREAD_MESSAGES = 'UNREAD_MESSAGES',
  MESSAGE_DELETED = 'MESSAGE_DELETED',

  // Battle activities
  BATTLE_MATCH_FOUND = 'BATTLE_MATCH_FOUND',
  BATTLE_STARTED = 'BATTLE_STARTED',
  BATTLE_WON = 'BATTLE_WON',
  BATTLE_LOST = 'BATTLE_LOST',
  BATTLE_DRAW = 'BATTLE_DRAW',

  // Team notification activities
  TEAM_INVITATION = 'TEAM_INVITATION',
  TEAM_JOINED = 'TEAM_JOINED',
  TEAM_LEFT = 'TEAM_LEFT',
  TEAM_KICKED = 'TEAM_KICKED',
  UPDATE_TEAM_ROLE = 'UPDATE_TEAM_ROLE'
}

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert
export type TeamMember = typeof teamMembers.$inferSelect
export type NewTeamMember = typeof teamMembers.$inferInsert
export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert
export type TeamInvitation = typeof teamInvitations.$inferSelect
export type NewTeamInvitation = typeof teamInvitations.$inferInsert
export type PaymentHistory = typeof paymentHistory.$inferSelect
export type NewPaymentHistory = typeof paymentHistory.$inferInsert
export type AdminSetting = typeof adminSettings.$inferSelect
export type NewAdminSetting = typeof adminSettings.$inferInsert
export type EmailVerificationRequest =
  typeof emailVerificationRequests.$inferSelect
export type NewEmailVerificationRequest =
  typeof emailVerificationRequests.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type MessageRead = typeof messageReads.$inferSelect
export type NewMessageRead = typeof messageReads.$inferInsert
export type UserGameData = typeof userGameData.$inferSelect
export type NewUserGameData = typeof userGameData.$inferInsert
export type AchievementNFT = typeof achievementNFTs.$inferSelect
export type NewAchievementNFT = typeof achievementNFTs.$inferInsert
export type PlatformContract = typeof platformContracts.$inferSelect
export type NewPlatformContract = typeof platformContracts.$inferInsert
export type Trade = typeof trades.$inferSelect
export type NewTrade = typeof trades.$inferInsert
export type EscrowListing = typeof escrowListings.$inferSelect
export type NewEscrowListing = typeof escrowListings.$inferInsert
export type Battle = typeof battles.$inferSelect
export type NewBattle = typeof battles.$inferInsert
export type UserTradingStats = typeof userTradingStats.$inferSelect
export type NewUserTradingStats = typeof userTradingStats.$inferInsert
