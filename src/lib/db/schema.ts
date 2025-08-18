import 'server-only'

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
  unique,
  bigint,
  decimal,
  uniqueIndex
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
  location: varchar('location', { length: 100 }), // User's location (city, country)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastActiveAt: timestamp('last_active_at').notNull().defaultNow()
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
    contextType: varchar('context_type', { length: 50 }).notNull(), // Extended to support: 'trade' | 'team' | 'direct' | 'job_proposal' | 'job_workspace'
    contextId: varchar('context_id', { length: 255 }).notNull(),
    senderId: integer('sender_id')
      .notNull()
      .references(() => users.id),
    content: text('content'),
    messageType: varchar('message_type', { length: 50 })
      .notNull()
      .default('text'), // Extended to support: 'text' | 'image' | 'file' | 'proposal' | 'milestone_submission' | 'revision_request'
    metadata: jsonb('metadata'), // Extended to include proposal details, milestone info, etc.
    createdAt: timestamp('created_at').notNull().defaultNow(),
    editedAt: timestamp('edited_at'),
    deletedAt: timestamp('deleted_at'),
    // Freelancer marketplace specific fields
    jobPostingId: integer('job_posting_id').references(() => jobPostings.id),
    bidId: integer('bid_id').references(() => jobBids.id),
    milestoneId: integer('milestone_id').references(() => jobMilestones.id),
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
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    // Freelancer marketplace specific fields
    freelancerStats: jsonb('freelancer_stats')
      .notNull()
      .default(
        '{"jobsCompleted": 0, "totalEarnings": "0", "avgRating": 0, "onTimeDelivery": 0, "repeatClients": 0}'
      ),
    freelancerAchievements: jsonb('freelancer_achievements')
      .notNull()
      .default('[]'),
    freelancerLevel: integer('freelancer_level').notNull().default(1),
    freelancerXp: integer('freelancer_xp').notNull().default(0)
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
    // Default currency should match the primary chain's native currency
    currency: varchar('currency', { length: 10 }).notNull().default(''),
    // The category of assets being traded: 'p2p' (crypto/fiat) | 'domain' (domain names) | 'service' (freelance services)
    listingCategory: varchar('listing_category', { length: 20 })
      .notNull()
      .default('p2p'), // 'p2p' | 'domain' | 'service'
    status: varchar('status', { length: 50 }).notNull().default('created'),
    metadata: jsonb('metadata'),
    depositDeadline: timestamp('deposit_deadline'),
    depositedAt: timestamp('deposited_at'),
    paymentSentAt: timestamp('payment_sent_at'),
    paymentConfirmedAt: timestamp('payment_confirmed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    // Freelancer marketplace specific fields
    jobPostingId: integer('job_posting_id').references(() => jobPostings.id),
    bidId: integer('bid_id').references(() => jobBids.id),
    milestoneId: integer('milestone_id').references(() => jobMilestones.id),
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
      .references(() => users.id),
    // The category of assets being listed: 'p2p' (crypto/fiat) | 'domain' (domain names) | 'service' (freelance services)
    listingCategory: varchar('listing_category', { length: 20 })
      .notNull()
      .default('p2p'), // 'p2p' | 'domain' | 'service'
    // The direction of the trade: 'buy' (creator wants to buy) | 'sell' (creator wants to sell)
    listingType: varchar('listing_type', { length: 10 }).notNull(), // 'buy' | 'sell'
    chainId: varchar('chain_id', { length: 20 }), // Chain ID for the listing
    tokenAddress: varchar('token_address', { length: 255 }), // Token contract address
    tokenOffered: varchar('token_offered', { length: 10 }), // For P2P trading
    amount: varchar('amount', { length: 50 }), // Amount or price
    pricePerUnit: varchar('price_per_unit', { length: 50 }), // For P2P
    minAmount: varchar('min_amount', { length: 50 }),
    maxAmount: varchar('max_amount', { length: 50 }),
    paymentMethods: jsonb('payment_methods').notNull().default('[]'),
    paymentWindow: integer('payment_window').notNull().default(15), // in minutes
    metadata: jsonb('metadata').notNull().default('{}'), // Domain-specific data
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // Freelancer marketplace specific fields
    jobPostingId: integer('job_posting_id').references(() => jobPostings.id),
    serviceTitle: varchar('service_title', { length: 200 }),
    serviceDescription: text('service_description'),
    serviceCategoryId: integer('service_category_id').references(
      () => jobCategories.id
    ),
    deliveryTime: integer('delivery_time_days'),
    revisions: integer('revisions').default(0),
    skillsOffered: jsonb('skills_offered').default('[]')
  },
  table => [
    index('idx_escrow_listings_user').on(table.userId),
    index('idx_escrow_listings_active').on(table.isActive),
    index('idx_escrow_listings_type').on(table.listingType),
    index('idx_escrow_listings_category').on(table.listingCategory),
    index('idx_escrow_listings_job_posting').on(table.jobPostingId),
    index('idx_escrow_listings_service_category').on(table.serviceCategoryId)
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
    status: text('status')
      .notNull()
      .default('preparing')
      .$type<'preparing' | 'ongoing' | 'completed' | 'cancelled'>(),
    endReason: text('end_reason').$type<'hp' | 'timeout' | null>(),
    feeDiscountPercent: integer('fee_discount_percent'),
    discountExpiresAt: timestamp('discount_expires_at'),
    winnerXP: integer('winner_xp').notNull().default(50),
    loserXP: integer('loser_xp').notNull().default(10),
    winnerCP: integer('winner_cp').notNull().default(10),
    loserCP: integer('loser_cp').notNull().default(-5),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_battles_player1').on(table.player1Id),
    index('idx_battles_player2').on(table.player2Id),
    index('idx_battles_winner').on(table.winnerId),
    index('idx_battles_status').on(table.status)
  ]
)

export const battleStates = pgTable(
  'battle_states',
  {
    id: serial('id').primaryKey(),
    battleId: integer('battle_id')
      .notNull()
      .references(() => battles.id)
      .unique(),
    currentRound: integer('current_round').notNull().default(0),
    player1Health: integer('player1_health').notNull().default(100),
    player2Health: integer('player2_health').notNull().default(100),
    player1Actions: jsonb('player1_actions').notNull().default('[]'),
    player2Actions: jsonb('player2_actions').notNull().default('[]'),
    player1Energy: integer('player1_energy').notNull().default(0),
    player2Energy: integer('player2_energy').notNull().default(0),
    player1DefenseEnergy: integer('player1_defense_energy')
      .notNull()
      .default(0),
    player2DefenseEnergy: integer('player2_defense_energy')
      .notNull()
      .default(0),
    player1StoredEnergy: integer('player1_stored_energy').notNull().default(0),
    player2StoredEnergy: integer('player2_stored_energy').notNull().default(0),
    player1StoredDefenseEnergy: integer('player1_stored_defense_energy')
      .notNull()
      .default(0),
    player2StoredDefenseEnergy: integer('player2_stored_defense_energy')
      .notNull()
      .default(0),
    // Total attack and defend counts
    player1TotalAttacks: integer('player1_total_attacks').notNull().default(0),
    player2TotalAttacks: integer('player2_total_attacks').notNull().default(0),
    player1TotalDefends: integer('player1_total_defends').notNull().default(0),
    player2TotalDefends: integer('player2_total_defends').notNull().default(0),
    roundHistory: jsonb('round_history').notNull().default('[]'),
    battleLog: jsonb('battle_log').notNull().default('[]'),
    lastActionAt: timestamp('last_action_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_battle_states_battle').on(table.battleId),
    index('idx_battle_states_updated').on(table.updatedAt)
  ]
)

export const jobQueue = pgTable(
  'job_queue',
  {
    id: serial('id').primaryKey(),
    type: varchar('type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull().default('{}'),
    status: varchar('status', { length: 20 })
      .notNull()
      .default('pending')
      .$type<'pending' | 'processing' | 'completed' | 'failed'>(),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    scheduledAt: timestamp('scheduled_at').notNull().defaultNow(),
    availableAt: timestamp('available_at').notNull().defaultNow(),
    processedAt: timestamp('processed_at'),
    failedAt: timestamp('failed_at'),
    completedAt: timestamp('completed_at'),
    error: text('error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_job_queue_status').on(table.status),
    index('idx_job_queue_type').on(table.type),
    index('idx_job_queue_available').on(table.availableAt, table.status),
    index('idx_job_queue_scheduled').on(table.scheduledAt)
  ]
)

export const battleRounds = pgTable(
  'battle_rounds',
  {
    id: serial('id').primaryKey(),
    battleId: integer('battle_id')
      .notNull()
      .references(() => battles.id),
    roundNumber: integer('round_number').notNull(),
    // Both players' actions
    player1Action: text('player1_action').notNull().default('attack'), // 'attack' or 'defend'
    player2Action: text('player2_action').notNull().default('attack'), // 'attack' or 'defend'
    // Damage taken by each player
    player1Damage: integer('player1_damage').notNull().default(0),
    player2Damage: integer('player2_damage').notNull().default(0),
    // Critical hit flags for each player
    player1Critical: boolean('player1_critical').notNull().default(false),
    player2Critical: boolean('player2_critical').notNull().default(false),
    // Total counts of attacks and defends used
    player1AttackCount: integer('player1_attack_count').notNull().default(0),
    player2AttackCount: integer('player2_attack_count').notNull().default(0),
    player1DefendCount: integer('player1_defend_count').notNull().default(0),
    player2DefendCount: integer('player2_defend_count').notNull().default(0),
    // Health after round
    player1Health: integer('player1_health').notNull(),
    player2Health: integer('player2_health').notNull(),
    processedAt: timestamp('processed_at').notNull().defaultNow()
  },
  table => [
    index('idx_battle_rounds_battle').on(table.battleId),
    index('idx_battle_rounds_number').on(table.battleId, table.roundNumber),
    unique('unique_battle_round').on(table.battleId, table.roundNumber)
  ]
)

export const battleQueue = pgTable(
  'battle_queue',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id)
      .unique(), // User can only be in queue once
    combatPower: integer('combat_power').notNull(),
    minCP: integer('min_cp').notNull(), // Pre-calculated min CP for matching
    maxCP: integer('max_cp').notNull(), // Pre-calculated max CP for matching
    matchRange: integer('match_range').notNull().default(20), // Percentage range
    searchStartedAt: timestamp('search_started_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(), // Auto-remove after timeout
    status: varchar('status', { length: 20 }).notNull().default('searching'), // searching, matched, expired
    matchedWithUserId: integer('matched_with_user_id').references(
      () => users.id
    ),
    queuePosition: integer('queue_position'), // Position in queue for display
    estimatedWaitTime: integer('estimated_wait_time') // Estimated wait in seconds
  },
  table => [
    index('idx_battle_queue_user').on(table.userId),
    index('idx_battle_queue_status').on(table.status),
    index('idx_battle_queue_cp_range').on(table.minCP, table.maxCP),
    index('idx_battle_queue_expires').on(table.expiresAt)
  ]
)

export const battleInvitations = pgTable(
  'battle_invitations',
  {
    id: serial('id').primaryKey(),
    fromUserId: integer('from_user_id')
      .notNull()
      .references(() => users.id),
    toUserId: integer('to_user_id')
      .notNull()
      .references(() => users.id),
    fromUserCP: integer('from_user_cp').notNull(),
    toUserCP: integer('to_user_cp').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, rejected, expired, cancelled
    expiresAt: timestamp('expires_at').notNull(), // Auto-expire after 30 seconds
    createdAt: timestamp('created_at').notNull().defaultNow(),
    respondedAt: timestamp('responded_at')
  },
  table => [
    index('idx_battle_invitations_from').on(table.fromUserId),
    index('idx_battle_invitations_to').on(table.toUserId),
    index('idx_battle_invitations_status').on(table.status),
    index('idx_battle_invitations_expires').on(table.expiresAt),
    unique('unique_active_invitation').on(
      table.fromUserId,
      table.toUserId,
      table.status
    )
  ]
)

export const battleSessionRejections = pgTable(
  'battle_session_rejections',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    rejectedUserId: integer('rejected_user_id')
      .notNull()
      .references(() => users.id),
    sessionId: varchar('session_id', { length: 255 }).notNull(), // Track by session
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull() // Auto-cleanup old rejections
  },
  table => [
    index('idx_battle_rejections_user').on(table.userId),
    index('idx_battle_rejections_rejected').on(table.rejectedUserId),
    index('idx_battle_rejections_session').on(table.sessionId),
    index('idx_battle_rejections_expires').on(table.expiresAt),
    unique('unique_session_rejection').on(
      table.userId,
      table.rejectedUserId,
      table.sessionId
    )
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

// Freelancer Marketplace Tables

export const jobCategories = pgTable(
  'job_categories',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    description: text('description'),
    parentCategoryId: integer('parent_category_id'),
    icon: varchar('icon', { length: 50 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_job_categories_slug').on(table.slug),
    index('idx_job_categories_parent').on(table.parentCategoryId)
  ]
)

export const skills = pgTable(
  'skills',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    categoryId: integer('category_id').references(() => jobCategories.id),
    description: text('description'),
    icon: varchar('icon', { length: 50 }),
    isVerifiable: boolean('is_verifiable').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [index('idx_skills_category').on(table.categoryId)]
)

export const freelancerProfiles = pgTable(
  'freelancer_profiles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    professionalTitle: varchar('professional_title', { length: 200 }),
    bio: text('bio'),
    hourlyRate: varchar('hourly_rate', { length: 50 }),
    availability: varchar('availability', { length: 50 })
      .notNull()
      .default('available'), // available | busy | away
    yearsOfExperience: integer('years_of_experience').notNull().default(0),
    languages: jsonb('languages').notNull().default('[]'), // [{language: "English", level: "native"}]
    timezone: varchar('timezone', { length: 50 }),
    portfolioUrl: text('portfolio_url'),
    linkedinUrl: text('linkedin_url'),
    githubUrl: text('github_url'),
    verificationStatus: varchar('verification_status', { length: 50 })
      .notNull()
      .default('unverified'), // unverified | pending | verified
    totalJobs: integer('total_jobs').notNull().default(0),
    totalEarnings: varchar('total_earnings', { length: 50 })
      .notNull()
      .default('0'),
    avgRating: integer('avg_rating').notNull().default(0), // Stored as integer (1-50 for 0.1-5.0)
    completionRate: integer('completion_rate').notNull().default(100), // percentage
    responseTime: integer('response_time'), // average in hours
    lastActiveAt: timestamp('last_active_at'),
    metadata: jsonb('metadata').notNull().default('{}'), // For templates, goals, and other flexible data
    profileViews: integer('profile_views').notNull().default(0), // Track profile views
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_freelancer_profiles_user').on(table.userId),
    index('idx_freelancer_profiles_availability').on(table.availability),
    index('idx_freelancer_profiles_rating').on(table.avgRating),
    index('idx_freelancer_profiles_verification').on(table.verificationStatus),
    index('idx_freelancer_profiles_created').on(table.createdAt)
  ]
)

export const profileDrafts = pgTable(
  'profile_drafts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [index('idx_profile_drafts_user').on(table.userId)]
)

export const freelancerSkills = pgTable(
  'freelancer_skills',
  {
    id: serial('id').primaryKey(),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => freelancerProfiles.id, { onDelete: 'cascade' }),
    skillId: integer('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    yearsOfExperience: integer('years_of_experience').notNull().default(0),
    skillLevel: varchar('skill_level', { length: 20 })
      .notNull()
      .default('intermediate'), // beginner | intermediate | expert
    isVerified: boolean('is_verified').notNull().default(false),
    verifiedAt: timestamp('verified_at'),
    endorsements: integer('endorsements').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_freelancer_skills_freelancer').on(table.freelancerId),
    index('idx_freelancer_skills_skill').on(table.skillId),
    index('idx_freelancer_skills_verified').on(table.isVerified),
    index('idx_freelancer_skills_level').on(table.skillLevel),
    unique('unique_freelancer_skill').on(table.freelancerId, table.skillId)
  ]
)

export const jobPostings = pgTable(
  'job_postings',
  {
    id: serial('id').primaryKey(),
    clientId: integer('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => jobCategories.id, { onDelete: 'restrict' }),
    budgetType: varchar('budget_type', { length: 20 }).notNull(), // fixed | hourly
    budgetMin: varchar('budget_min', { length: 50 }),
    budgetMax: varchar('budget_max', { length: 50 }),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    deadline: timestamp('deadline'),
    skillsRequired: jsonb('skills_required').notNull().default('[]'), // Array of skill IDs
    experienceLevel: varchar('experience_level', { length: 50 })
      .notNull()
      .default('intermediate'), // entry | intermediate | expert
    projectDuration: varchar('project_duration', { length: 50 }), // hours | days | weeks | months
    visibility: varchar('visibility', { length: 20 })
      .notNull()
      .default('public'), // public | private | invited
    status: varchar('status', { length: 50 }).notNull().default('draft'), // draft | open | in_progress | completed | cancelled
    escrowId: integer('escrow_id'), // Reference to onchain escrow
    chainId: integer('chain_id'),
    attachments: jsonb('attachments').notNull().default('[]'),
    metadata: jsonb('metadata').notNull().default('{}'),
    viewCount: integer('view_count').notNull().default(0),
    bidCount: integer('bid_count').notNull().default(0),
    avgBidAmount: varchar('avg_bid_amount', { length: 50 }),
    isFeatured: boolean('is_featured').notNull().default(false),
    featuredUntil: timestamp('featured_until'),
    freelancerId: integer('freelancer_id').references(() => users.id, {
      onDelete: 'set null'
    }), // Selected freelancer
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_job_postings_client').on(table.clientId),
    index('idx_job_postings_category').on(table.categoryId),
    index('idx_job_postings_status').on(table.status),
    index('idx_job_postings_visibility').on(table.visibility),
    index('idx_job_postings_freelancer').on(table.freelancerId),
    index('idx_job_postings_created').on(table.createdAt),
    index('idx_job_postings_deadline').on(table.deadline),
    index('idx_job_postings_budget').on(table.budgetMin, table.budgetMax)
  ]
)

export const jobMilestones = pgTable(
  'job_milestones',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    amount: varchar('amount', { length: 50 }).notNull(),
    dueDate: timestamp('due_date'),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending | in_progress | submitted | approved | disputed | cancelled
    submissionUrl: text('submission_url'),
    submissionNote: text('submission_note'),
    feedback: text('feedback'),
    escrowMilestoneId: integer('escrow_milestone_id'), // Onchain reference
    submittedAt: timestamp('submitted_at'),
    approvedAt: timestamp('approved_at'),
    paidAt: timestamp('paid_at'),
    sortOrder: integer('sort_order').notNull().default(0),
    autoReleaseEnabled: boolean('auto_release_enabled').notNull().default(true),
    disputedAt: timestamp('disputed_at'),
    refundedAt: timestamp('refunded_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_job_milestones_job').on(table.jobId),
    index('idx_job_milestones_status').on(table.status)
  ]
)

export const jobBids = pgTable(
  'job_bids',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id),
    bidAmount: varchar('bid_amount', { length: 50 }).notNull(),
    deliveryDays: integer('delivery_days').notNull(),
    proposalText: text('proposal_text').notNull(),
    coverLetter: text('cover_letter'),
    attachments: jsonb('attachments').notNull().default('[]'),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending | shortlisted | accepted | rejected | withdrawn
    shortlistedAt: timestamp('shortlisted_at'),
    acceptedAt: timestamp('accepted_at'),
    rejectedAt: timestamp('rejected_at'),
    milestones: jsonb('milestones').notNull().default('[]'), // Proposed milestones
    metadata: jsonb('metadata').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_job_bids_job').on(table.jobId),
    index('idx_job_bids_freelancer').on(table.freelancerId),
    index('idx_job_bids_status').on(table.status),
    unique('unique_job_bid').on(table.jobId, table.freelancerId)
  ]
)

export const bidTemplates = pgTable(
  'bid_templates',
  {
    id: serial('id').primaryKey(),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    proposalText: text('proposal_text').notNull(),
    coverLetter: text('cover_letter'),
    isDefault: boolean('is_default').notNull().default(false),
    usageCount: integer('usage_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_bid_templates_freelancer').on(table.freelancerId),
    index('idx_bid_templates_default').on(table.freelancerId, table.isDefault)
  ]
)

export const jobInvitations = pgTable(
  'job_invitations',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id),
    invitedBy: integer('invited_by')
      .notNull()
      .references(() => users.id),
    message: text('message'),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending | accepted | declined
    respondedAt: timestamp('responded_at'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_job_invitations_job').on(table.jobId),
    index('idx_job_invitations_freelancer').on(table.freelancerId),
    unique('unique_job_invitation').on(table.jobId, table.freelancerId)
  ]
)

// Saved Searches
export const savedSearches = pgTable(
  'saved_searches',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    searchType: varchar('search_type', { length: 50 })
      .notNull()
      .default('jobs'), // jobs, freelancers
    filters: jsonb('filters').notNull().default('{}'), // search criteria
    query: text('query'), // search query string
    alertsEnabled: boolean('alerts_enabled').notNull().default(false),
    alertFrequency: varchar('alert_frequency', { length: 50 }).default('daily'), // instant, daily, weekly
    lastAlertSent: timestamp('last_alert_sent'),
    resultsCount: integer('results_count').default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_saved_searches_user').on(table.userId),
    index('idx_saved_searches_type').on(table.searchType),
    index('idx_saved_searches_alerts').on(table.alertsEnabled)
  ]
)

// Job Alerts
export const jobAlerts = pgTable(
  'job_alerts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    savedSearchId: integer('saved_search_id').references(
      () => savedSearches.id,
      { onDelete: 'cascade' }
    ),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    alertType: varchar('alert_type', { length: 50 })
      .notNull()
      .default('new_match'), // new_match, price_change, deadline_approaching
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, sent, viewed, dismissed
    sentAt: timestamp('sent_at'),
    viewedAt: timestamp('viewed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_job_alerts_user').on(table.userId),
    index('idx_job_alerts_search').on(table.savedSearchId),
    index('idx_job_alerts_job').on(table.jobId),
    index('idx_job_alerts_status').on(table.status),
    unique('unique_job_alert').on(table.userId, table.jobId, table.alertType)
  ]
)

// Interview Scheduling
export const interviews = pgTable(
  'interviews',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    bidId: integer('bid_id')
      .notNull()
      .references(() => jobBids.id, { onDelete: 'cascade' }),
    clientId: integer('client_id')
      .notNull()
      .references(() => users.id),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id),
    scheduledAt: timestamp('scheduled_at').notNull(),
    duration: integer('duration').notNull().default(30), // in minutes
    meetingType: varchar('meeting_type', { length: 50 })
      .notNull()
      .default('video'), // video, phone, in-person
    meetingLink: varchar('meeting_link', { length: 500 }),
    location: text('location'),
    notes: text('notes'),
    status: varchar('status', { length: 50 }).notNull().default('scheduled'), // scheduled, completed, cancelled, rescheduled
    clientConfirmed: boolean('client_confirmed').notNull().default(true),
    freelancerConfirmed: boolean('freelancer_confirmed')
      .notNull()
      .default(false),
    reminderSent: boolean('reminder_sent').notNull().default(false),
    cancelledBy: integer('cancelled_by').references(() => users.id),
    cancelReason: text('cancel_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_interviews_job').on(table.jobId),
    index('idx_interviews_bid').on(table.bidId),
    index('idx_interviews_client').on(table.clientId),
    index('idx_interviews_freelancer').on(table.freelancerId),
    index('idx_interviews_scheduled').on(table.scheduledAt),
    index('idx_interviews_status').on(table.status)
  ]
)

export const freelancerReviews = pgTable(
  'freelancer_reviews',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    reviewerId: integer('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }), // Client who reviews
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    rating: integer('rating').notNull(), // 1-5
    reviewText: text('review_text'),
    communicationRating: integer('communication_rating'), // 1-5
    qualityRating: integer('quality_rating'), // 1-5
    deadlineRating: integer('deadline_rating'), // 1-5
    skillsRating: jsonb('skills_rating').notNull().default('{}'), // {skillId: rating}
    wouldHireAgain: boolean('would_hire_again').notNull().default(true),
    isPublic: boolean('is_public').notNull().default(true),
    response: text('response'), // Freelancer's response
    respondedAt: timestamp('responded_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_freelancer_reviews_job').on(table.jobId),
    index('idx_freelancer_reviews_freelancer').on(table.freelancerId),
    index('idx_freelancer_reviews_reviewer').on(table.reviewerId),
    index('idx_freelancer_reviews_rating').on(table.rating),
    unique('unique_freelancer_review').on(table.jobId, table.freelancerId)
  ]
)

export const clientReviews = pgTable(
  'client_reviews',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    reviewerId: integer('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }), // Freelancer who reviews
    clientId: integer('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    rating: integer('rating').notNull(), // 1-5
    reviewText: text('review_text'),
    paymentRating: integer('payment_rating'), // 1-5
    communicationRating: integer('communication_rating'), // 1-5
    clarityRating: integer('clarity_rating'), // 1-5
    wouldWorkAgain: boolean('would_work_again').notNull().default(true),
    isPublic: boolean('is_public').notNull().default(true),
    response: text('response'), // Client's response
    respondedAt: timestamp('responded_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_client_reviews_job').on(table.jobId),
    index('idx_client_reviews_client').on(table.clientId),
    index('idx_client_reviews_reviewer').on(table.reviewerId),
    index('idx_client_reviews_rating').on(table.rating),
    unique('unique_client_review').on(table.jobId, table.clientId)
  ]
)

export const reviewDisputes = pgTable(
  'review_disputes',
  {
    id: serial('id').primaryKey(),
    reviewId: integer('review_id').notNull(),
    reviewType: varchar('review_type', { length: 20 }).notNull(), // 'freelancer' or 'client'
    disputedBy: integer('disputed_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    reason: varchar('reason', { length: 50 }).notNull(), // false_information, inappropriate_content, etc.
    description: text('description').notNull(),
    evidence: jsonb('evidence').notNull().default('[]'), // Array of evidence URLs
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, under_review, resolved, dismissed
    resolution: varchar('resolution', { length: 20 }), // upheld, dismissed, modified
    adminNote: text('admin_note'),
    actionTaken: varchar('action_taken', { length: 50 }), // review_removed, review_hidden, etc.
    resolvedBy: integer('resolved_by').references(() => users.id, {
      onDelete: 'restrict'
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_review_disputes_review').on(table.reviewId, table.reviewType),
    index('idx_review_disputes_disputed_by').on(table.disputedBy),
    index('idx_review_disputes_status').on(table.status),
    index('idx_review_disputes_created').on(table.createdAt)
  ]
)

export const skillEndorsements = pgTable(
  'skill_endorsements',
  {
    id: serial('id').primaryKey(),
    endorserId: integer('endorser_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    endorsedUserId: integer('endorsed_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillId: integer('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'restrict' }),
    rating: integer('rating').notNull(), // 1-5
    relationship: varchar('relationship', { length: 50 }), // 'client', 'freelancer', 'colleague'
    projectContext: text('project_context'), // Brief description of project worked on
    verified: boolean('verified').notNull().default(false), // If endorser worked with endorsed on platform
    jobId: integer('job_id').references(() => jobPostings.id), // Link to job if applicable
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_skill_endorsements_endorsed_user').on(table.endorsedUserId),
    index('idx_skill_endorsements_endorser').on(table.endorserId),
    index('idx_skill_endorsements_skill').on(table.skillId),
    index('idx_skill_endorsements_verified').on(table.verified),
    unique('unique_skill_endorsement').on(
      table.endorserId,
      table.endorsedUserId,
      table.skillId
    )
  ]
)

export const verificationBadges = pgTable(
  'verification_badges',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    badgeType: varchar('badge_type', { length: 50 }).notNull(), // 'identity', 'email', 'phone', 'kyc', 'professional'
    verificationLevel: varchar('verification_level', { length: 20 }).notNull(), // 'basic', 'standard', 'advanced'
    verifiedAt: timestamp('verified_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'),
    verificationMethod: varchar('verification_method', { length: 100 }), // How it was verified
    metadata: jsonb('metadata').notNull().default('{}'), // Additional verification data
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_verification_badges_user').on(table.userId),
    index('idx_verification_badges_type').on(table.badgeType),
    index('idx_verification_badges_active').on(table.isActive),
    unique('unique_verification_badge').on(table.userId, table.badgeType)
  ]
)

export const reputationRegistry = pgTable(
  'reputation_registry',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
    totalReviews: integer('total_reviews').notNull().default(0),
    averageRating: varchar('average_rating', { length: 5 })
      .notNull()
      .default('0'), // Store as string for precision
    reputationScore: integer('reputation_score').notNull().default(0),
    isFreelancer: boolean('is_freelancer').notNull().default(true),
    lastUpdated: timestamp('last_updated').notNull().defaultNow(),
    metadata: jsonb('metadata').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_reputation_registry_user').on(table.userId),
    index('idx_reputation_registry_score').on(table.reputationScore),
    index('idx_reputation_registry_freelancer').on(table.isFreelancer),
    unique('unique_user_reputation').on(table.userId, table.isFreelancer)
  ]
)

export const reputationNFTs = pgTable(
  'reputation_nfts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    nftType: varchar('nft_type', { length: 50 }).notNull(), // 'reputation', 'achievement', 'milestone'
    tokenId: bigint('token_id', { mode: 'number' }).notNull().unique(),
    metadataUri: text('metadata_uri'),
    reputationLevel: varchar('reputation_level', { length: 20 }), // 'bronze', 'silver', 'gold', 'platinum', 'diamond'
    mintedAt: timestamp('minted_at').notNull().defaultNow(),
    txHash: varchar('tx_hash', { length: 66 }).notNull().unique(),
    chainId: integer('chain_id').notNull().default(1),
    contractAddress: varchar('contract_address', { length: 42 })
  },
  table => [
    index('idx_reputation_nfts_user').on(table.userId),
    index('idx_reputation_nfts_type').on(table.nftType),
    index('idx_reputation_nfts_token').on(table.tokenId),
    unique('unique_user_nft_level').on(
      table.userId,
      table.nftType,
      table.reputationLevel
    )
  ]
)

export const portfolioItems = pgTable(
  'portfolio_items',
  {
    id: serial('id').primaryKey(),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => freelancerProfiles.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    categoryId: integer('category_id').references(() => jobCategories.id),
    skillsUsed: jsonb('skills_used').notNull().default('[]'), // Array of skill IDs
    projectUrl: text('project_url'),
    images: jsonb('images').notNull().default('[]'), // Array of image URLs
    completionDate: timestamp('completion_date'),
    clientName: varchar('client_name', { length: 100 }),
    isHighlighted: boolean('is_highlighted').notNull().default(false),
    viewCount: integer('view_count').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_portfolio_items_freelancer').on(table.freelancerId),
    index('idx_portfolio_items_category').on(table.categoryId)
  ]
)

export const savedFreelancers = pgTable(
  'saved_freelancers',
  {
    id: serial('id').primaryKey(),
    clientId: integer('client_id')
      .notNull()
      .references(() => users.id),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => freelancerProfiles.id),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_saved_freelancers_client').on(table.clientId),
    unique('unique_saved_freelancer').on(table.clientId, table.freelancerId)
  ]
)

export const savedJobs = pgTable(
  'saved_jobs',
  {
    id: serial('id').primaryKey(),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_saved_jobs_freelancer').on(table.freelancerId),
    unique('unique_saved_job').on(table.freelancerId, table.jobId)
  ]
)

// Payment & Financial Tables
export const invoices = pgTable(
  'invoices',
  {
    id: serial('id').primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id),
    milestoneId: integer('milestone_id').references(() => jobMilestones.id),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id),
    clientId: integer('client_id')
      .notNull()
      .references(() => users.id),
    amount: varchar('amount', { length: 50 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, sent, paid, overdue, cancelled
    dueDate: timestamp('due_date'),
    paidAt: timestamp('paid_at'),
    paymentMethod: varchar('payment_method', { length: 50 }),
    transactionHash: varchar('transaction_hash', { length: 100 }),
    description: text('description'),
    items: jsonb('items').notNull().default('[]'), // Line items for the invoice
    taxAmount: varchar('tax_amount', { length: 50 }),
    discountAmount: varchar('discount_amount', { length: 50 }),
    notes: text('notes'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_invoices_freelancer').on(table.freelancerId),
    index('idx_invoices_client').on(table.clientId),
    index('idx_invoices_job').on(table.jobId),
    index('idx_invoices_milestone').on(table.milestoneId),
    index('idx_invoices_status').on(table.status),
    index('idx_invoices_due_date').on(table.dueDate)
  ]
)

export const earnings = pgTable(
  'earnings',
  {
    id: serial('id').primaryKey(),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id),
    jobId: integer('job_id').references(() => jobPostings.id),
    milestoneId: integer('milestone_id').references(() => jobMilestones.id),
    invoiceId: integer('invoice_id').references(() => invoices.id),
    amount: varchar('amount', { length: 50 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    type: varchar('type', { length: 50 }).notNull().default('milestone'), // milestone, bonus, tip, refund
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, available, withdrawn
    availableAt: timestamp('available_at'), // When funds become available for withdrawal
    platformFee: varchar('platform_fee', { length: 50 }),
    netAmount: varchar('net_amount', { length: 50 }).notNull(), // Amount after fees
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
      .references(() => users.id),
    amount: varchar('amount', { length: 50 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    method: varchar('method', { length: 50 }).notNull(), // bank_transfer, paypal, crypto, stripe
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, processing, completed, failed, cancelled
    destinationAccount: text('destination_account').notNull(), // Encrypted account details
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

export const milestoneRevisions = pgTable(
  'milestone_revisions',
  {
    id: serial('id').primaryKey(),
    milestoneId: integer('milestone_id')
      .notNull()
      .references(() => jobMilestones.id, { onDelete: 'cascade' }),
    requestedBy: integer('requested_by')
      .notNull()
      .references(() => users.id),
    reason: text('reason').notNull(),
    details: text('details'),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, accepted, rejected, completed
    responseNote: text('response_note'),
    respondedAt: timestamp('responded_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_milestone_revisions_milestone').on(table.milestoneId),
    index('idx_milestone_revisions_requested_by').on(table.requestedBy),
    index('idx_milestone_revisions_status').on(table.status)
  ]
)

export const milestoneChats = pgTable(
  'milestone_chats',
  {
    id: serial('id').primaryKey(),
    milestoneId: integer('milestone_id')
      .notNull()
      .references(() => jobMilestones.id, { onDelete: 'cascade' }),
    senderId: integer('sender_id')
      .notNull()
      .references(() => users.id),
    message: text('message').notNull(),
    attachments: jsonb('attachments').notNull().default('[]'),
    messageType: varchar('message_type', { length: 50 })
      .notNull()
      .default('text'), // text, submission, approval, revision_request
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_milestone_chats_milestone').on(table.milestoneId),
    index('idx_milestone_chats_sender').on(table.senderId),
    index('idx_milestone_chats_created').on(table.createdAt)
  ]
)

export const paymentReminders = pgTable(
  'payment_reminders',
  {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    recipientId: integer('recipient_id')
      .notNull()
      .references(() => users.id),
    reminderType: varchar('reminder_type', { length: 50 }).notNull(), // due_soon, overdue, final_notice
    sentAt: timestamp('sent_at'),
    viewedAt: timestamp('viewed_at'),
    scheduledFor: timestamp('scheduled_for').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('scheduled'), // scheduled, sent, cancelled
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
      .references(() => users.id),
    year: integer('year').notNull(),
    documentType: varchar('document_type', { length: 50 }).notNull(), // 1099, w9, w8ben
    documentUrl: text('document_url'),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, generated, sent, acknowledged
    taxInfo: jsonb('tax_info').notNull().default('{}'), // Encrypted tax information
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

// Phase 6: Workspace & Collaboration Tables

export const workspaceSessions = pgTable(
  'workspace_sessions',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
    status: varchar('status', { length: 50 }).notNull().default('active'), // active, idle, disconnected
    lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
    currentTab: varchar('current_tab', { length: 50 }), // overview, files, messages, tasks, timeline
    metadata: jsonb('metadata'), // browser info, location in workspace
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
    leftAt: timestamp('left_at')
  },
  table => [
    index('idx_workspace_sessions_job').on(table.jobId),
    index('idx_workspace_sessions_user').on(table.userId),
    index('idx_workspace_sessions_status').on(table.status),
    unique('unique_active_workspace_session').on(
      table.jobId,
      table.userId,
      table.status
    )
  ]
)

export const jobTasks = pgTable(
  'job_tasks',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    milestoneId: integer('milestone_id').references(() => jobMilestones.id, {
      onDelete: 'cascade'
    }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).notNull().default('todo'), // todo, in_progress, review, done
    priority: varchar('priority', { length: 20 }).notNull().default('medium'), // low, medium, high, urgent
    assignedTo: integer('assigned_to').references(() => users.id),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),
    dueDate: timestamp('due_date'),
    completedAt: timestamp('completed_at'),
    estimatedHours: integer('estimated_hours'),
    actualHours: integer('actual_hours'),
    tags: jsonb('tags').notNull().default('[]'),
    attachments: jsonb('attachments').notNull().default('[]'),
    position: integer('position').notNull().default(0), // for kanban board ordering
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_job_tasks_job').on(table.jobId),
    index('idx_job_tasks_milestone').on(table.milestoneId),
    index('idx_job_tasks_assigned').on(table.assignedTo),
    index('idx_job_tasks_status').on(table.status),
    index('idx_job_tasks_priority').on(table.priority),
    index('idx_job_tasks_due_date').on(table.dueDate)
  ]
)

export const fileVersions = pgTable(
  'file_versions',
  {
    id: serial('id').primaryKey(),
    originalFileId: integer('original_file_id'), // Reference to first version
    attachmentId: integer('attachment_id')
      .notNull()
      .references(() => attachments.id, { onDelete: 'cascade' }),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull().default(1),
    filename: text('filename').notNull(),
    path: text('path').notNull(),
    size: integer('size').notNull(),
    mimeType: text('mime_type').notNull(),
    uploadedBy: integer('uploaded_by')
      .notNull()
      .references(() => users.id),
    changeDescription: text('change_description'),
    isLatest: boolean('is_latest').notNull().default(true),
    metadata: jsonb('metadata'), // file hash, dimensions for images, etc.
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_file_versions_original').on(table.originalFileId),
    index('idx_file_versions_attachment').on(table.attachmentId),
    index('idx_file_versions_job').on(table.jobId),
    index('idx_file_versions_uploaded_by').on(table.uploadedBy),
    index('idx_file_versions_latest').on(table.isLatest),
    unique('unique_file_version').on(table.originalFileId, table.versionNumber)
  ]
)

export const timeTracking = pgTable(
  'time_tracking',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    milestoneId: integer('milestone_id').references(() => jobMilestones.id),
    taskId: integer('task_id').references(() => jobTasks.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time'),
    duration: integer('duration'), // in minutes
    description: text('description'),
    isBillable: boolean('is_billable').notNull().default(true),
    hourlyRate: varchar('hourly_rate', { length: 50 }),
    totalAmount: varchar('total_amount', { length: 50 }),
    status: varchar('status', { length: 50 }).notNull().default('tracked'), // tracked, approved, invoiced, paid
    approvedBy: integer('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),
    invoiceId: integer('invoice_id').references(() => invoices.id),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_time_tracking_job').on(table.jobId),
    index('idx_time_tracking_milestone').on(table.milestoneId),
    index('idx_time_tracking_task').on(table.taskId),
    index('idx_time_tracking_user').on(table.userId),
    index('idx_time_tracking_status').on(table.status),
    index('idx_time_tracking_date').on(table.startTime)
  ]
)

export const fileAnnotations = pgTable(
  'file_annotations',
  {
    id: serial('id').primaryKey(),
    fileVersionId: integer('file_version_id')
      .notNull()
      .references(() => fileVersions.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    comment: text('comment').notNull(),
    coordinates: jsonb('coordinates'), // {x, y, width, height} for visual annotations
    pageNumber: integer('page_number'), // for PDFs
    lineNumber: integer('line_number'), // for code files
    status: varchar('status', { length: 50 }).notNull().default('open'), // open, resolved, archived
    resolvedBy: integer('resolved_by').references(() => users.id),
    resolvedAt: timestamp('resolved_at'),
    parentAnnotationId: integer('parent_annotation_id'), // for threaded comments
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_file_annotations_file').on(table.fileVersionId),
    index('idx_file_annotations_user').on(table.userId),
    index('idx_file_annotations_status').on(table.status),
    index('idx_file_annotations_parent').on(table.parentAnnotationId)
  ]
)

export const deliveryPackages = pgTable(
  'delivery_packages',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    milestoneId: integer('milestone_id').references(() => jobMilestones.id),
    packageName: varchar('package_name', { length: 200 }).notNull(),
    description: text('description'),
    files: jsonb('files').notNull().default('[]'), // Array of file version IDs
    deliveredBy: integer('delivered_by')
      .notNull()
      .references(() => users.id),
    status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, delivered, accepted, rejected
    deliveryNote: text('delivery_note'),
    acceptanceNote: text('acceptance_note'),
    signature: text('signature'), // Digital signature data
    signedBy: integer('signed_by').references(() => users.id),
    deliveredAt: timestamp('delivered_at'),
    acceptedAt: timestamp('accepted_at'),
    rejectedAt: timestamp('rejected_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_delivery_packages_job').on(table.jobId),
    index('idx_delivery_packages_milestone').on(table.milestoneId),
    index('idx_delivery_packages_delivered_by').on(table.deliveredBy),
    index('idx_delivery_packages_status').on(table.status)
  ]
)

export const workspaceEvents = pgTable(
  'workspace_events',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobPostings.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    eventType: varchar('event_type', { length: 50 }).notNull(), // meeting, deadline, milestone, review, delivery
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time'),
    location: text('location'),
    meetingLink: text('meeting_link'),
    attendees: jsonb('attendees').notNull().default('[]'), // Array of user IDs
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),
    isAllDay: boolean('is_all_day').notNull().default(false),
    reminderMinutes: integer('reminder_minutes'),
    status: varchar('status', { length: 50 }).notNull().default('scheduled'), // scheduled, in_progress, completed, cancelled
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_workspace_events_job').on(table.jobId),
    index('idx_workspace_events_type').on(table.eventType),
    index('idx_workspace_events_start').on(table.startTime),
    index('idx_workspace_events_created_by').on(table.createdBy)
  ]
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

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
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
  sessions: many(sessions),
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
  battleQueueEntry: one(battleQueue, {
    fields: [users.id],
    references: [battleQueue.userId]
  }),
  tradingStats: one(userTradingStats, {
    fields: [users.id],
    references: [userTradingStats.userId]
  }),
  // Freelancer marketplace relations
  freelancerProfile: one(freelancerProfiles, {
    fields: [users.id],
    references: [freelancerProfiles.userId]
  }),
  jobPostings: many(jobPostings, { relationName: 'jobClient' }),
  assignedJobs: many(jobPostings, { relationName: 'jobFreelancer' }),
  jobBids: many(jobBids),
  bidTemplates: many(bidTemplates),
  sentJobInvitations: many(jobInvitations, { relationName: 'invitedBy' }),
  receivedJobInvitations: many(jobInvitations, {
    relationName: 'invitedFreelancer'
  }),
  freelancerReviewsGiven: many(freelancerReviews, {
    relationName: 'freelancerReviewer'
  }),
  freelancerReviewsReceived: many(freelancerReviews, {
    relationName: 'reviewedFreelancer'
  }),
  clientReviewsGiven: many(clientReviews, { relationName: 'clientReviewer' }),
  clientReviewsReceived: many(clientReviews, {
    relationName: 'reviewedClient'
  }),
  disputesSubmitted: many(reviewDisputes, { relationName: 'disputeSubmitter' }),
  disputesResolved: many(reviewDisputes, { relationName: 'disputeResolver' }),
  skillEndorsementsGiven: many(skillEndorsements, {
    relationName: 'skillEndorser'
  }),
  skillEndorsementsReceived: many(skillEndorsements, {
    relationName: 'skillEndorsed'
  }),
  verificationBadges: many(verificationBadges),
  savedFreelancers: many(savedFreelancers),
  savedJobs: many(savedJobs)
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
  attachments: many(attachments),
  jobPosting: one(jobPostings, {
    fields: [messages.jobPostingId],
    references: [jobPostings.id]
  }),
  bid: one(jobBids, {
    fields: [messages.bidId],
    references: [jobBids.id]
  }),
  milestone: one(jobMilestones, {
    fields: [messages.milestoneId],
    references: [jobMilestones.id]
  })
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
  }),
  jobPosting: one(jobPostings, {
    fields: [trades.jobPostingId],
    references: [jobPostings.id]
  }),
  bid: one(jobBids, {
    fields: [trades.bidId],
    references: [jobBids.id]
  }),
  milestone: one(jobMilestones, {
    fields: [trades.milestoneId],
    references: [jobMilestones.id]
  })
}))

export const escrowListingsRelations = relations(escrowListings, ({ one }) => ({
  user: one(users, {
    fields: [escrowListings.userId],
    references: [users.id]
  }),
  jobPosting: one(jobPostings, {
    fields: [escrowListings.jobPostingId],
    references: [jobPostings.id]
  }),
  serviceCategory: one(jobCategories, {
    fields: [escrowListings.serviceCategoryId],
    references: [jobCategories.id]
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
  }),
  battleState: one(battleStates, {
    fields: [battles.id],
    references: [battleStates.battleId]
  })
}))

export const battleStatesRelations = relations(battleStates, ({ one }) => ({
  battle: one(battles, {
    fields: [battleStates.battleId],
    references: [battles.id]
  })
}))

export const jobQueueRelations = relations(jobQueue, () => ({}))

export const battleRoundsRelations = relations(battleRounds, ({ one }) => ({
  battle: one(battles, {
    fields: [battleRounds.battleId],
    references: [battles.id]
  })
}))

export const battleQueueRelations = relations(battleQueue, ({ one }) => ({
  user: one(users, {
    fields: [battleQueue.userId],
    references: [users.id]
  }),
  matchedWithUser: one(users, {
    fields: [battleQueue.matchedWithUserId],
    references: [users.id]
  })
}))

export const battleInvitationsRelations = relations(
  battleInvitations,
  ({ one }) => ({
    fromUser: one(users, {
      fields: [battleInvitations.fromUserId],
      references: [users.id],
      relationName: 'invitationFrom'
    }),
    toUser: one(users, {
      fields: [battleInvitations.toUserId],
      references: [users.id],
      relationName: 'invitationTo'
    })
  })
)

export const battleSessionRejectionsRelations = relations(
  battleSessionRejections,
  ({ one }) => ({
    user: one(users, {
      fields: [battleSessionRejections.userId],
      references: [users.id],
      relationName: 'rejectionUser'
    }),
    rejectedUser: one(users, {
      fields: [battleSessionRejections.rejectedUserId],
      references: [users.id],
      relationName: 'rejectedUser'
    })
  })
)

export const userTradingStatsRelations = relations(
  userTradingStats,
  ({ one }) => ({
    user: one(users, {
      fields: [userTradingStats.userId],
      references: [users.id]
    })
  })
)

// Freelancer Marketplace Relations

export const jobCategoriesRelations = relations(
  jobCategories,
  ({ one, many }) => ({
    parentCategory: one(jobCategories, {
      fields: [jobCategories.parentCategoryId],
      references: [jobCategories.id],
      relationName: 'parentCategory'
    }),
    subCategories: many(jobCategories, { relationName: 'parentCategory' }),
    skills: many(skills),
    jobPostings: many(jobPostings),
    portfolioItems: many(portfolioItems)
  })
)

export const skillsRelations = relations(skills, ({ one, many }) => ({
  category: one(jobCategories, {
    fields: [skills.categoryId],
    references: [jobCategories.id]
  }),
  freelancerSkills: many(freelancerSkills)
}))

export const freelancerProfilesRelations = relations(
  freelancerProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [freelancerProfiles.userId],
      references: [users.id]
    }),
    skills: many(freelancerSkills),
    portfolioItems: many(portfolioItems),
    savedByClients: many(savedFreelancers)
  })
)

export const freelancerSkillsRelations = relations(
  freelancerSkills,
  ({ one }) => ({
    freelancer: one(freelancerProfiles, {
      fields: [freelancerSkills.freelancerId],
      references: [freelancerProfiles.id]
    }),
    skill: one(skills, {
      fields: [freelancerSkills.skillId],
      references: [skills.id]
    })
  })
)

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  client: one(users, {
    fields: [jobPostings.clientId],
    references: [users.id],
    relationName: 'jobClient'
  }),
  freelancer: one(users, {
    fields: [jobPostings.freelancerId],
    references: [users.id],
    relationName: 'jobFreelancer'
  }),
  category: one(jobCategories, {
    fields: [jobPostings.categoryId],
    references: [jobCategories.id]
  }),
  milestones: many(jobMilestones),
  bids: many(jobBids),
  invitations: many(jobInvitations),
  freelancerReviews: many(freelancerReviews),
  clientReviews: many(clientReviews),
  savedByFreelancers: many(savedJobs)
}))

export const jobMilestonesRelations = relations(jobMilestones, ({ one }) => ({
  job: one(jobPostings, {
    fields: [jobMilestones.jobId],
    references: [jobPostings.id]
  })
}))

export const jobBidsRelations = relations(jobBids, ({ one }) => ({
  job: one(jobPostings, {
    fields: [jobBids.jobId],
    references: [jobPostings.id]
  }),
  freelancer: one(users, {
    fields: [jobBids.freelancerId],
    references: [users.id]
  })
}))

export const bidTemplatesRelations = relations(bidTemplates, ({ one }) => ({
  freelancer: one(users, {
    fields: [bidTemplates.freelancerId],
    references: [users.id]
  })
}))

export const jobInvitationsRelations = relations(jobInvitations, ({ one }) => ({
  job: one(jobPostings, {
    fields: [jobInvitations.jobId],
    references: [jobPostings.id]
  }),
  freelancer: one(users, {
    fields: [jobInvitations.freelancerId],
    references: [users.id],
    relationName: 'invitedFreelancer'
  }),
  invitedBy: one(users, {
    fields: [jobInvitations.invitedBy],
    references: [users.id],
    relationName: 'invitedBy'
  })
}))

export const freelancerReviewsRelations = relations(
  freelancerReviews,
  ({ one }) => ({
    job: one(jobPostings, {
      fields: [freelancerReviews.jobId],
      references: [jobPostings.id]
    }),
    reviewer: one(users, {
      fields: [freelancerReviews.reviewerId],
      references: [users.id],
      relationName: 'freelancerReviewer'
    }),
    freelancer: one(users, {
      fields: [freelancerReviews.freelancerId],
      references: [users.id],
      relationName: 'reviewedFreelancer'
    })
  })
)

export const clientReviewsRelations = relations(clientReviews, ({ one }) => ({
  job: one(jobPostings, {
    fields: [clientReviews.jobId],
    references: [jobPostings.id]
  }),
  reviewer: one(users, {
    fields: [clientReviews.reviewerId],
    references: [users.id],
    relationName: 'clientReviewer'
  }),
  client: one(users, {
    fields: [clientReviews.clientId],
    references: [users.id],
    relationName: 'reviewedClient'
  })
}))

export const reviewDisputesRelations = relations(reviewDisputes, ({ one }) => ({
  disputedBy: one(users, {
    fields: [reviewDisputes.disputedBy],
    references: [users.id],
    relationName: 'disputeSubmitter'
  }),
  resolvedBy: one(users, {
    fields: [reviewDisputes.resolvedBy],
    references: [users.id],
    relationName: 'disputeResolver'
  })
}))

export const skillEndorsementsRelations = relations(
  skillEndorsements,
  ({ one }) => ({
    endorser: one(users, {
      fields: [skillEndorsements.endorserId],
      references: [users.id],
      relationName: 'skillEndorser'
    }),
    endorsedUser: one(users, {
      fields: [skillEndorsements.endorsedUserId],
      references: [users.id],
      relationName: 'skillEndorsed'
    }),
    skill: one(skills, {
      fields: [skillEndorsements.skillId],
      references: [skills.id]
    }),
    job: one(jobPostings, {
      fields: [skillEndorsements.jobId],
      references: [jobPostings.id]
    })
  })
)

export const verificationBadgesRelations = relations(
  verificationBadges,
  ({ one }) => ({
    user: one(users, {
      fields: [verificationBadges.userId],
      references: [users.id]
    })
  })
)

export const portfolioItemsRelations = relations(portfolioItems, ({ one }) => ({
  freelancer: one(freelancerProfiles, {
    fields: [portfolioItems.freelancerId],
    references: [freelancerProfiles.id]
  }),
  category: one(jobCategories, {
    fields: [portfolioItems.categoryId],
    references: [jobCategories.id]
  })
}))

export const savedFreelancersRelations = relations(
  savedFreelancers,
  ({ one }) => ({
    client: one(users, {
      fields: [savedFreelancers.clientId],
      references: [users.id]
    }),
    freelancer: one(freelancerProfiles, {
      fields: [savedFreelancers.freelancerId],
      references: [freelancerProfiles.id]
    })
  })
)

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  freelancer: one(users, {
    fields: [savedJobs.freelancerId],
    references: [users.id]
  }),
  job: one(jobPostings, {
    fields: [savedJobs.jobId],
    references: [jobPostings.id]
  })
}))

// Payment & Financial Relations
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  job: one(jobPostings, {
    fields: [invoices.jobId],
    references: [jobPostings.id]
  }),
  milestone: one(jobMilestones, {
    fields: [invoices.milestoneId],
    references: [jobMilestones.id]
  }),
  freelancer: one(users, {
    fields: [invoices.freelancerId],
    references: [users.id],
    relationName: 'invoiceFreelancer'
  }),
  client: one(users, {
    fields: [invoices.clientId],
    references: [users.id],
    relationName: 'invoiceClient'
  }),
  paymentReminders: many(paymentReminders),
  earnings: many(earnings)
}))

export const earningsRelations = relations(earnings, ({ one }) => ({
  freelancer: one(users, {
    fields: [earnings.freelancerId],
    references: [users.id]
  }),
  job: one(jobPostings, {
    fields: [earnings.jobId],
    references: [jobPostings.id]
  }),
  milestone: one(jobMilestones, {
    fields: [earnings.milestoneId],
    references: [jobMilestones.id]
  }),
  invoice: one(invoices, {
    fields: [earnings.invoiceId],
    references: [invoices.id]
  })
}))

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  freelancer: one(users, {
    fields: [withdrawals.freelancerId],
    references: [users.id]
  })
}))

export const milestoneRevisionsRelations = relations(
  milestoneRevisions,
  ({ one }) => ({
    milestone: one(jobMilestones, {
      fields: [milestoneRevisions.milestoneId],
      references: [jobMilestones.id]
    }),
    requestedBy: one(users, {
      fields: [milestoneRevisions.requestedBy],
      references: [users.id]
    })
  })
)

export const milestoneChatsRelations = relations(milestoneChats, ({ one }) => ({
  milestone: one(jobMilestones, {
    fields: [milestoneChats.milestoneId],
    references: [jobMilestones.id]
  }),
  sender: one(users, {
    fields: [milestoneChats.senderId],
    references: [users.id]
  })
}))

export const paymentRemindersRelations = relations(
  paymentReminders,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [paymentReminders.invoiceId],
      references: [invoices.id]
    }),
    recipient: one(users, {
      fields: [paymentReminders.recipientId],
      references: [users.id]
    })
  })
)

export const taxDocumentsRelations = relations(taxDocuments, ({ one }) => ({
  user: one(users, {
    fields: [taxDocuments.userId],
    references: [users.id]
  })
}))

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
  TRADE_EXPIRED = 'TRADE_EXPIRED',

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
export type BattleState = typeof battleStates.$inferSelect
export type NewBattleState = typeof battleStates.$inferInsert
export type JobQueue = typeof jobQueue.$inferSelect
export type NewJobQueue = typeof jobQueue.$inferInsert
export type BattleRound = typeof battleRounds.$inferSelect
export type NewBattleRound = typeof battleRounds.$inferInsert
export type BattleQueue = typeof battleQueue.$inferSelect
export type NewBattleQueue = typeof battleQueue.$inferInsert
export type BattleInvitation = typeof battleInvitations.$inferSelect
export type NewBattleInvitation = typeof battleInvitations.$inferInsert
export type BattleSessionRejection = typeof battleSessionRejections.$inferSelect
export type NewBattleSessionRejection =
  typeof battleSessionRejections.$inferInsert
export type UserTradingStats = typeof userTradingStats.$inferSelect
export type NewUserTradingStats = typeof userTradingStats.$inferInsert

// Freelancer Marketplace Types
export type JobCategory = typeof jobCategories.$inferSelect
export type NewJobCategory = typeof jobCategories.$inferInsert
export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert
export type FreelancerProfile = typeof freelancerProfiles.$inferSelect
export type NewFreelancerProfile = typeof freelancerProfiles.$inferInsert
export type ProfileDraft = typeof profileDrafts.$inferSelect
export type NewProfileDraft = typeof profileDrafts.$inferInsert
export type FreelancerSkill = typeof freelancerSkills.$inferSelect
export type NewFreelancerSkill = typeof freelancerSkills.$inferInsert
export type JobPosting = typeof jobPostings.$inferSelect
export type NewJobPosting = typeof jobPostings.$inferInsert
export type JobMilestone = typeof jobMilestones.$inferSelect
export type NewJobMilestone = typeof jobMilestones.$inferInsert
export type JobBid = typeof jobBids.$inferSelect
export type NewJobBid = typeof jobBids.$inferInsert
export type BidTemplate = typeof bidTemplates.$inferSelect
export type NewBidTemplate = typeof bidTemplates.$inferInsert
export type JobInvitation = typeof jobInvitations.$inferSelect
export type NewJobInvitation = typeof jobInvitations.$inferInsert
export type FreelancerReview = typeof freelancerReviews.$inferSelect
export type NewFreelancerReview = typeof freelancerReviews.$inferInsert
export type ClientReview = typeof clientReviews.$inferSelect
export type NewClientReview = typeof clientReviews.$inferInsert
export type ReviewDispute = typeof reviewDisputes.$inferSelect
export type NewReviewDispute = typeof reviewDisputes.$inferInsert
export type SkillEndorsement = typeof skillEndorsements.$inferSelect
export type NewSkillEndorsement = typeof skillEndorsements.$inferInsert
export type VerificationBadge = typeof verificationBadges.$inferSelect
export type NewVerificationBadge = typeof verificationBadges.$inferInsert
export type PortfolioItem = typeof portfolioItems.$inferSelect
export type NewPortfolioItem = typeof portfolioItems.$inferInsert
export type SavedFreelancer = typeof savedFreelancers.$inferSelect
export type NewSavedFreelancer = typeof savedFreelancers.$inferInsert
export type SavedJob = typeof savedJobs.$inferSelect
export type NewSavedJob = typeof savedJobs.$inferInsert

// Phase 6: Workspace & Collaboration Types
export type WorkspaceSession = typeof workspaceSessions.$inferSelect
export type NewWorkspaceSession = typeof workspaceSessions.$inferInsert
export type JobTask = typeof jobTasks.$inferSelect
export type NewJobTask = typeof jobTasks.$inferInsert
export type FileVersion = typeof fileVersions.$inferSelect
export type NewFileVersion = typeof fileVersions.$inferInsert
export type TimeTracking = typeof timeTracking.$inferSelect
export type NewTimeTracking = typeof timeTracking.$inferInsert
export type FileAnnotation = typeof fileAnnotations.$inferSelect
export type NewFileAnnotation = typeof fileAnnotations.$inferInsert
export type DeliveryPackage = typeof deliveryPackages.$inferSelect
export type NewDeliveryPackage = typeof deliveryPackages.$inferInsert
export type WorkspaceEvent = typeof workspaceEvents.$inferSelect
export type NewWorkspaceEvent = typeof workspaceEvents.$inferInsert

// ============================================
// Phase 11: Quality & Launch Preparation Tables
// ============================================

// Onboarding System
export const onboardingSteps = pgTable('onboarding_steps', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  stepOrder: integer('step_order').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // new_user, freelancer, client, trader
  targetElement: varchar('target_element', { length: 255 }), // CSS selector
  position: varchar('position', { length: 20 }).default('auto'), // top, bottom, left, right, auto
  content: jsonb('content'), // Rich content with images, videos, etc.
  requiredAction: varchar('required_action', { length: 100 }), // Action to complete step
  xpReward: integer('xp_reward').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const onboardingProgress = pgTable(
  'onboarding_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    stepId: integer('step_id')
      .notNull()
      .references(() => onboardingSteps.id),
    completedAt: timestamp('completed_at'),
    skippedAt: timestamp('skipped_at'),
    startedAt: timestamp('started_at').defaultNow()
  },
  table => ({
    userStepUnique: uniqueIndex('onboarding_progress_user_step_idx').on(
      table.userId,
      table.stepId
    )
  })
)

// Tutorial System
export const tutorials = pgTable('tutorials', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(), // beginner, intermediate, advanced
  estimatedTime: integer('estimated_time'), // in minutes
  steps: jsonb('steps').notNull(), // Array of tutorial steps
  prerequisites: jsonb('prerequisites'), // Array of tutorial IDs
  xpReward: integer('xp_reward').default(0),
  viewCount: integer('view_count').default(0),
  isInteractive: boolean('is_interactive').default(false),
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const tutorialProgress = pgTable(
  'tutorial_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    tutorialId: integer('tutorial_id')
      .notNull()
      .references(() => tutorials.id),
    currentStep: integer('current_step').default(0),
    completedSteps: jsonb('completed_steps').default('[]'),
    completedAt: timestamp('completed_at'),
    startedAt: timestamp('started_at').defaultNow(),
    lastAccessedAt: timestamp('last_accessed_at').defaultNow()
  },
  table => ({
    userTutorialUnique: uniqueIndex('tutorial_progress_user_tutorial_idx').on(
      table.userId,
      table.tutorialId
    )
  })
)

// FAQ System
export const faqCategories = pgTable('faq_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  orderIndex: integer('order_index').default(0),
  parentId: integer('parent_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
})

export const faqItems = pgTable('faq_items', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => faqCategories.id),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  tags: jsonb('tags'),
  relatedFaqs: jsonb('related_faqs'), // Array of FAQ IDs
  viewCount: integer('view_count').default(0),
  helpfulCount: integer('helpful_count').default(0),
  notHelpfulCount: integer('not_helpful_count').default(0),
  orderIndex: integer('order_index').default(0),
  isHighlighted: boolean('is_highlighted').default(false),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const faqVotes = pgTable(
  'faq_votes',
  {
    id: serial('id').primaryKey(),
    faqId: integer('faq_id')
      .notNull()
      .references(() => faqItems.id),
    userId: integer('user_id').references(() => users.id),
    sessionId: varchar('session_id', { length: 100 }), // For anonymous users
    isHelpful: boolean('is_helpful').notNull(),
    feedback: text('feedback'),
    createdAt: timestamp('created_at').defaultNow()
  },
  table => ({
    userFaqUnique: uniqueIndex('faq_votes_user_faq_idx').on(
      table.userId,
      table.faqId
    ),
    sessionFaqUnique: uniqueIndex('faq_votes_session_faq_idx').on(
      table.sessionId,
      table.faqId
    )
  })
)

// Help Documentation
export const helpArticles = pgTable('help_articles', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  category: varchar('category', { length: 50 }).notNull(),
  subcategory: varchar('subcategory', { length: 50 }),
  tags: jsonb('tags'),
  relatedArticles: jsonb('related_articles'),
  searchKeywords: text('search_keywords'),
  viewCount: integer('view_count').default(0),
  helpfulCount: integer('helpful_count').default(0),
  authorId: integer('author_id').references(() => users.id),
  lastReviewedAt: timestamp('last_reviewed_at'),
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Video Tutorials
export const videoTutorials = pgTable('video_tutorials', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  videoUrl: varchar('video_url', { length: 500 }).notNull(),
  embedCode: text('embed_code'),
  duration: integer('duration'), // in seconds
  category: varchar('category', { length: 50 }).notNull(),
  tags: jsonb('tags'),
  transcript: text('transcript'),
  chapters: jsonb('chapters'), // Array of {time, title, description}
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  xpReward: integer('xp_reward').default(0),
  orderIndex: integer('order_index').default(0),
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const videoProgress = pgTable(
  'video_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    videoId: integer('video_id')
      .notNull()
      .references(() => videoTutorials.id),
    watchedSeconds: integer('watched_seconds').default(0),
    completedAt: timestamp('completed_at'),
    lastWatchedAt: timestamp('last_watched_at').defaultNow()
  },
  table => ({
    userVideoUnique: uniqueIndex('video_progress_user_video_idx').on(
      table.userId,
      table.videoId
    )
  })
)

// Enhanced Referral System
export const referralCampaigns = pgTable('referral_campaigns', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  rewardType: varchar('reward_type', { length: 50 }).notNull(), // xp, discount, credit, nft
  referrerReward: jsonb('referrer_reward').notNull(),
  refereeReward: jsonb('referee_reward').notNull(),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').default(0),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  conditions: jsonb('conditions'), // Eligibility conditions
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const referralLinks = pgTable('referral_links', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  campaignId: integer('campaign_id').references(() => referralCampaigns.id),
  code: varchar('code', { length: 100 }).notNull().unique(),
  customAlias: varchar('custom_alias', { length: 100 }).unique(),
  clickCount: integer('click_count').default(0),
  conversionCount: integer('conversion_count').default(0),
  totalEarnings: decimal('total_earnings', { precision: 10, scale: 2 }).default(
    '0'
  ),
  metadata: jsonb('metadata'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const referralConversions = pgTable('referral_conversions', {
  id: serial('id').primaryKey(),
  referralLinkId: integer('referral_link_id')
    .notNull()
    .references(() => referralLinks.id),
  referrerId: integer('referrer_id')
    .notNull()
    .references(() => users.id),
  refereeId: integer('referee_id')
    .notNull()
    .references(() => users.id),
  campaignId: integer('campaign_id').references(() => referralCampaigns.id),
  conversionType: varchar('conversion_type', { length: 50 }).notNull(), // signup, first_purchase, etc.
  referrerRewardStatus: varchar('referrer_reward_status', {
    length: 20
  }).default('pending'),
  refereeRewardStatus: varchar('referee_reward_status', { length: 20 }).default(
    'pending'
  ),
  referrerRewardAmount: jsonb('referrer_reward_amount'),
  refereeRewardAmount: jsonb('referee_reward_amount'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  convertedAt: timestamp('converted_at').defaultNow()
})

// Partnership Program
export const partners = pgTable('partners', {
  id: serial('id').primaryKey(),
  organizationName: varchar('organization_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 500 }),
  partnerType: varchar('partner_type', { length: 50 }).notNull(), // affiliate, reseller, integration, strategic
  tier: varchar('tier', { length: 20 }).notNull(), // bronze, silver, gold, platinum
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }),
  customTerms: jsonb('custom_terms'),
  apiKey: varchar('api_key', { length: 255 }).unique(),
  webhookUrl: varchar('webhook_url', { length: 500 }),
  branding: jsonb('branding'), // Logo, colors, etc.
  totalRevenue: decimal('total_revenue', { precision: 10, scale: 2 }).default(
    '0'
  ),
  totalReferrals: integer('total_referrals').default(0),
  status: varchar('status', { length: 20 }).default('pending'), // pending, active, suspended, terminated
  approvedAt: timestamp('approved_at'),
  approvedBy: integer('approved_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const partnerCommissions = pgTable('partner_commissions', {
  id: serial('id').primaryKey(),
  partnerId: integer('partner_id')
    .notNull()
    .references(() => partners.id),
  referenceType: varchar('reference_type', { length: 50 }).notNull(), // trade, subscription, job
  referenceId: integer('reference_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal('commission_rate', {
    precision: 5,
    scale: 2
  }).notNull(),
  commissionAmount: decimal('commission_amount', {
    precision: 10,
    scale: 2
  }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, paid, cancelled
  paidAt: timestamp('paid_at'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentReference: varchar('payment_reference', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Content Marketing
export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  featuredImage: varchar('featured_image', { length: 500 }),
  category: varchar('category', { length: 50 }).notNull(),
  tags: jsonb('tags'),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords'),
  ogImage: varchar('og_image', { length: 500 }),
  readTime: integer('read_time'), // in minutes
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  shareCount: integer('share_count').default(0),
  commentCount: integer('comment_count').default(0),
  status: varchar('status', { length: 20 }).default('draft'), // draft, published, archived
  publishedAt: timestamp('published_at'),
  isFeatured: boolean('is_featured').default(false),
  allowComments: boolean('allow_comments').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const blogComments = pgTable('blog_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => blogPosts.id),
  userId: integer('user_id').references(() => users.id),
  parentId: integer('parent_id'),
  content: text('content').notNull(),
  likeCount: integer('like_count').default(0),
  isApproved: boolean('is_approved').default(false),
  isSpam: boolean('is_spam').default(false),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Social Sharing Tracking
export const socialShares = pgTable('social_shares', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  platform: varchar('platform', { length: 50 }).notNull(), // twitter, facebook, linkedin, whatsapp
  contentType: varchar('content_type', { length: 50 }).notNull(), // job, profile, achievement, trade
  contentId: integer('content_id').notNull(),
  shareUrl: text('share_url'),
  customMessage: text('custom_message'),
  clickCount: integer('click_count').default(0),
  conversionCount: integer('conversion_count').default(0),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow()
})

// Tooltips Configuration
export const tooltipContent = pgTable('tooltip_content', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  placement: varchar('placement', { length: 20 }).default('top'),
  triggerType: varchar('trigger_type', { length: 20 }).default('hover'), // hover, click, focus
  category: varchar('category', { length: 50 }),
  isRichContent: boolean('is_rich_content').default(false),
  showOnce: boolean('show_once').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Type exports for Phase 11
export type OnboardingStep = typeof onboardingSteps.$inferSelect
export type NewOnboardingStep = typeof onboardingSteps.$inferInsert
export type OnboardingProgress = typeof onboardingProgress.$inferSelect
export type NewOnboardingProgress = typeof onboardingProgress.$inferInsert
export type Tutorial = typeof tutorials.$inferSelect
export type NewTutorial = typeof tutorials.$inferInsert
export type TutorialProgress = typeof tutorialProgress.$inferSelect
export type NewTutorialProgress = typeof tutorialProgress.$inferInsert
export type FaqCategory = typeof faqCategories.$inferSelect
export type NewFaqCategory = typeof faqCategories.$inferInsert
export type FaqItem = typeof faqItems.$inferSelect
export type NewFaqItem = typeof faqItems.$inferInsert
export type FaqVote = typeof faqVotes.$inferSelect
export type NewFaqVote = typeof faqVotes.$inferInsert
export type HelpArticle = typeof helpArticles.$inferSelect
export type NewHelpArticle = typeof helpArticles.$inferInsert
export type VideoTutorial = typeof videoTutorials.$inferSelect
export type NewVideoTutorial = typeof videoTutorials.$inferInsert
export type VideoProgress = typeof videoProgress.$inferSelect
export type NewVideoProgress = typeof videoProgress.$inferInsert
export type ReferralCampaign = typeof referralCampaigns.$inferSelect
export type NewReferralCampaign = typeof referralCampaigns.$inferInsert
export type ReferralLink = typeof referralLinks.$inferSelect
export type NewReferralLink = typeof referralLinks.$inferInsert
export type ReferralConversion = typeof referralConversions.$inferSelect
export type NewReferralConversion = typeof referralConversions.$inferInsert
export type Partner = typeof partners.$inferSelect
export type NewPartner = typeof partners.$inferInsert
export type PartnerCommission = typeof partnerCommissions.$inferSelect
export type NewPartnerCommission = typeof partnerCommissions.$inferInsert
export type BlogPost = typeof blogPosts.$inferSelect
export type NewBlogPost = typeof blogPosts.$inferInsert
export type BlogComment = typeof blogComments.$inferSelect
export type NewBlogComment = typeof blogComments.$inferInsert
export type SocialShare = typeof socialShares.$inferSelect
export type NewSocialShare = typeof socialShares.$inferInsert
export type TooltipContent = typeof tooltipContent.$inferSelect
export type NewTooltipContent = typeof tooltipContent.$inferInsert
