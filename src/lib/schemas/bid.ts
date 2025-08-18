import { z } from 'zod'

// Bid submission schema
export const bidSubmissionSchema = z.object({
  jobId: z.number().positive('Invalid job ID'),
  bidAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid bid amount format')
    .refine(val => parseFloat(val) > 0, 'Bid amount must be greater than 0'),
  deliveryDays: z
    .number()
    .min(1, 'Delivery time must be at least 1 day')
    .max(365, 'Delivery time cannot exceed 365 days'),
  proposalText: z
    .string()
    .min(50, 'Proposal must be at least 50 characters')
    .max(5000, 'Proposal cannot exceed 5000 characters'),
  coverLetter: z
    .string()
    .min(30, 'Cover letter must be at least 30 characters')
    .max(2000, 'Cover letter cannot exceed 2000 characters')
    .optional(),
  milestones: z
    .array(
      z.object({
        title: z
          .string()
          .min(3, 'Milestone title must be at least 3 characters')
          .max(200, 'Milestone title cannot exceed 200 characters'),
        description: z
          .string()
          .min(10, 'Milestone description must be at least 10 characters')
          .max(1000, 'Milestone description cannot exceed 1000 characters'),
        amount: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format')
          .refine(val => parseFloat(val) > 0, 'Amount must be greater than 0'),
        deliveryDays: z
          .number()
          .min(1, 'Delivery time must be at least 1 day')
          .max(365, 'Delivery time cannot exceed 365 days')
      })
    )
    .optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url('Invalid attachment URL'),
        size: z.number().positive(),
        type: z.string()
      })
    )
    .max(5, 'Maximum 5 attachments allowed')
    .optional()
})

// Bid update schema
export const bidUpdateSchema = z.object({
  bidAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid bid amount format')
    .refine(val => parseFloat(val) > 0, 'Bid amount must be greater than 0')
    .optional(),
  deliveryDays: z
    .number()
    .min(1, 'Delivery time must be at least 1 day')
    .max(365, 'Delivery time cannot exceed 365 days')
    .optional(),
  proposalText: z
    .string()
    .min(50, 'Proposal must be at least 50 characters')
    .max(5000, 'Proposal cannot exceed 5000 characters')
    .optional(),
  coverLetter: z
    .string()
    .min(30, 'Cover letter must be at least 30 characters')
    .max(2000, 'Cover letter cannot exceed 2000 characters')
    .optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url('Invalid attachment URL'),
        size: z.number().positive(),
        type: z.string()
      })
    )
    .max(5, 'Maximum 5 attachments allowed')
    .optional()
})

// Bid status update schema
export const bidStatusUpdateSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'shortlisted', 'withdrawn']),
  reason: z.string().max(500).optional()
})

// Bid template schema
export const bidTemplateSchema = z.object({
  name: z
    .string()
    .min(3, 'Template name must be at least 3 characters')
    .max(100, 'Template name cannot exceed 100 characters'),
  proposalText: z
    .string()
    .min(50, 'Proposal must be at least 50 characters')
    .max(5000, 'Proposal cannot exceed 5000 characters'),
  coverLetter: z
    .string()
    .min(30, 'Cover letter must be at least 30 characters')
    .max(2000, 'Cover letter cannot exceed 2000 characters')
    .optional(),
  isDefault: z.boolean().default(false)
})

// Bid search/filter schema
export const bidSearchSchema = z.object({
  jobId: z.number().positive().optional(),
  freelancerId: z.number().positive().optional(),
  status: z
    .enum(['pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'])
    .optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  sortBy: z
    .enum(['newest', 'oldest', 'amount_low', 'amount_high', 'delivery_fast'])
    .optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
})

// Job invitation schema
export const jobInvitationSchema = z.object({
  jobId: z.number().positive('Invalid job ID'),
  freelancerIds: z
    .array(z.number().positive())
    .min(1, 'Select at least one freelancer')
    .max(10, 'Maximum 10 invitations at once'),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(1000, 'Message cannot exceed 1000 characters')
})

// Invitation response schema
export const invitationResponseSchema = z.object({
  status: z.enum(['accepted', 'declined']),
  message: z.string().max(500).optional()
})

// Shortlist schema
export const shortlistSchema = z.object({
  jobId: z.number().positive('Invalid job ID'),
  freelancerId: z.number().positive('Invalid freelancer ID'),
  notes: z.string().max(500).optional()
})

// Offer schema
export const offerSchema = z
  .object({
    bidId: z.number().positive('Invalid bid ID'),
    finalAmount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format')
      .refine(val => parseFloat(val) > 0, 'Amount must be greater than 0'),
    startDate: z.date().min(new Date(), 'Start date must be in the future'),
    endDate: z.date(),
    terms: z.string().max(2000).optional(),
    milestones: z
      .array(
        z.object({
          title: z.string().min(3).max(200),
          amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
          dueDate: z.date()
        })
      )
      .optional()
  })
  .refine(data => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate']
  })

// Type exports
export type BidSubmissionFormData = z.infer<typeof bidSubmissionSchema>
export type BidUpdateFormData = z.infer<typeof bidUpdateSchema>
export type BidStatusUpdateFormData = z.infer<typeof bidStatusUpdateSchema>
export type BidTemplateFormData = z.infer<typeof bidTemplateSchema>
export type BidSearchFormData = z.infer<typeof bidSearchSchema>
export type JobInvitationFormData = z.infer<typeof jobInvitationSchema>
export type InvitationResponseFormData = z.infer<
  typeof invitationResponseSchema
>
export type ShortlistFormData = z.infer<typeof shortlistSchema>
export type OfferFormData = z.infer<typeof offerSchema>
