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
  uniqueIndex
} from 'drizzle-orm/pg-core'

import { users } from './core'
import { jobCategories } from './freelance-core'

export const jobPostings = pgTable(
  'job_postings',
  {
    id: serial('id').primaryKey(),
    clientId: integer('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    attachments: jsonb('attachments').notNull().default('[]'),
    milestones: jsonb('milestones').notNull().default('[]'),
    applicationDeadline: timestamp('application_deadline'),
    isUrgent: boolean('is_urgent').notNull().default(false),
    requiredHours: integer('required_hours'),
    teamSize: integer('team_size').default(1),
    locationRequirement: varchar('location_requirement', { length: 100 }), // remote | onsite | hybrid
    status: varchar('status', { length: 50 }).notNull().default('open'), // draft | open | closed | cancelled | in_progress | completed
    visibility: varchar('visibility', { length: 20 })
      .notNull()
      .default('public'), // public | private | invite_only
    inviteOnly: boolean('invite_only').notNull().default(false),
    autoAcceptBids: boolean('auto_accept_bids').notNull().default(false),
    maxBids: integer('max_bids'),
    currentBidsCount: integer('current_bids_count').notNull().default(0),
    viewsCount: integer('views_count').notNull().default(0),
    shortlistedBidsCount: integer('shortlisted_bids_count')
      .notNull()
      .default(0),
    acceptedBidId: integer('accepted_bid_id'),
    // Freelancer assignment (backwards compatibility)
    freelancerId: integer('freelancer_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    assignedFreelancerId: integer('assigned_freelancer_id').references(
      () => users.id,
      { onDelete: 'set null' }
    ),
    assignedAt: timestamp('assigned_at'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    // Contract details
    contractSignedAt: timestamp('contract_signed_at'),
    totalBudget: varchar('total_budget', { length: 50 }),
    paidAmount: varchar('paid_amount', { length: 50 }).default('0'),
    escrowId: integer('escrow_id'), // Reference to blockchain escrow
    // Quality assurance
    requiresNDA: boolean('requires_nda').notNull().default(false),
    requiresBackground: boolean('requires_background').notNull().default(false),
    requiresInterview: boolean('requires_interview').notNull().default(false),
    // SEO and content
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: text('seo_description'),
    slug: varchar('slug', { length: 255 }).unique(),
    tags: jsonb('tags').notNull().default('[]'),
    metadata: jsonb('metadata').notNull().default('{}'),
    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    publishedAt: timestamp('published_at'),
    archivedAt: timestamp('archived_at')
  },
  table => [
    index('idx_job_postings_client').on(table.clientId),
    index('idx_job_postings_category').on(table.categoryId),
    index('idx_job_postings_status').on(table.status),
    index('idx_job_postings_deadline').on(table.deadline),
    index('idx_job_postings_created').on(table.createdAt),
    index('idx_job_postings_budget').on(table.budgetType),
    index('idx_job_postings_location').on(table.locationRequirement),
    index('idx_job_postings_visibility').on(table.visibility),
    index('idx_job_postings_assigned').on(table.assignedFreelancerId)
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
    refundedAt: timestamp('refunded_at'),
    sortOrder: integer('sort_order').notNull().default(0),
    autoReleaseEnabled: boolean('auto_release_enabled').notNull().default(true),
    autoReleaseDays: integer('auto_release_days').default(7),
    disputeReason: text('dispute_reason'),
    disputedAt: timestamp('disputed_at'),
    disputeResolvedAt: timestamp('dispute_resolved_at'),
    attachments: jsonb('attachments').notNull().default('[]'),
    revisionRequests: jsonb('revision_requests').notNull().default('[]'),
    timeTracked: integer('time_tracked').default(0), // in minutes
    metadata: jsonb('metadata').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_job_milestones_job').on(table.jobId),
    index('idx_job_milestones_status').on(table.status),
    index('idx_job_milestones_due_date').on(table.dueDate),
    index('idx_job_milestones_sort').on(table.jobId, table.sortOrder)
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
      .references(() => users.id, { onDelete: 'cascade' }),
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
    totalAmount: varchar('total_amount', { length: 50 }), // Including fees
    platformFee: varchar('platform_fee', { length: 50 }),
    netAmount: varchar('net_amount', { length: 50 }),
    freelancerRank: integer('freelancer_rank'),
    matchingScore: integer('matching_score'), // 0-100
    isAutoBid: boolean('is_auto_bid').notNull().default(false),
    bidSource: varchar('bid_source', { length: 50 }).default('manual'), // manual | template | auto
    templateUsed: integer('template_used'),
    questions: jsonb('questions').notNull().default('[]'),
    answers: jsonb('answers').notNull().default('[]'),
    portfolio: jsonb('portfolio').notNull().default('[]'),
    certifications: jsonb('certifications').notNull().default('[]'),
    rejectionReason: text('rejection_reason'),
    clientFeedback: text('client_feedback'),
    freelancerResponse: text('freelancer_response'),
    negotiationHistory: jsonb('negotiation_history').notNull().default('[]'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    withdrawnAt: timestamp('withdrawn_at')
  },
  table => [
    index('idx_job_bids_job').on(table.jobId),
    index('idx_job_bids_freelancer').on(table.freelancerId),
    index('idx_job_bids_status').on(table.status),
    index('idx_job_bids_amount').on(table.bidAmount),
    index('idx_job_bids_created').on(table.createdAt),
    uniqueIndex('unique_job_freelancer_bid').on(table.jobId, table.freelancerId)
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
      .references(() => users.id, { onDelete: 'cascade' }),
    invitedBy: integer('invited_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    message: text('message'),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending | accepted | declined
    respondedAt: timestamp('responded_at'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_job_invitations_job').on(table.jobId),
    index('idx_job_invitations_freelancer').on(table.freelancerId),
    uniqueIndex('unique_job_freelancer_invitation').on(
      table.jobId,
      table.freelancerId
    )
  ]
)

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

export const jobAlerts = pgTable(
  'job_alerts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    savedSearchId: integer('saved_search_id').references(
      () => savedSearches.id,
      { onDelete: 'set null' }
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
    index('idx_job_alerts_job').on(table.jobId),
    index('idx_job_alerts_status').on(table.status),
    index('idx_job_alerts_type').on(table.alertType)
  ]
)

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
      .references(() => users.id, { onDelete: 'cascade' }),
    freelancerId: integer('freelancer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scheduledAt: timestamp('scheduled_at').notNull(),
    duration: integer('duration').notNull().default(30), // in minutes
    meetingType: varchar('meeting_type', { length: 50 })
      .notNull()
      .default('video'), // video, phone, in-person
    meetingUrl: text('meeting_url'),
    meetingId: varchar('meeting_id', { length: 255 }),
    location: text('location'),
    agenda: text('agenda'),
    questions: jsonb('questions').notNull().default('[]'),
    status: varchar('status', { length: 50 }).notNull().default('scheduled'), // scheduled, in_progress, completed, cancelled, no_show
    clientConfirmed: boolean('client_confirmed').notNull().default(false),
    freelancerConfirmed: boolean('freelancer_confirmed').notNull().default(false),
    attendanceStatus: jsonb('attendance_status').notNull().default('{}'), // {clientId: 'present', freelancerId: 'absent'}
    startedAt: timestamp('started_at'),
    endedAt: timestamp('ended_at'),
    actualDuration: integer('actual_duration'), // in minutes
    notes: text('notes'),
    clientNotes: text('client_notes'),
    freelancerNotes: text('freelancer_notes'),
    rating: integer('rating'), // 1-5
    outcome: varchar('outcome', { length: 50 }), // hire, reject, second_interview, undecided
    nextSteps: text('next_steps'),
    recordingUrl: text('recording_url'),
    reminderSent: boolean('reminder_sent').notNull().default(false),
    reminderSentAt: timestamp('reminder_sent_at'),
    followUpScheduled: boolean('follow_up_scheduled').notNull().default(false),
    followUpDate: timestamp('follow_up_date'),
    feedback: jsonb('feedback').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    cancelledAt: timestamp('cancelled_at'),
    cancelledBy: integer('cancelled_by').references(() => users.id, {
      onDelete: 'set null'
    }),
    cancelReason: text('cancel_reason'),
    cancellationReason: text('cancellation_reason')
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
