import 'server-only'

import { and, desc, eq, sql, inArray } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  jobBids,
  jobPostings,
  users,
  freelancerProfiles,
  type JobBid,
  type NewJobBid
} from '../schema'

// Types
export interface BidWithRelations extends JobBid {
  freelancer: {
    id: number
    name: string | null
    email: string | null
    walletAddress: string
    avatarUrl: string | null
  }
  freelancerProfile: {
    professionalTitle: string | null
    hourlyRate: string | null
    yearsOfExperience: number | null
    rating: number | null
    completedJobs: number
    verificationStatus: string | null
  } | null
  job?: {
    id: number
    title: string
    clientId: number
    status: string
  }
}

export interface BidFilters {
  jobId?: number
  freelancerId?: number
  status?: string
  minAmount?: number
  maxAmount?: number
  sortBy?: 'newest' | 'oldest' | 'amount_low' | 'amount_high' | 'delivery_fast'
  limit?: number
  offset?: number
}

// Get bids for a specific job
export async function getBidsByJobId(
  jobId: number,
  userId?: number
): Promise<BidWithRelations[]> {
  // Get job to check ownership
  const [job] = await db
    .select()
    .from(jobPostings)
    .where(eq(jobPostings.id, jobId))
    .limit(1)

  if (!job) {
    return []
  }

  // Build query conditions based on user role
  let queryConditions

  // If user is not the job owner, only show their own bids
  if (userId && userId !== job.clientId) {
    queryConditions = and(
      eq(jobBids.jobId, jobId),
      eq(jobBids.freelancerId, userId)
    )
  } else if (!userId || userId !== job.clientId) {
    // If not logged in or not the owner, return empty
    return []
  } else {
    // Job owner can see all bids
    queryConditions = eq(jobBids.jobId, jobId)
  }

  const bidsWithFreelancers = await db
    .select({
      bid: jobBids,
      freelancer: {
        id: users.id,
        name: users.name,
        email: users.email,
        walletAddress: users.walletAddress,
        avatarUrl: users.avatarPath
      },
      freelancerProfile: {
        professionalTitle: freelancerProfiles.professionalTitle,
        hourlyRate: freelancerProfiles.hourlyRate,
        yearsOfExperience: freelancerProfiles.yearsOfExperience,
        rating: sql<number>`${freelancerProfiles.avgRating} / 10.0`,
        completedJobs: freelancerProfiles.totalJobs,
        verificationStatus: freelancerProfiles.verificationStatus
      }
    })
    .from(jobBids)
    .leftJoin(users, eq(jobBids.freelancerId, users.id))
    .leftJoin(
      freelancerProfiles,
      eq(jobBids.freelancerId, freelancerProfiles.userId)
    )
    .where(queryConditions)
    .orderBy(desc(jobBids.createdAt))

  return bidsWithFreelancers.map(({ bid, freelancer, freelancerProfile }) => ({
    ...bid,
    freelancer: freelancer!,
    freelancerProfile
  }))
}

// Get bids by freelancer
export async function getBidsByFreelancerId(
  freelancerId: number,
  filters?: BidFilters
): Promise<{ bids: BidWithRelations[]; total: number }> {
  const conditions = [eq(jobBids.freelancerId, freelancerId)]

  if (filters?.status) {
    conditions.push(eq(jobBids.status, filters.status))
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobBids)
    .where(and(...conditions))

  // Build order by
  let orderBy: any = desc(jobBids.createdAt)
  if (filters?.sortBy === 'oldest') {
    orderBy = sql`${jobBids.createdAt}`
  } else if (filters?.sortBy === 'amount_low') {
    orderBy = sql`CAST(${jobBids.bidAmount} AS DECIMAL)`
  } else if (filters?.sortBy === 'amount_high') {
    orderBy = desc(sql`CAST(${jobBids.bidAmount} AS DECIMAL)`)
  } else if (filters?.sortBy === 'delivery_fast') {
    orderBy = sql`${jobBids.deliveryDays}`
  }

  // Get bids with job information
  const bidsWithJobs = await db
    .select({
      bid: jobBids,
      job: {
        id: jobPostings.id,
        title: jobPostings.title,
        clientId: jobPostings.clientId,
        status: jobPostings.status
      },
      freelancer: {
        id: users.id,
        name: users.name,
        email: users.email,
        walletAddress: users.walletAddress,
        avatarUrl: users.avatarPath
      },
      freelancerProfile: {
        professionalTitle: freelancerProfiles.professionalTitle,
        hourlyRate: freelancerProfiles.hourlyRate,
        yearsOfExperience: freelancerProfiles.yearsOfExperience,
        rating: sql<number>`${freelancerProfiles.avgRating} / 10.0`,
        completedJobs: freelancerProfiles.totalJobs,
        verificationStatus: freelancerProfiles.verificationStatus
      }
    })
    .from(jobBids)
    .leftJoin(jobPostings, eq(jobBids.jobId, jobPostings.id))
    .leftJoin(users, eq(jobBids.freelancerId, users.id))
    .leftJoin(
      freelancerProfiles,
      eq(jobBids.freelancerId, freelancerProfiles.userId)
    )
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(filters?.limit || 20)
    .offset(filters?.offset || 0)

  const bids = bidsWithJobs.map(
    ({ bid, job, freelancer, freelancerProfile }) => ({
      ...bid,
      job: job || undefined,
      freelancer: freelancer!,
      freelancerProfile
    })
  )

  return {
    bids,
    total: Number(count)
  }
}

// Get shortlisted bids for a job
export async function getShortlistedBids(
  jobId: number
): Promise<BidWithRelations[]> {
  const bidsWithFreelancers = await db
    .select({
      bid: jobBids,
      freelancer: {
        id: users.id,
        name: users.name,
        email: users.email,
        walletAddress: users.walletAddress,
        avatarUrl: users.avatarPath
      },
      freelancerProfile: {
        professionalTitle: freelancerProfiles.professionalTitle,
        hourlyRate: freelancerProfiles.hourlyRate,
        yearsOfExperience: freelancerProfiles.yearsOfExperience,
        rating: sql<number>`${freelancerProfiles.avgRating} / 10.0`,
        completedJobs: freelancerProfiles.totalJobs,
        verificationStatus: freelancerProfiles.verificationStatus
      }
    })
    .from(jobBids)
    .leftJoin(users, eq(jobBids.freelancerId, users.id))
    .leftJoin(
      freelancerProfiles,
      eq(jobBids.freelancerId, freelancerProfiles.userId)
    )
    .where(and(eq(jobBids.jobId, jobId), eq(jobBids.status, 'shortlisted')))
    .orderBy(desc(jobBids.createdAt))

  return bidsWithFreelancers.map(({ bid, freelancer, freelancerProfile }) => ({
    ...bid,
    freelancer: freelancer!,
    freelancerProfile
  }))
}

// Create a new bid
export async function createBid(bidData: NewJobBid): Promise<JobBid> {
  const [newBid] = await db.insert(jobBids).values(bidData).returning()

  // Update job bid count and average
  await db
    .update(jobPostings)
    .set({
      bidCount: sql`${jobPostings.bidCount} + 1`,
      avgBidAmount: sql`
        CASE 
          WHEN ${jobPostings.avgBidAmount} IS NULL THEN ${newBid.bidAmount}
          ELSE ((CAST(${jobPostings.avgBidAmount} AS DECIMAL) * ${jobPostings.bidCount} + CAST(${newBid.bidAmount} AS DECIMAL)) / (${jobPostings.bidCount} + 1))::VARCHAR
        END
      `,
      updatedAt: new Date()
    })
    .where(eq(jobPostings.id, bidData.jobId))

  return newBid
}

// Update bid status
export async function updateBidStatus(
  bidId: number,
  status: string,
  additionalData?: Partial<JobBid>
): Promise<JobBid> {
  const updateData: any = {
    status,
    updatedAt: new Date(),
    ...additionalData
  }

  // Add timestamp based on status
  if (status === 'shortlisted') {
    updateData.shortlistedAt = new Date()
  } else if (status === 'accepted') {
    updateData.acceptedAt = new Date()
  } else if (status === 'rejected') {
    updateData.rejectedAt = new Date()
  }

  const [updatedBid] = await db
    .update(jobBids)
    .set(updateData)
    .where(eq(jobBids.id, bidId))
    .returning()

  return updatedBid
}

// Check if user has bid on a job
export async function hasUserBidOnJob(
  userId: number,
  jobId: number
): Promise<boolean> {
  const [bid] = await db
    .select({ id: jobBids.id })
    .from(jobBids)
    .where(and(eq(jobBids.freelancerId, userId), eq(jobBids.jobId, jobId)))
    .limit(1)

  return !!bid
}

// Get bid statistics for a job
export async function getJobBidStatistics(jobId: number): Promise<{
  totalBids: number
  avgBidAmount: number
  minBidAmount: number
  maxBidAmount: number
  shortlistedCount: number
}> {
  const [stats] = await db
    .select({
      totalBids: sql<number>`count(*)`,
      avgBidAmount: sql<number>`avg(CAST(${jobBids.bidAmount} AS DECIMAL))`,
      minBidAmount: sql<number>`min(CAST(${jobBids.bidAmount} AS DECIMAL))`,
      maxBidAmount: sql<number>`max(CAST(${jobBids.bidAmount} AS DECIMAL))`,
      shortlistedCount: sql<number>`count(*) FILTER (WHERE ${jobBids.status} = 'shortlisted')`
    })
    .from(jobBids)
    .where(eq(jobBids.jobId, jobId))

  return {
    totalBids: Number(stats.totalBids) || 0,
    avgBidAmount: Number(stats.avgBidAmount) || 0,
    minBidAmount: Number(stats.minBidAmount) || 0,
    maxBidAmount: Number(stats.maxBidAmount) || 0,
    shortlistedCount: Number(stats.shortlistedCount) || 0
  }
}

// Get active bids count for a freelancer
export async function getActiveBidsCount(
  freelancerId: number
): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobBids)
    .where(
      and(
        eq(jobBids.freelancerId, freelancerId),
        inArray(jobBids.status, ['pending', 'shortlisted'])
      )
    )

  return Number(count) || 0
}

// Get won bids count for a freelancer
export async function getWonBidsCount(freelancerId: number): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobBids)
    .where(
      and(
        eq(jobBids.freelancerId, freelancerId),
        eq(jobBids.status, 'accepted')
      )
    )

  return Number(count) || 0
}

// Bulk update bid statuses (e.g., reject all other bids when one is accepted)
export async function bulkUpdateBidStatuses(
  jobId: number,
  excludeBidId: number,
  status: string
): Promise<void> {
  await db
    .update(jobBids)
    .set({
      status,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(jobBids.jobId, jobId),
        sql`${jobBids.id} != ${excludeBidId}`,
        eq(jobBids.status, 'pending')
      )
    )
}
