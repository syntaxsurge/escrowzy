import { z } from 'zod'

export const freelancerReviewSchema = z.object({
  jobId: z.number().int().positive(),
  freelancerId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(10).max(5000),
  communicationRating: z.number().int().min(1).max(5).optional(),
  qualityRating: z.number().int().min(1).max(5).optional(),
  deadlineRating: z.number().int().min(1).max(5).optional(),
  skillsRating: z
    .record(z.string(), z.number().int().min(1).max(5))
    .default({}),
  wouldHireAgain: z.boolean().default(true),
  isPublic: z.boolean().default(true)
})

export const clientReviewSchema = z.object({
  jobId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(10).max(5000),
  paymentRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  clarityRating: z.number().int().min(1).max(5).optional(),
  wouldWorkAgain: z.boolean().default(true),
  isPublic: z.boolean().default(true)
})

export const reviewResponseSchema = z.object({
  response: z.string().min(10).max(2000)
})

export const reviewFilterSchema = z.object({
  userId: z.number().int().positive().optional(),
  jobId: z.number().int().positive().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  minRating: z.number().int().min(1).max(5).optional(),
  isPublic: z.boolean().optional(),
  hasResponse: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'rating', 'helpful']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
})

export const reviewModerationSchema = z.object({
  action: z.enum(['approve', 'reject', 'hide', 'delete']),
  reason: z.string().min(10).max(500).optional(),
  moderatorNote: z.string().max(1000).optional()
})

export const reviewReportSchema = z.object({
  reason: z.enum([
    'inappropriate',
    'spam',
    'fake',
    'offensive',
    'irrelevant',
    'other'
  ]),
  description: z.string().min(10).max(1000)
})

export const reviewAnalyticsSchema = z.object({
  userId: z.number().int().positive().optional(),
  jobCategoryId: z.number().int().positive().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'category', 'rating']).optional()
})

export const reviewPromptSchema = z.object({
  sendReminder: z.boolean().default(true),
  reminderDelay: z.number().int().min(1).max(30).default(3), // days
  incentiveXP: z.number().int().min(0).max(1000).default(50)
})

export const reviewStatsSchema = z.object({
  totalReviews: z.number().int().nonnegative(),
  averageRating: z.number().min(0).max(5),
  ratingBreakdown: z.object({
    1: z.number().int().nonnegative(),
    2: z.number().int().nonnegative(),
    3: z.number().int().nonnegative(),
    4: z.number().int().nonnegative(),
    5: z.number().int().nonnegative()
  }),
  detailedRatings: z
    .object({
      communication: z.number().min(0).max(5).optional(),
      quality: z.number().min(0).max(5).optional(),
      deadline: z.number().min(0).max(5).optional(),
      payment: z.number().min(0).max(5).optional(),
      clarity: z.number().min(0).max(5).optional()
    })
    .optional(),
  recentReviews: z.array(z.any()).optional(),
  responseRate: z.number().min(0).max(100).optional()
})

export type FreelancerReviewInput = z.infer<typeof freelancerReviewSchema>
export type ClientReviewInput = z.infer<typeof clientReviewSchema>
export type ReviewResponse = z.infer<typeof reviewResponseSchema>
export type ReviewFilter = z.infer<typeof reviewFilterSchema>
export type ReviewModeration = z.infer<typeof reviewModerationSchema>
export type ReviewReport = z.infer<typeof reviewReportSchema>
export type ReviewAnalytics = z.infer<typeof reviewAnalyticsSchema>
export type ReviewPrompt = z.infer<typeof reviewPromptSchema>
export type ReviewStats = z.infer<typeof reviewStatsSchema>
