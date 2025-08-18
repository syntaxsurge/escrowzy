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

export const userGameData = pgTable(
  'user_game_data',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
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
      .references(() => users.id, { onDelete: 'cascade' }),
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

export const battles = pgTable(
  'battles',
  {
    id: serial('id').primaryKey(),
    player1Id: integer('player1_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    player2Id: integer('player2_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    winnerId: integer('winner_id').references(() => users.id, {
      onDelete: 'set null'
    }),
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
      .unique()
      .references(() => battles.id, { onDelete: 'cascade' }),
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

export const battleRounds = pgTable(
  'battle_rounds',
  {
    id: serial('id').primaryKey(),
    battleId: integer('battle_id')
      .notNull()
      .references(() => battles.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    player1Action: text('player1_action').notNull().default('attack'),
    player2Action: text('player2_action').notNull().default('attack'),
    player1Damage: integer('player1_damage').notNull().default(0),
    player2Damage: integer('player2_damage').notNull().default(0),
    player1Critical: boolean('player1_critical').notNull().default(false),
    player2Critical: boolean('player2_critical').notNull().default(false),
    player1AttackCount: integer('player1_attack_count').notNull().default(0),
    player2AttackCount: integer('player2_attack_count').notNull().default(0),
    player1DefendCount: integer('player1_defend_count').notNull().default(0),
    player2DefendCount: integer('player2_defend_count').notNull().default(0),
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
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    combatPower: integer('combat_power').notNull(),
    minCP: integer('min_cp').notNull(),
    maxCP: integer('max_cp').notNull(),
    matchRange: integer('match_range').notNull().default(20),
    searchStartedAt: timestamp('search_started_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('searching'),
    matchedWithUserId: integer('matched_with_user_id').references(
      () => users.id,
      { onDelete: 'set null' }
    ),
    queuePosition: integer('queue_position'),
    estimatedWaitTime: integer('estimated_wait_time')
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
      .references(() => users.id, { onDelete: 'cascade' }),
    toUserId: integer('to_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fromUserCP: integer('from_user_cp').notNull(),
    toUserCP: integer('to_user_cp').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    message: text('message'),
    battleId: integer('battle_id').references(() => battles.id, {
      onDelete: 'set null'
    }),
    expiresAt: timestamp('expires_at').notNull(),
    respondedAt: timestamp('responded_at'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_battle_invitations_from_user').on(table.fromUserId),
    index('idx_battle_invitations_to_user').on(table.toUserId),
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
      .references(() => users.id, { onDelete: 'cascade' }),
    rejectedUserId: integer('rejected_user_id').references(() => users.id, {
      onDelete: 'cascade'
    }),
    sessionId: varchar('session_id', { length: 100 }).notNull(),
    reason: varchar('reason', { length: 50 }).notNull().default('cancelled'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_battle_session_rejections_user').on(table.userId),
    index('idx_battle_session_rejections_session').on(table.sessionId),
    index('idx_battle_session_rejections_expires').on(table.expiresAt),
    unique('unique_user_session_rejection').on(table.userId, table.sessionId)
  ]
)

export const userTradingStats = pgTable(
  'user_trading_stats',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    totalTrades: integer('total_trades').notNull().default(0),
    successfulTrades: integer('successful_trades').notNull().default(0),
    totalVolume: varchar('total_volume', { length: 50 }).notNull().default('0'),
    rating: integer('rating'),
    ratingCount: integer('rating_count').notNull().default(0),
    disputesWon: integer('disputes_won').notNull().default(0),
    disputesLost: integer('disputes_lost').notNull().default(0),
    lastTradeAt: timestamp('last_trade_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_user_trading_stats_user').on(table.userId),
    index('idx_user_trading_stats_rating').on(table.rating)
  ]
)
