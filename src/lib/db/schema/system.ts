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
    index('idx_job_queue_type').on(table.type),
    index('idx_job_queue_status').on(table.status),
    index('idx_job_queue_scheduled').on(table.scheduledAt),
    index('idx_job_queue_available').on(table.availableAt)
  ]
)

export const scheduledTasks = pgTable(
  'scheduled_tasks',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    taskType: varchar('task_type', { length: 50 }).notNull(), // cron, webhook, manual
    schedule: varchar('schedule', { length: 100 }), // Cron expression
    endpoint: varchar('endpoint', { length: 200 }), // API endpoint to call
    isActive: boolean('is_active').notNull().default(true),
    lastRunAt: timestamp('last_run_at'),
    nextRunAt: timestamp('next_run_at'),
    averageRunTime: integer('average_run_time'), // milliseconds
    successCount: integer('success_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    metadata: jsonb('metadata').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  table => [
    index('idx_scheduled_tasks_active').on(table.isActive),
    index('idx_scheduled_tasks_next_run').on(table.nextRunAt),
    index('idx_scheduled_tasks_type').on(table.taskType)
  ]
)

export const scheduledTaskRuns = pgTable(
  'scheduled_task_runs',
  {
    id: serial('id').primaryKey(),
    taskId: integer('task_id')
      .notNull()
      .references(() => scheduledTasks.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull(), // running, success, failed, timeout
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    runTime: integer('run_time'), // milliseconds
    output: text('output'),
    error: text('error'),
    metadata: jsonb('metadata').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  table => [
    index('idx_task_runs_task').on(table.taskId),
    index('idx_task_runs_status').on(table.status),
    index('idx_task_runs_started').on(table.startedAt)
  ]
)
