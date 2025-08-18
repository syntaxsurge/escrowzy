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

export const workspaceSessions = pgTable(
  'workspace_sessions',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id').notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    index('idx_workspace_sessions_activity').on(table.lastActivityAt)
  ]
)

export const jobTasks = pgTable(
  'job_tasks',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id').notNull(),
    milestoneId: integer('milestone_id'),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).notNull().default('todo'), // todo, in_progress, review, done
    priority: varchar('priority', { length: 20 }).notNull().default('medium'), // low, medium, high, urgent
    assignedTo: integer('assigned_to').references(() => users.id, {
      onDelete: 'set null'
    }),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dueDate: timestamp('due_date'),
    completedAt: timestamp('completed_at'),
    estimatedHours: integer('estimated_hours'),
    actualHours: integer('actual_hours'),
    tags: jsonb('tags').notNull().default('[]'),
    attachments: jsonb('attachments').notNull().default('[]'),
    dependencies: jsonb('dependencies').notNull().default('[]'), // Array of task IDs
    subtasks: jsonb('subtasks').notNull().default('[]'),
    comments: jsonb('comments').notNull().default('[]'),
    sortOrder: integer('sort_order').notNull().default(0),
    isRecurring: boolean('is_recurring').notNull().default(false),
    recurringPattern: jsonb('recurring_pattern'), // For recurring tasks
    parentTaskId: integer('parent_task_id'), // For subtasks
    progressPercent: integer('progress_percent').notNull().default(0),
    timeTracked: integer('time_tracked').notNull().default(0), // in minutes
    billableTime: integer('billable_time').notNull().default(0), // in minutes
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_job_tasks_job').on(table.jobId),
    index('idx_job_tasks_milestone').on(table.milestoneId),
    index('idx_job_tasks_assigned').on(table.assignedTo),
    index('idx_job_tasks_created_by').on(table.createdBy),
    index('idx_job_tasks_status').on(table.status),
    index('idx_job_tasks_priority').on(table.priority),
    index('idx_job_tasks_due_date').on(table.dueDate),
    index('idx_job_tasks_parent').on(table.parentTaskId)
  ]
)

export const fileVersions = pgTable(
  'file_versions',
  {
    id: serial('id').primaryKey(),
    originalFileId: integer('original_file_id'), // Reference to first version
    attachmentId: integer('attachment_id').notNull(),
    jobId: integer('job_id').notNull(),
    versionNumber: integer('version_number').notNull().default(1),
    filename: text('filename').notNull(),
    path: text('path').notNull(),
    size: integer('size').notNull(),
    mimeType: text('mime_type').notNull(),
    uploadedBy: integer('uploaded_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    changeDescription: text('change_description'),
    isLatest: boolean('is_latest').notNull().default(true),
    checksum: varchar('checksum', { length: 64 }), // File integrity check
    downloadCount: integer('download_count').notNull().default(0),
    isPublic: boolean('is_public').notNull().default(false),
    expiresAt: timestamp('expires_at'),
    metadata: jsonb('metadata').notNull().default('{}'),
    tags: jsonb('tags').notNull().default('[]'),
    approvalStatus: varchar('approval_status', { length: 50 })
      .notNull()
      .default('pending'), // pending, approved, rejected
    approvedBy: integer('approved_by'),
    approvedAt: timestamp('approved_at'),
    rejectionReason: text('rejection_reason'),
    virusScanResult: varchar('virus_scan_result', { length: 50 }), // clean, infected, pending
    virusScanAt: timestamp('virus_scan_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_file_versions_job').on(table.jobId),
    index('idx_file_versions_attachment').on(table.attachmentId),
    index('idx_file_versions_uploaded_by').on(table.uploadedBy),
    index('idx_file_versions_latest').on(table.isLatest),
    index('idx_file_versions_original').on(table.originalFileId),
    index('idx_file_versions_approval').on(table.approvalStatus)
  ]
)

export const timeTracking = pgTable(
  'time_tracking',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id').notNull(),
    milestoneId: integer('milestone_id'),
    taskId: integer('task_id').references(() => jobTasks.id, {
      onDelete: 'set null'
    }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time'),
    duration: integer('duration'), // in minutes
    description: text('description'),
    isBillable: boolean('is_billable').notNull().default(true),
    hourlyRate: varchar('hourly_rate', { length: 50 }),
    totalAmount: varchar('total_amount', { length: 50 }),
    status: varchar('status', { length: 50 }).notNull().default('tracked'), // tracked, approved, invoiced, paid
    approvedBy: integer('approved_by'),
    approvedAt: timestamp('approved_at'),
    rejectedAt: timestamp('rejected_at'),
    rejectionReason: text('rejection_reason'),
    tags: jsonb('tags').notNull().default('[]'),
    screenshots: jsonb('screenshots').notNull().default('[]'),
    activityLevel: integer('activity_level'), // 0-100
    keystrokes: integer('keystrokes'),
    mouseClicks: integer('mouse_clicks'),
    appsUsed: jsonb('apps_used').notNull().default('[]'),
    websitesVisited: jsonb('websites_visited').notNull().default('[]'),
    breakTime: integer('break_time').notNull().default(0), // in minutes
    isManualEntry: boolean('is_manual_entry').notNull().default(false),
    timezone: varchar('timezone', { length: 50 }),
    clientNote: text('client_note'),
    freelancerNote: text('freelancer_note'),
    invoiceId: integer('invoice_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_time_tracking_job').on(table.jobId),
    index('idx_time_tracking_user').on(table.userId),
    index('idx_time_tracking_milestone').on(table.milestoneId),
    index('idx_time_tracking_task').on(table.taskId),
    index('idx_time_tracking_status').on(table.status),
    index('idx_time_tracking_start').on(table.startTime),
    index('idx_time_tracking_billable').on(table.isBillable)
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
      .references(() => users.id, { onDelete: 'cascade' }),
    comment: text('comment').notNull(),
    coordinates: jsonb('coordinates'), // {x, y, width, height} for visual annotations
    pageNumber: integer('page_number'), // for PDFs
    lineNumber: integer('line_number'), // for code files
    status: varchar('status', { length: 50 }).notNull().default('open'), // open, resolved, archived
    resolvedBy: integer('resolved_by').references(() => users.id, {
      onDelete: 'set null'
    }),
    resolvedAt: timestamp('resolved_at'),
    parentAnnotationId: integer('parent_annotation_id'), // for threaded comments
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_file_annotations_file_version').on(table.fileVersionId),
    index('idx_file_annotations_user').on(table.userId),
    index('idx_file_annotations_status').on(table.status),
    index('idx_file_annotations_parent').on(table.parentAnnotationId)
  ]
)

export const deliveryPackages = pgTable(
  'delivery_packages',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id').notNull(),
    milestoneId: integer('milestone_id'),
    packageName: varchar('package_name', { length: 200 }).notNull(),
    description: text('description'),
    files: jsonb('files').notNull().default('[]'), // Array of file version IDs
    deliveredBy: integer('delivered_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, delivered, accepted, rejected
    deliveryNote: text('delivery_note'),
    acceptanceNote: text('acceptance_note'),
    signature: text('signature'), // Digital signature data
    signedBy: integer('signed_by').references(() => users.id, {
      onDelete: 'set null'
    }),
    deliveredAt: timestamp('delivered_at'),
    acceptedAt: timestamp('accepted_at'),
    rejectedAt: timestamp('rejected_at'),
    rejectionReason: text('rejection_reason'),
    version: integer('version').notNull().default(1),
    revisionRequested: boolean('revision_requested').notNull().default(false),
    revisionNote: text('revision_note'),
    revisionDeadline: timestamp('revision_deadline'),
    clientFeedback: text('client_feedback'),
    freelancerResponse: text('freelancer_response'),
    qualityScore: integer('quality_score'), // 1-10
    completionPercentage: integer('completion_percentage').notNull().default(0),
    attachments: jsonb('attachments').notNull().default('[]'),
    downloadCount: integer('download_count').notNull().default(0),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_delivery_packages_job').on(table.jobId),
    index('idx_delivery_packages_milestone').on(table.milestoneId),
    index('idx_delivery_packages_delivered_by').on(table.deliveredBy),
    index('idx_delivery_packages_status').on(table.status),
    index('idx_delivery_packages_delivered_at').on(table.deliveredAt)
  ]
)

export const workspaceEvents = pgTable(
  'workspace_events',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    eventType: varchar('event_type', { length: 50 }).notNull(), // deadline, milestone, review, delivery
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time'),
    location: text('location'),
    attendees: jsonb('attendees').notNull().default('[]'), // Array of user IDs
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isAllDay: boolean('is_all_day').notNull().default(false),
    reminderMinutes: integer('reminder_minutes'),
    status: varchar('status', { length: 50 }).notNull().default('scheduled'), // scheduled, in_progress, completed, cancelled
    recurring: boolean('recurring').notNull().default(false),
    recurringPattern: jsonb('recurring_pattern'), // For recurring events
    timeZone: varchar('time_zone', { length: 50 }),
    attachments: jsonb('attachments').notNull().default('[]'),
    notes: text('notes'),
    agenda: text('agenda'),
    outcomes: text('outcomes'),
    actionItems: jsonb('action_items').notNull().default('[]'),
    reminderSent: boolean('reminder_sent').notNull().default(false),
    reminderSentAt: timestamp('reminder_sent_at'),
    attendanceTracking: jsonb('attendance_tracking').notNull().default('{}'),
    recordingUrl: text('recording_url'),
    tags: jsonb('tags').notNull().default('[]'),
    isPrivate: boolean('is_private').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    cancelledAt: timestamp('cancelled_at'),
    completedAt: timestamp('completed_at')
  },
  table => [
    index('idx_workspace_events_job').on(table.jobId),
    index('idx_workspace_events_created_by').on(table.createdBy),
    index('idx_workspace_events_type').on(table.eventType),
    index('idx_workspace_events_start').on(table.startTime),
    index('idx_workspace_events_status').on(table.status)
  ]
)

export const milestoneRevisions = pgTable(
  'milestone_revisions',
  {
    id: serial('id').primaryKey(),
    milestoneId: integer('milestone_id').notNull(),
    requestedBy: integer('requested_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    milestoneId: integer('milestone_id').notNull(),
    senderId: integer('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    index('idx_milestone_chats_type').on(table.messageType)
  ]
)
