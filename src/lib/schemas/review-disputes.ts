import { z } from 'zod'

export const reviewDisputeSchema = z.object({
  reviewId: z.number().int().positive(),
  reviewType: z.enum(['freelancer', 'client']),
  reason: z.enum([
    'false_information',
    'inappropriate_content',
    'retaliation',
    'unrelated_to_job',
    'spam',
    'other'
  ]),
  description: z.string().min(50).max(2000),
  evidence: z.array(z.string()).optional() // URLs to evidence files
})

export const disputeResolutionSchema = z.object({
  disputeId: z.number().int().positive(),
  resolution: z.enum(['upheld', 'dismissed', 'modified']),
  adminNote: z.string().min(20).max(1000),
  actionTaken: z.enum([
    'none',
    'review_removed',
    'review_hidden',
    'review_modified',
    'user_warned',
    'user_suspended'
  ])
})

export const disputeStatusSchema = z.enum([
  'pending',
  'under_review',
  'resolved',
  'dismissed'
])

export type ReviewDispute = z.infer<typeof reviewDisputeSchema>
export type DisputeResolution = z.infer<typeof disputeResolutionSchema>
export type DisputeStatus = z.infer<typeof disputeStatusSchema>
