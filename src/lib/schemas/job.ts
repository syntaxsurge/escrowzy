import { z } from 'zod'

// Milestone schema
export const milestoneSchema = z.object({
  title: z.string().min(5, 'Milestone title must be at least 5 characters'),
  description: z.string().optional(),
  amount: z.string().min(1, 'Amount is required'),
  dueDate: z.string().optional()
})

// Job posting schema for creation
export const createJobPostingSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  categoryId: z.number().int().positive('Please select a category'),
  budgetType: z.enum(['fixed', 'hourly']),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  currency: z.string().default('USD'),
  deadline: z.string().optional(),
  experienceLevel: z
    .enum(['entry', 'intermediate', 'expert'])
    .default('intermediate'),
  projectDuration: z.string().optional(),
  skillsRequired: z.array(z.string()).min(1, 'At least one skill is required'),
  milestones: z.array(milestoneSchema).optional(),
  locationRequirement: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  requiresNDA: z.boolean().default(false),
  requiresBackground: z.boolean().default(false),
  visibility: z.enum(['public', 'private', 'invite_only']).default('public'),
  attachments: z.array(z.string()).optional()
})

// Job posting schema for updates
export const updateJobPostingSchema = createJobPostingSchema.partial()

// Job filters schema
export const jobFiltersSchema = z.object({
  search: z.string().optional(),
  categoryId: z.number().optional(),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  experienceLevel: z.enum(['entry', 'intermediate', 'expert']).optional(),
  skillsRequired: z.array(z.string()).optional(),
  status: z.string().optional(),
  sortBy: z
    .enum(['newest', 'budget_high', 'budget_low', 'deadline'])
    .optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

// Bid schema
export const createBidSchema = z.object({
  jobId: z.number().int().positive(),
  bidAmount: z.string().min(1, 'Bid amount is required'),
  deliveryDays: z.number().int().positive('Delivery days must be positive'),
  proposalText: z.string().min(100, 'Proposal must be at least 100 characters'),
  coverLetter: z.string().optional(),
  milestones: z.array(milestoneSchema).optional(),
  attachments: z.array(z.string()).optional()
})

// Job invitation schema
export const createInvitationSchema = z.object({
  jobId: z.number().int().positive(),
  freelancerId: z.number().int().positive(),
  message: z.string().optional()
})

export type CreateJobPosting = z.infer<typeof createJobPostingSchema>
export type UpdateJobPosting = z.infer<typeof updateJobPostingSchema>
export type JobFilters = z.infer<typeof jobFiltersSchema>
export type CreateBid = z.infer<typeof createBidSchema>
export type CreateInvitation = z.infer<typeof createInvitationSchema>
export type Milestone = z.infer<typeof milestoneSchema>
