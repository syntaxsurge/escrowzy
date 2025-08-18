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
    categoryId: integer('category_id').references(() => jobCategories.id, {
      onDelete: 'set null'
    }),
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
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    professionalTitle: varchar('professional_title', { length: 200 }),
    bio: text('bio'),
    hourlyRate: varchar('hourly_rate', { length: 50 }),
    availability: varchar('availability', { length: 50 })
      .notNull()
      .default('available'),
    yearsOfExperience: integer('years_of_experience').notNull().default(0),
    languages: jsonb('languages').notNull().default('[]'),
    timezone: varchar('timezone', { length: 50 }),
    portfolioUrl: text('portfolio_url'),
    linkedinUrl: text('linkedin_url'),
    githubUrl: text('github_url'),
    verificationStatus: varchar('verification_status', { length: 50 })
      .notNull()
      .default('unverified'),
    totalJobs: integer('total_jobs').notNull().default(0),
    totalEarnings: varchar('total_earnings', { length: 50 })
      .notNull()
      .default('0'),
    avgRating: integer('avg_rating').notNull().default(0),
    completionRate: integer('completion_rate').notNull().default(100),
    responseTime: integer('response_time'),
    lastActiveAt: timestamp('last_active_at'),
    metadata: jsonb('metadata').notNull().default('{}'),
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
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
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
      .default('intermediate'),
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

export const portfolioItems = pgTable(
  'portfolio_items',
  {
    id: serial('id').primaryKey(),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => freelancerProfiles.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    categoryId: integer('category_id').references(() => jobCategories.id, {
      onDelete: 'set null'
    }),
    skillsUsed: jsonb('skills_used').notNull().default('[]'),
    projectUrl: text('project_url'),
    images: jsonb('images').notNull().default('[]'),
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

export const savedJobs = pgTable(
  'saved_jobs',
  {
    id: serial('id').primaryKey(),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: integer('job_id').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_saved_jobs_freelancer').on(table.freelancerId),
    unique('unique_saved_job').on(table.freelancerId, table.jobId)
  ]
)

export const invoices = pgTable(
  'invoices',
  {
    id: serial('id').primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
    jobId: integer('job_id').notNull(),
    milestoneId: integer('milestone_id'),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clientId: integer('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: varchar('amount', { length: 50 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    status: varchar('status', { length: 50 }).notNull().default('draft'),
    dueDate: timestamp('due_date'),
    paidAt: timestamp('paid_at'),
    paymentMethod: varchar('payment_method', { length: 50 }),
    transactionHash: varchar('transaction_hash', { length: 100 }),
    description: text('description'),
    items: jsonb('items').notNull().default('[]'),
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
