import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  decimal
} from 'drizzle-orm/pg-core'

import { users } from './core'

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
    .references(() => users.id, { onDelete: 'cascade' }),
  campaignId: integer('campaign_id').references(() => referralCampaigns.id, {
    onDelete: 'set null'
  }),
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
    .references(() => referralLinks.id, { onDelete: 'cascade' }),
  referrerId: integer('referrer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refereeId: integer('referee_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  campaignId: integer('campaign_id').references(() => referralCampaigns.id, {
    onDelete: 'set null'
  }),
  conversionType: varchar('conversion_type', { length: 50 }).notNull(), // signup, first_purchase, etc.
  referrerRewardStatus: varchar('referrer_reward_status', {
    length: 20
  }).default('pending'),
  refereeRewardStatus: varchar('referee_reward_status', { length: 20 }).default(
    'pending'
  ),
  referrerRewardAmount: jsonb('referrer_reward_amount'),
  refereeRewardAmount: jsonb('referee_reward_amount'),
  conversionValue: decimal('conversion_value', { precision: 10, scale: 2 }),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }),
  commissionAmount: decimal('commission_amount', { precision: 10, scale: 2 }),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

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
  approvedBy: integer('approved_by').references(() => users.id, {
    onDelete: 'set null'
  }),
  contractSignedAt: timestamp('contract_signed_at'),
  lastActivityAt: timestamp('last_activity_at'),
  performanceMetrics: jsonb('performance_metrics'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const partnerCommissions = pgTable('partner_commissions', {
  id: serial('id').primaryKey(),
  partnerId: integer('partner_id')
    .notNull()
    .references(() => partners.id, { onDelete: 'cascade' }),
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
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

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
    .references(() => users.id, { onDelete: 'cascade' }),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords'),
  ogImage: varchar('og_image', { length: 500 }),
  readTime: integer('read_time'), // in minutes
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  shareCount: integer('share_count').default(0),
  commentCount: integer('comment_count').default(0),
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at'),
  isFeatured: boolean('is_featured').default(false),
  isPinned: boolean('is_pinned').default(false),
  status: varchar('status', { length: 20 }).default('draft'), // draft, review, published, archived
  reviewedBy: integer('reviewed_by').references(() => users.id, {
    onDelete: 'set null'
  }),
  reviewedAt: timestamp('reviewed_at'),
  lastModifiedBy: integer('last_modified_by').references(() => users.id, {
    onDelete: 'set null'
  }),
  version: integer('version').default(1),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const blogComments = pgTable('blog_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => blogPosts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'set null'
  }),
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

export const socialShares = pgTable('social_shares', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'set null'
  }),
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
