import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex
} from 'drizzle-orm/pg-core'

import { users } from './core'

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
      .references(() => users.id, { onDelete: 'cascade' }),
    stepId: integer('step_id')
      .notNull()
      .references(() => onboardingSteps.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at'),
    skippedAt: timestamp('skipped_at'),
    startedAt: timestamp('started_at').defaultNow()
  },
  table => [
    uniqueIndex('onboarding_progress_user_step_idx').on(
      table.userId,
      table.stepId
    )
  ]
)

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
      .references(() => users.id, { onDelete: 'cascade' }),
    tutorialId: integer('tutorial_id')
      .notNull()
      .references(() => tutorials.id, { onDelete: 'cascade' }),
    currentStep: integer('current_step').default(0),
    completedSteps: jsonb('completed_steps').default('[]'),
    completedAt: timestamp('completed_at'),
    startedAt: timestamp('started_at').defaultNow(),
    lastAccessedAt: timestamp('last_accessed_at').defaultNow()
  },
  table => [
    uniqueIndex('tutorial_progress_user_tutorial_idx').on(
      table.userId,
      table.tutorialId
    )
  ]
)

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
    .references(() => faqCategories.id, { onDelete: 'cascade' }),
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
      .references(() => faqItems.id, { onDelete: 'cascade' }),
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    sessionId: varchar('session_id', { length: 100 }), // For anonymous users
    isHelpful: boolean('is_helpful').notNull(),
    feedback: text('feedback'),
    createdAt: timestamp('created_at').defaultNow()
  },
  table => [
    uniqueIndex('faq_votes_user_faq_idx').on(table.userId, table.faqId),
    uniqueIndex('faq_votes_session_faq_idx').on(table.sessionId, table.faqId)
  ]
)

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
  authorId: integer('author_id').references(() => users.id, {
    onDelete: 'set null'
  }),
  lastReviewedAt: timestamp('last_reviewed_at'),
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

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
      .references(() => users.id, { onDelete: 'cascade' }),
    videoId: integer('video_id')
      .notNull()
      .references(() => videoTutorials.id, { onDelete: 'cascade' }),
    watchedSeconds: integer('watched_seconds').default(0),
    completedAt: timestamp('completed_at'),
    lastWatchedAt: timestamp('last_watched_at').defaultNow()
  },
  table => [
    uniqueIndex('video_progress_user_video_idx').on(table.userId, table.videoId)
  ]
)

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
