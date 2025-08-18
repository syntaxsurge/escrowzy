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
  uniqueIndex,
  bigint
} from 'drizzle-orm/pg-core'

import { users } from './core'
import { skills } from './freelance-core'

export const freelancerReviews = pgTable(
  'freelancer_reviews',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id').notNull(),
    reviewerId: integer('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // Client who reviews
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1-5
    reviewText: text('review_text'),
    communicationRating: integer('communication_rating'), // 1-5
    qualityRating: integer('quality_rating'), // 1-5
    deadlineRating: integer('deadline_rating'), // 1-5
    skillsRating: jsonb('skills_rating').notNull().default('{}'), // {skillId: rating}
    wouldHireAgain: boolean('would_hire_again').notNull().default(true),
    isPublic: boolean('is_public').notNull().default(true),
    isPinned: boolean('is_pinned').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false), // Verified work relationship
    helpfulCount: integer('helpful_count').notNull().default(0),
    reportCount: integer('report_count').notNull().default(0),
    response: text('response'), // Freelancer's response
    responseAt: timestamp('response_at'),
    adminNote: text('admin_note'),
    isHidden: boolean('is_hidden').notNull().default(false),
    hiddenReason: text('hidden_reason'),
    hiddenAt: timestamp('hidden_at'),
    hiddenBy: integer('hidden_by').references(() => users.id, {
      onDelete: 'set null'
    }),
    metadata: jsonb('metadata').notNull().default('{}'),
    projectBudget: varchar('project_budget', { length: 50 }),
    projectDuration: integer('project_duration'), // in days
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_freelancer_reviews_job').on(table.jobId),
    index('idx_freelancer_reviews_reviewer').on(table.reviewerId),
    index('idx_freelancer_reviews_freelancer').on(table.freelancerId),
    index('idx_freelancer_reviews_rating').on(table.rating),
    index('idx_freelancer_reviews_public').on(table.isPublic),
    index('idx_freelancer_reviews_created').on(table.createdAt),
    uniqueIndex('unique_freelancer_review_per_job').on(
      table.jobId,
      table.reviewerId,
      table.freelancerId
    )
  ]
)

export const clientReviews = pgTable(
  'client_reviews',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id').notNull(),
    reviewerId: integer('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // Freelancer who reviews
    clientId: integer('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1-5
    reviewText: text('review_text'),
    paymentRating: integer('payment_rating'), // 1-5
    communicationRating: integer('communication_rating'), // 1-5
    clarityRating: integer('clarity_rating'), // 1-5
    wouldWorkAgain: boolean('would_work_again').notNull().default(true),
    isPublic: boolean('is_public').notNull().default(true),
    response: text('response'), // Client's response
    respondedAt: timestamp('responded_at'),
    isPinned: boolean('is_pinned').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false),
    helpfulCount: integer('helpful_count').notNull().default(0),
    reportCount: integer('report_count').notNull().default(0),
    adminNote: text('admin_note'),
    isHidden: boolean('is_hidden').notNull().default(false),
    hiddenReason: text('hidden_reason'),
    hiddenAt: timestamp('hidden_at'),
    hiddenBy: integer('hidden_by'),
    metadata: jsonb('metadata').notNull().default('{}'),
    projectBudget: varchar('project_budget', { length: 50 }),
    projectDuration: integer('project_duration'), // in days
    paymentTiming: varchar('payment_timing', { length: 50 }), // immediate, timely, delayed
    scopeClarity: integer('scope_clarity'), // 1-5
    feedbackQuality: integer('feedback_quality'), // 1-5
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_client_reviews_job').on(table.jobId),
    index('idx_client_reviews_reviewer').on(table.reviewerId),
    index('idx_client_reviews_client').on(table.clientId),
    index('idx_client_reviews_rating').on(table.rating),
    index('idx_client_reviews_public').on(table.isPublic),
    index('idx_client_reviews_created').on(table.createdAt),
    uniqueIndex('unique_client_review_per_job').on(
      table.jobId,
      table.reviewerId,
      table.clientId
    )
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
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: varchar('reason', { length: 50 }).notNull(), // false_information, inappropriate_content, etc.
    description: text('description').notNull(),
    evidence: jsonb('evidence').notNull().default('[]'), // Array of evidence URLs
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, under_review, resolved, dismissed
    resolution: varchar('resolution', { length: 20 }), // upheld, dismissed, modified
    adminNote: text('admin_note'),
    actionTaken: varchar('action_taken', { length: 50 }), // review_removed, review_hidden, etc.
    resolvedBy: integer('resolved_by').references(() => users.id, {
      onDelete: 'set null'
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_review_disputes_review').on(table.reviewId, table.reviewType),
    index('idx_review_disputes_disputed_by').on(table.disputedBy),
    index('idx_review_disputes_status').on(table.status),
    index('idx_review_disputes_resolved_by').on(table.resolvedBy),
    uniqueIndex('unique_review_dispute').on(
      table.reviewId,
      table.reviewType,
      table.disputedBy
    )
  ]
)

export const skillEndorsements = pgTable(
  'skill_endorsements',
  {
    id: serial('id').primaryKey(),
    endorserId: integer('endorser_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endorsedUserId: integer('endorsed_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillId: integer('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1-5
    relationship: varchar('relationship', { length: 50 }), // 'client', 'freelancer', 'colleague'
    projectContext: text('project_context'), // Brief description of project worked on
    verified: boolean('verified').notNull().default(false), // If endorser worked with endorsed on platform
    jobId: integer('job_id'), // Link to job if applicable
    endorsementNote: text('endorsement_note'),
    isPublic: boolean('is_public').notNull().default(true),
    weight: integer('weight').notNull().default(1), // Endorsement weight based on endorser's credibility
    metadata: jsonb('metadata').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_skill_endorsements_endorser').on(table.endorserId),
    index('idx_skill_endorsements_endorsed').on(table.endorsedUserId),
    index('idx_skill_endorsements_skill').on(table.skillId),
    index('idx_skill_endorsements_verified').on(table.verified),
    index('idx_skill_endorsements_public').on(table.isPublic),
    uniqueIndex('unique_skill_endorsement').on(
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
    verifiedBy: integer('verified_by').references(() => users.id, {
      onDelete: 'set null'
    }), // Admin who verified
    verificationDocument: text('verification_document'), // Document reference
    verificationScore: integer('verification_score'), // 0-100
    notes: text('notes'),
    revokedAt: timestamp('revoked_at'),
    revokedBy: integer('revoked_by').references(() => users.id, {
      onDelete: 'set null'
    }),
    revocationReason: text('revocation_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_verification_badges_user').on(table.userId),
    index('idx_verification_badges_type').on(table.badgeType),
    index('idx_verification_badges_active').on(table.isActive),
    index('idx_verification_badges_level').on(table.verificationLevel),
    uniqueIndex('unique_user_badge_type').on(table.userId, table.badgeType)
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
    jobsCompleted: integer('jobs_completed').notNull().default(0),
    totalEarnings: varchar('total_earnings', { length: 50 })
      .notNull()
      .default('0'),
    onTimeDeliveryRate: integer('on_time_delivery_rate').notNull().default(0), // percentage
    repeatClientRate: integer('repeat_client_rate').notNull().default(0), // percentage
    skillVerificationCount: integer('skill_verification_count')
      .notNull()
      .default(0),
    certificationCount: integer('certification_count').notNull().default(0),
    endorsementCount: integer('endorsement_count').notNull().default(0),
    disputeCount: integer('dispute_count').notNull().default(0),
    warningCount: integer('warning_count').notNull().default(0),
    suspensionCount: integer('suspension_count').notNull().default(0),
    trustScore: integer('trust_score').notNull().default(50), // 0-100
    professionalismScore: integer('professionalism_score')
      .notNull()
      .default(50), // 0-100
    communicationScore: integer('communication_score').notNull().default(50), // 0-100
    qualityScore: integer('quality_score').notNull().default(50), // 0-100
    reliabilityScore: integer('reliability_score').notNull().default(50), // 0-100
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_reputation_registry_user').on(table.userId),
    index('idx_reputation_registry_wallet').on(table.walletAddress),
    index('idx_reputation_registry_score').on(table.reputationScore),
    index('idx_reputation_registry_freelancer').on(table.isFreelancer),
    index('idx_reputation_registry_trust').on(table.trustScore),
    uniqueIndex('unique_reputation_registry_user').on(table.userId),
    uniqueIndex('unique_reputation_registry_wallet').on(table.walletAddress)
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
    contractAddress: varchar('contract_address', { length: 42 }),
    mintedBy: integer('minted_by').references(() => users.id, {
      onDelete: 'set null'
    }), // Admin who triggered mint
    mintingCost: varchar('minting_cost', { length: 50 }),
    attributes: jsonb('attributes').notNull().default('{}'),
    rarity: varchar('rarity', { length: 20 }), // common, uncommon, rare, epic, legendary
    transferable: boolean('transferable').notNull().default(false),
    burned: boolean('burned').notNull().default(false),
    burnedAt: timestamp('burned_at'),
    burnTxHash: varchar('burn_tx_hash', { length: 66 }),
    currentOwner: varchar('current_owner', { length: 42 }), // Current wallet owner
    transferHistory: jsonb('transfer_history').notNull().default('[]'),
    metadata: jsonb('metadata').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_reputation_nfts_user').on(table.userId),
    index('idx_reputation_nfts_type').on(table.nftType),
    index('idx_reputation_nfts_token').on(table.tokenId),
    index('idx_reputation_nfts_level').on(table.reputationLevel),
    index('idx_reputation_nfts_owner').on(table.currentOwner),
    index('idx_reputation_nfts_burned').on(table.burned),
    unique('unique_user_nft_level').on(
      table.userId,
      table.nftType,
      table.reputationLevel
    )
  ]
)
