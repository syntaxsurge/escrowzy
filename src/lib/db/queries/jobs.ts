import 'server-only'

import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm'

import type { User } from '@/lib/db/schema'

import { db } from '../drizzle'
import {
  jobBids,
  jobCategories,
  jobMilestones,
  jobPostings,
  savedJobs,
  users
} from '../schema'

// Types
export interface JobPostingWithRelations {
  id: number
  clientId: number
  title: string
  description: string
  categoryId: number
  budgetType: 'fixed' | 'hourly'
  budgetMin: string | null
  budgetMax: string | null
  currency: string
  deadline: Date | null
  skillsRequired: any
  experienceLevel: string
  projectDuration: string | null
  visibility: string
  status: string
  attachments: any
  metadata: any
  freelancerId: number | null
  viewCount: number
  bidCount: number
  avgBidAmount: string | null
  isFeatured: boolean
  featuredUntil: Date | null
  createdAt: Date
  updatedAt: Date
  client: Omit<User, 'passwordHash'>
  category: {
    id: number
    name: string
    slug: string
    description: string | null
    parentCategoryId: number | null
    icon: string | null
  } | null
  milestones?: Array<{
    id: number
    title: string
    description: string | null
    amount: string
    dueDate: Date | null
    status: string
  }>
  bids?: Array<{
    id: number
    freelancerId: number
    bidAmount: string
    deliveryTimeDays: number
    proposalText: string
    status: string
    createdAt: Date
  }>
  freelancer?: User | null
}

export interface JobFilters {
  search?: string
  categoryId?: number
  budgetMin?: string
  budgetMax?: string
  experienceLevel?: string
  skillsRequired?: string[]
  status?: string
  clientId?: number
  sortBy?: 'newest' | 'budget_high' | 'budget_low' | 'deadline'
  limit?: number
  offset?: number
}

// Get single job with all relations
export async function getJobById(
  jobId: number
): Promise<JobPostingWithRelations | null> {
  const [job] = await db
    .select({
      id: jobPostings.id,
      clientId: jobPostings.clientId,
      title: jobPostings.title,
      description: jobPostings.description,
      categoryId: jobPostings.categoryId,
      budgetType: jobPostings.budgetType,
      budgetMin: jobPostings.budgetMin,
      budgetMax: jobPostings.budgetMax,
      currency: jobPostings.currency,
      deadline: jobPostings.deadline,
      skillsRequired: jobPostings.skillsRequired,
      experienceLevel: jobPostings.experienceLevel,
      projectDuration: jobPostings.projectDuration,
      visibility: jobPostings.visibility,
      status: jobPostings.status,
      attachments: jobPostings.attachments,
      metadata: jobPostings.metadata,
      freelancerId: jobPostings.freelancerId,
      viewCount: jobPostings.viewCount,
      bidCount: jobPostings.bidCount,
      avgBidAmount: jobPostings.avgBidAmount,
      isFeatured: jobPostings.isFeatured,
      featuredUntil: jobPostings.featuredUntil,
      createdAt: jobPostings.createdAt,
      updatedAt: jobPostings.updatedAt,
      client: {
        id: users.id,
        name: users.name,
        email: users.email,
        walletAddress: users.walletAddress,
        avatarPath: users.avatarPath,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      },
      category: {
        id: jobCategories.id,
        name: jobCategories.name,
        slug: jobCategories.slug,
        description: jobCategories.description,
        parentCategoryId: jobCategories.parentCategoryId,
        icon: jobCategories.icon
      }
    })
    .from(jobPostings)
    .leftJoin(users, eq(jobPostings.clientId, users.id))
    .leftJoin(jobCategories, eq(jobPostings.categoryId, jobCategories.id))
    .where(eq(jobPostings.id, jobId))
    .limit(1)

  if (!job) return null

  // Get milestones
  const milestones = await db
    .select({
      id: jobMilestones.id,
      title: jobMilestones.title,
      description: jobMilestones.description,
      amount: jobMilestones.amount,
      dueDate: jobMilestones.dueDate,
      status: jobMilestones.status
    })
    .from(jobMilestones)
    .where(eq(jobMilestones.jobId, jobId))
    .orderBy(jobMilestones.sortOrder)

  // Get bids if needed
  const bids = await db
    .select({
      id: jobBids.id,
      freelancerId: jobBids.freelancerId,
      bidAmount: jobBids.bidAmount,
      deliveryTimeDays: jobBids.deliveryDays,
      proposalText: jobBids.proposalText,
      status: jobBids.status,
      createdAt: jobBids.createdAt
    })
    .from(jobBids)
    .where(eq(jobBids.jobId, jobId))
    .orderBy(desc(jobBids.createdAt))

  // Get freelancer if assigned
  let freelancer = null
  if (job.freelancerId) {
    const [freelancerData] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        walletAddress: users.walletAddress,
        avatarPath: users.avatarPath,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, job.freelancerId))
      .limit(1)

    freelancer = freelancerData || null
  }

  // Increment view count
  await db
    .update(jobPostings)
    .set({ viewCount: sql`${jobPostings.viewCount} + 1` })
    .where(eq(jobPostings.id, jobId))

  return {
    ...job,
    budgetType: job.budgetType as 'fixed' | 'hourly',
    milestones,
    bids,
    freelancer: freelancer as any
  } as JobPostingWithRelations
}

// Get jobs with filters
export async function getJobsWithFilters(filters: JobFilters): Promise<{
  jobs: JobPostingWithRelations[]
  total: number
}> {
  const conditions = []

  // Status filter (default to open)
  if (filters.status) {
    conditions.push(eq(jobPostings.status, filters.status))
  } else {
    conditions.push(eq(jobPostings.status, 'open'))
  }

  // Search filter
  if (filters.search) {
    conditions.push(
      or(
        ilike(jobPostings.title, `%${filters.search}%`),
        ilike(jobPostings.description, `%${filters.search}%`)
      )!
    )
  }

  // Category filter
  if (filters.categoryId) {
    conditions.push(eq(jobPostings.categoryId, filters.categoryId))
  }

  // Budget filters
  if (filters.budgetMin) {
    conditions.push(gte(jobPostings.budgetMax, filters.budgetMin))
  }
  if (filters.budgetMax) {
    conditions.push(lte(jobPostings.budgetMin, filters.budgetMax))
  }

  // Experience level filter
  if (filters.experienceLevel) {
    conditions.push(eq(jobPostings.experienceLevel, filters.experienceLevel))
  }

  // Client filter
  if (filters.clientId) {
    conditions.push(eq(jobPostings.clientId, filters.clientId))
  }

  // Skills filter (using JSONB contains)
  if (filters.skillsRequired && filters.skillsRequired.length > 0) {
    conditions.push(
      sql`${jobPostings.skillsRequired} @> ${JSON.stringify(filters.skillsRequired)}`
    )
  }

  // Build the query
  const query = db
    .select({
      id: jobPostings.id,
      clientId: jobPostings.clientId,
      title: jobPostings.title,
      description: jobPostings.description,
      categoryId: jobPostings.categoryId,
      budgetType: jobPostings.budgetType,
      budgetMin: jobPostings.budgetMin,
      budgetMax: jobPostings.budgetMax,
      currency: jobPostings.currency,
      deadline: jobPostings.deadline,
      skillsRequired: jobPostings.skillsRequired,
      experienceLevel: jobPostings.experienceLevel,
      projectDuration: jobPostings.projectDuration,
      visibility: jobPostings.visibility,
      status: jobPostings.status,
      attachments: jobPostings.attachments,
      metadata: jobPostings.metadata,
      freelancerId: jobPostings.freelancerId,
      viewCount: jobPostings.viewCount,
      bidCount: jobPostings.bidCount,
      avgBidAmount: jobPostings.avgBidAmount,
      isFeatured: jobPostings.isFeatured,
      featuredUntil: jobPostings.featuredUntil,
      createdAt: jobPostings.createdAt,
      updatedAt: jobPostings.updatedAt,
      client: {
        id: users.id,
        name: users.name,
        email: users.email,
        walletAddress: users.walletAddress,
        avatarPath: users.avatarPath,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      },
      category: {
        id: jobCategories.id,
        name: jobCategories.name,
        slug: jobCategories.slug,
        description: jobCategories.description,
        parentCategoryId: jobCategories.parentCategoryId,
        icon: jobCategories.icon
      }
    })
    .from(jobPostings)
    .leftJoin(users, eq(jobPostings.clientId, users.id))
    .leftJoin(jobCategories, eq(jobPostings.categoryId, jobCategories.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)

  // Apply sorting
  let orderBy
  switch (filters.sortBy) {
    case 'budget_high':
      orderBy = desc(jobPostings.budgetMax)
      break
    case 'budget_low':
      orderBy = jobPostings.budgetMin
      break
    case 'deadline':
      orderBy = jobPostings.deadline
      break
    case 'newest':
    default:
      orderBy = desc(jobPostings.createdAt)
      break
  }

  const jobsQuery = query
    .orderBy(orderBy)
    .limit(filters.limit || 20)
    .offset(filters.offset || 0)

  // Execute queries
  const [jobs, [{ count }]] = await Promise.all([
    jobsQuery,
    db
      .select({ count: sql<number>`count(*)` })
      .from(jobPostings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
  ])

  return {
    jobs: jobs as JobPostingWithRelations[],
    total: Number(count)
  }
}

// Get featured jobs
export async function getFeaturedJobs(
  limit: number = 5
): Promise<JobPostingWithRelations[]> {
  const jobs = await db
    .select({
      id: jobPostings.id,
      clientId: jobPostings.clientId,
      title: jobPostings.title,
      description: jobPostings.description,
      categoryId: jobPostings.categoryId,
      budgetType: jobPostings.budgetType,
      budgetMin: jobPostings.budgetMin,
      budgetMax: jobPostings.budgetMax,
      currency: jobPostings.currency,
      deadline: jobPostings.deadline,
      skillsRequired: jobPostings.skillsRequired,
      experienceLevel: jobPostings.experienceLevel,
      projectDuration: jobPostings.projectDuration,
      visibility: jobPostings.visibility,
      status: jobPostings.status,
      attachments: jobPostings.attachments,
      metadata: jobPostings.metadata,
      freelancerId: jobPostings.freelancerId,
      viewCount: jobPostings.viewCount,
      bidCount: jobPostings.bidCount,
      avgBidAmount: jobPostings.avgBidAmount,
      isFeatured: jobPostings.isFeatured,
      featuredUntil: jobPostings.featuredUntil,
      createdAt: jobPostings.createdAt,
      updatedAt: jobPostings.updatedAt,
      client: {
        id: users.id,
        name: users.name,
        email: users.email,
        walletAddress: users.walletAddress,
        avatarPath: users.avatarPath,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      },
      category: {
        id: jobCategories.id,
        name: jobCategories.name,
        slug: jobCategories.slug,
        description: jobCategories.description,
        parentCategoryId: jobCategories.parentCategoryId,
        icon: jobCategories.icon
      }
    })
    .from(jobPostings)
    .leftJoin(users, eq(jobPostings.clientId, users.id))
    .leftJoin(jobCategories, eq(jobPostings.categoryId, jobCategories.id))
    .where(
      and(
        eq(jobPostings.status, 'open'),
        eq(jobPostings.isFeatured, true),
        or(gte(jobPostings.featuredUntil, new Date()))!
      )
    )
    .orderBy(desc(jobPostings.createdAt))
    .limit(limit)

  return jobs as unknown as JobPostingWithRelations[]
}

// Save job as draft
export async function saveJobDraft(
  userId: number,
  jobData: Partial<typeof jobPostings.$inferInsert>
): Promise<number> {
  const [draft] = await db
    .insert(jobPostings)
    .values({
      title: jobData.title || '',
      description: jobData.description || '',
      categoryId: jobData.categoryId || 1,
      budgetType: jobData.budgetType || 'fixed',
      experienceLevel: jobData.experienceLevel || 'intermediate',
      skillsRequired: jobData.skillsRequired || [],
      clientId: userId,
      status: 'draft',
      visibility: 'private'
    } as any)
    .returning({ id: jobPostings.id })

  return draft.id
}

// Update job draft
export async function updateJobDraft(
  jobId: number,
  userId: number,
  jobData: Partial<typeof jobPostings.$inferInsert>
): Promise<boolean> {
  const result = await db
    .update(jobPostings)
    .set({
      ...jobData,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(jobPostings.id, jobId),
        eq(jobPostings.clientId, userId),
        eq(jobPostings.status, 'draft')
      )
    )

  return true
}

// Get user's job drafts
export async function getJobDrafts(
  userId: number
): Promise<JobPostingWithRelations[]> {
  const drafts = await db
    .select({
      id: jobPostings.id,
      clientId: jobPostings.clientId,
      title: jobPostings.title,
      description: jobPostings.description,
      categoryId: jobPostings.categoryId,
      budgetType: jobPostings.budgetType,
      budgetMin: jobPostings.budgetMin,
      budgetMax: jobPostings.budgetMax,
      currency: jobPostings.currency,
      deadline: jobPostings.deadline,
      skillsRequired: jobPostings.skillsRequired,
      experienceLevel: jobPostings.experienceLevel,
      projectDuration: jobPostings.projectDuration,
      visibility: jobPostings.visibility,
      status: jobPostings.status,
      attachments: jobPostings.attachments,
      metadata: jobPostings.metadata,
      freelancerId: jobPostings.freelancerId,
      viewCount: jobPostings.viewCount,
      bidCount: jobPostings.bidCount,
      avgBidAmount: jobPostings.avgBidAmount,
      isFeatured: jobPostings.isFeatured,
      featuredUntil: jobPostings.featuredUntil,
      createdAt: jobPostings.createdAt,
      updatedAt: jobPostings.updatedAt,
      client: {
        id: users.id,
        name: users.name,
        email: users.email,
        walletAddress: users.walletAddress,
        avatarPath: users.avatarPath,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      },
      category: {
        id: jobCategories.id,
        name: jobCategories.name,
        slug: jobCategories.slug,
        description: jobCategories.description,
        parentCategoryId: jobCategories.parentCategoryId,
        icon: jobCategories.icon
      }
    })
    .from(jobPostings)
    .leftJoin(users, eq(jobPostings.clientId, users.id))
    .leftJoin(jobCategories, eq(jobPostings.categoryId, jobCategories.id))
    .where(
      and(eq(jobPostings.clientId, userId), eq(jobPostings.status, 'draft'))
    )
    .orderBy(desc(jobPostings.updatedAt))

  return drafts as unknown as JobPostingWithRelations[]
}

// Toggle saved job
export async function toggleSavedJob(
  userId: number,
  jobId: number
): Promise<boolean> {
  // Check if already saved
  const [existing] = await db
    .select()
    .from(savedJobs)
    .where(and(eq(savedJobs.freelancerId, userId), eq(savedJobs.jobId, jobId)))
    .limit(1)

  if (existing) {
    // Remove from saved
    await db
      .delete(savedJobs)
      .where(
        and(eq(savedJobs.freelancerId, userId), eq(savedJobs.jobId, jobId))
      )
    return false
  } else {
    // Add to saved
    await db.insert(savedJobs).values({
      freelancerId: userId,
      jobId
    })
    return true
  }
}

// Get user's saved jobs
export async function getSavedJobs(
  userId: number
): Promise<JobPostingWithRelations[]> {
  const jobs = await db
    .select({
      id: jobPostings.id,
      clientId: jobPostings.clientId,
      title: jobPostings.title,
      description: jobPostings.description,
      categoryId: jobPostings.categoryId,
      budgetType: jobPostings.budgetType,
      budgetMin: jobPostings.budgetMin,
      budgetMax: jobPostings.budgetMax,
      currency: jobPostings.currency,
      deadline: jobPostings.deadline,
      skillsRequired: jobPostings.skillsRequired,
      experienceLevel: jobPostings.experienceLevel,
      projectDuration: jobPostings.projectDuration,
      visibility: jobPostings.visibility,
      status: jobPostings.status,
      attachments: jobPostings.attachments,
      metadata: jobPostings.metadata,
      freelancerId: jobPostings.freelancerId,
      viewCount: jobPostings.viewCount,
      bidCount: jobPostings.bidCount,
      avgBidAmount: jobPostings.avgBidAmount,
      isFeatured: jobPostings.isFeatured,
      featuredUntil: jobPostings.featuredUntil,
      createdAt: jobPostings.createdAt,
      updatedAt: jobPostings.updatedAt,
      client: {
        id: users.id,
        name: users.name,
        email: users.email,
        walletAddress: users.walletAddress,
        avatarPath: users.avatarPath,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      },
      category: {
        id: jobCategories.id,
        name: jobCategories.name,
        slug: jobCategories.slug,
        description: jobCategories.description,
        parentCategoryId: jobCategories.parentCategoryId,
        icon: jobCategories.icon
      },
      savedAt: savedJobs.createdAt
    })
    .from(savedJobs)
    .innerJoin(jobPostings, eq(savedJobs.jobId, jobPostings.id))
    .leftJoin(users, eq(jobPostings.clientId, users.id))
    .leftJoin(jobCategories, eq(jobPostings.categoryId, jobCategories.id))
    .where(eq(savedJobs.freelancerId, userId))
    .orderBy(desc(savedJobs.createdAt))

  return jobs as unknown as JobPostingWithRelations[]
}

// Get job categories with counts
export async function getJobCategoriesWithCounts() {
  const categories = await db
    .select({
      id: jobCategories.id,
      name: jobCategories.name,
      slug: jobCategories.slug,
      description: jobCategories.description,
      icon: jobCategories.icon,
      parentCategoryId: jobCategories.parentCategoryId,
      jobCount: sql<number>`count(${jobPostings.id})::int`
    })
    .from(jobCategories)
    .leftJoin(
      jobPostings,
      and(
        eq(jobCategories.id, jobPostings.categoryId),
        eq(jobPostings.status, 'open')
      )
    )
    .where(eq(jobCategories.isActive, true))
    .groupBy(jobCategories.id)
    .orderBy(jobCategories.sortOrder)

  return categories
}
