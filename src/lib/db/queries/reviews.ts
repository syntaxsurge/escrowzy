import 'server-only'

import { eq, and, or, gte, lte, desc, asc, sql, isNull, not } from 'drizzle-orm'

import type { ReviewFilter, ReviewStats } from '@/lib/schemas/reviews'

import { db } from '../drizzle'
import {
  freelancerReviews,
  clientReviews,
  jobPostings,
  users,
  FreelancerReview,
  ClientReview,
  NewFreelancerReview,
  NewClientReview
} from '../schema'

export async function createFreelancerReview(
  data: NewFreelancerReview
): Promise<FreelancerReview> {
  const [review] = await db.insert(freelancerReviews).values(data).returning()

  return review
}

export async function createClientReview(
  data: NewClientReview
): Promise<ClientReview> {
  const [review] = await db.insert(clientReviews).values(data).returning()

  return review
}

export async function getFreelancerReviews(
  freelancerId: number,
  filter?: ReviewFilter
): Promise<{
  reviews: Array<
    FreelancerReview & {
      reviewer: { name: string | null; walletAddress: string } | null
      job: { title: string } | null
    }
  >
  total: number
  stats: ReviewStats
}> {
  const conditions = [eq(freelancerReviews.freelancerId, freelancerId)]

  if (filter?.isPublic !== undefined) {
    conditions.push(eq(freelancerReviews.isPublic, filter.isPublic))
  }

  if (filter?.minRating) {
    conditions.push(gte(freelancerReviews.rating, filter.minRating))
  }

  if (filter?.hasResponse === true) {
    conditions.push(not(isNull(freelancerReviews.response)))
  } else if (filter?.hasResponse === false) {
    conditions.push(isNull(freelancerReviews.response))
  }

  const orderBy =
    filter?.sortBy === 'rating'
      ? filter.order === 'asc'
        ? asc(freelancerReviews.rating)
        : desc(freelancerReviews.rating)
      : filter?.order === 'asc'
        ? asc(freelancerReviews.createdAt)
        : desc(freelancerReviews.createdAt)

  const page = filter?.page || 1
  const limit = filter?.limit || 20
  const offset = (page - 1) * limit

  const [reviews, [countResult], [statsResult]] = await Promise.all([
    db
      .select({
        review: freelancerReviews,
        reviewer: {
          name: users.name,
          walletAddress: users.walletAddress
        },
        job: {
          title: jobPostings.title
        }
      })
      .from(freelancerReviews)
      .leftJoin(users, eq(users.id, freelancerReviews.reviewerId))
      .leftJoin(jobPostings, eq(jobPostings.id, freelancerReviews.jobId))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(freelancerReviews)
      .where(and(...conditions)),

    db
      .select({
        totalReviews: sql<number>`count(*)`,
        averageRating: sql<number>`avg(rating)`,
        fiveStars: sql<number>`sum(case when rating = 5 then 1 else 0 end)`,
        fourStars: sql<number>`sum(case when rating = 4 then 1 else 0 end)`,
        threeStars: sql<number>`sum(case when rating = 3 then 1 else 0 end)`,
        twoStars: sql<number>`sum(case when rating = 2 then 1 else 0 end)`,
        oneStar: sql<number>`sum(case when rating = 1 then 1 else 0 end)`,
        avgCommunication: sql<number>`avg(communication_rating)`,
        avgQuality: sql<number>`avg(quality_rating)`,
        avgDeadline: sql<number>`avg(deadline_rating)`,
        responseRate: sql<number>`(sum(case when response is not null then 1 else 0 end) * 100.0 / count(*))`
      })
      .from(freelancerReviews)
      .where(eq(freelancerReviews.freelancerId, freelancerId))
  ])

  const formattedReviews = reviews.map(r => ({
    ...r.review,
    reviewer: r.reviewer,
    job: r.job
  }))

  const stats: ReviewStats = {
    totalReviews: Number(statsResult?.totalReviews || 0),
    averageRating: Number(statsResult?.averageRating || 0),
    ratingBreakdown: {
      1: Number(statsResult?.oneStar || 0),
      2: Number(statsResult?.twoStars || 0),
      3: Number(statsResult?.threeStars || 0),
      4: Number(statsResult?.fourStars || 0),
      5: Number(statsResult?.fiveStars || 0)
    },
    detailedRatings: {
      communication: Number(statsResult?.avgCommunication || 0),
      quality: Number(statsResult?.avgQuality || 0),
      deadline: Number(statsResult?.avgDeadline || 0)
    },
    responseRate: Number(statsResult?.responseRate || 0)
  }

  return {
    reviews: formattedReviews,
    total: Number(countResult?.count || 0),
    stats
  }
}

export async function getClientReviews(
  clientId: number,
  filter?: ReviewFilter
): Promise<{
  reviews: Array<
    ClientReview & {
      reviewer: { name: string | null; walletAddress: string } | null
      job: { title: string } | null
    }
  >
  total: number
  stats: ReviewStats
}> {
  const conditions = [eq(clientReviews.clientId, clientId)]

  if (filter?.isPublic !== undefined) {
    conditions.push(eq(clientReviews.isPublic, filter.isPublic))
  }

  if (filter?.minRating) {
    conditions.push(gte(clientReviews.rating, filter.minRating))
  }

  if (filter?.hasResponse === true) {
    conditions.push(not(isNull(clientReviews.response)))
  } else if (filter?.hasResponse === false) {
    conditions.push(isNull(clientReviews.response))
  }

  const orderBy =
    filter?.sortBy === 'rating'
      ? filter.order === 'asc'
        ? asc(clientReviews.rating)
        : desc(clientReviews.rating)
      : filter?.order === 'asc'
        ? asc(clientReviews.createdAt)
        : desc(clientReviews.createdAt)

  const page = filter?.page || 1
  const limit = filter?.limit || 20
  const offset = (page - 1) * limit

  const [reviews, [countResult], [statsResult]] = await Promise.all([
    db
      .select({
        review: clientReviews,
        reviewer: {
          name: users.name,
          walletAddress: users.walletAddress
        },
        job: {
          title: jobPostings.title
        }
      })
      .from(clientReviews)
      .leftJoin(users, eq(users.id, clientReviews.reviewerId))
      .leftJoin(jobPostings, eq(jobPostings.id, clientReviews.jobId))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(clientReviews)
      .where(and(...conditions)),

    db
      .select({
        totalReviews: sql<number>`count(*)`,
        averageRating: sql<number>`avg(rating)`,
        fiveStars: sql<number>`sum(case when rating = 5 then 1 else 0 end)`,
        fourStars: sql<number>`sum(case when rating = 4 then 1 else 0 end)`,
        threeStars: sql<number>`sum(case when rating = 3 then 1 else 0 end)`,
        twoStars: sql<number>`sum(case when rating = 2 then 1 else 0 end)`,
        oneStar: sql<number>`sum(case when rating = 1 then 1 else 0 end)`,
        avgPayment: sql<number>`avg(payment_rating)`,
        avgCommunication: sql<number>`avg(communication_rating)`,
        avgClarity: sql<number>`avg(clarity_rating)`,
        responseRate: sql<number>`(sum(case when response is not null then 1 else 0 end) * 100.0 / count(*))`
      })
      .from(clientReviews)
      .where(eq(clientReviews.clientId, clientId))
  ])

  const formattedReviews = reviews.map(r => ({
    ...r.review,
    reviewer: r.reviewer,
    job: r.job
  }))

  const stats: ReviewStats = {
    totalReviews: Number(statsResult?.totalReviews || 0),
    averageRating: Number(statsResult?.averageRating || 0),
    ratingBreakdown: {
      1: Number(statsResult?.oneStar || 0),
      2: Number(statsResult?.twoStars || 0),
      3: Number(statsResult?.threeStars || 0),
      4: Number(statsResult?.fourStars || 0),
      5: Number(statsResult?.fiveStars || 0)
    },
    detailedRatings: {
      payment: Number(statsResult?.avgPayment || 0),
      communication: Number(statsResult?.avgCommunication || 0),
      clarity: Number(statsResult?.avgClarity || 0)
    },
    responseRate: Number(statsResult?.responseRate || 0)
  }

  return {
    reviews: formattedReviews,
    total: Number(countResult?.count || 0),
    stats
  }
}

export async function getJobReviews(jobId: number): Promise<{
  freelancerReview: FreelancerReview | null
  clientReview: ClientReview | null
}> {
  const [freelancerReview, clientReview] = await Promise.all([
    db
      .select()
      .from(freelancerReviews)
      .where(eq(freelancerReviews.jobId, jobId))
      .limit(1),
    db
      .select()
      .from(clientReviews)
      .where(eq(clientReviews.jobId, jobId))
      .limit(1)
  ])

  return {
    freelancerReview: freelancerReview[0] || null,
    clientReview: clientReview[0] || null
  }
}

export async function addReviewResponse(
  reviewId: number,
  response: string,
  type: 'freelancer' | 'client'
): Promise<void> {
  const table = type === 'freelancer' ? freelancerReviews : clientReviews

  await db
    .update(table)
    .set({
      response,
      respondedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(table.id, reviewId))
}

export async function checkReviewExists(
  jobId: number,
  reviewerId: number,
  type: 'freelancer' | 'client'
): Promise<boolean> {
  const table = type === 'freelancer' ? freelancerReviews : clientReviews
  const field =
    type === 'freelancer'
      ? freelancerReviews.reviewerId
      : clientReviews.reviewerId

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .where(and(eq(table.jobId, jobId), eq(field, reviewerId)))

  return Number(result?.count || 0) > 0
}

export async function getPendingReviewPrompts(userId: number): Promise<
  Array<{
    jobId: number
    jobTitle: string
    completedAt: Date
    type: 'freelancer' | 'client'
    targetUserId: number
    targetUserName: string | null
  }>
> {
  const [asClient, asFreelancer] = await Promise.all([
    db
      .select({
        jobId: jobPostings.id,
        jobTitle: jobPostings.title,
        completedAt: jobPostings.updatedAt,
        targetUserId: jobPostings.freelancerId,
        targetUserName: users.name
      })
      .from(jobPostings)
      .leftJoin(users, eq(users.id, jobPostings.freelancerId))
      .leftJoin(
        freelancerReviews,
        and(
          eq(freelancerReviews.jobId, jobPostings.id),
          eq(freelancerReviews.reviewerId, userId)
        )
      )
      .where(
        and(
          eq(jobPostings.clientId, userId),
          eq(jobPostings.status, 'completed'),
          isNull(freelancerReviews.id)
        )
      ),

    db
      .select({
        jobId: jobPostings.id,
        jobTitle: jobPostings.title,
        completedAt: jobPostings.updatedAt,
        targetUserId: jobPostings.clientId,
        targetUserName: users.name
      })
      .from(jobPostings)
      .leftJoin(users, eq(users.id, jobPostings.clientId))
      .leftJoin(
        clientReviews,
        and(
          eq(clientReviews.jobId, jobPostings.id),
          eq(clientReviews.reviewerId, userId)
        )
      )
      .where(
        and(
          eq(jobPostings.freelancerId, userId),
          eq(jobPostings.status, 'completed'),
          isNull(clientReviews.id)
        )
      )
  ])

  return [
    ...asClient.map(r => ({ ...r, type: 'freelancer' as const })),
    ...asFreelancer.map(r => ({ ...r, type: 'client' as const }))
  ].filter(r => r.targetUserId !== null) as Array<{
    jobId: number
    jobTitle: string
    completedAt: Date
    type: 'freelancer' | 'client'
    targetUserId: number
    targetUserName: string | null
  }>
}

export async function getReviewAnalytics(
  userId?: number,
  dateFrom?: Date,
  dateTo?: Date
): Promise<{
  totalReviews: number
  averageRating: number
  reviewTrend: Array<{ date: string; count: number; averageRating: number }>
  topReviewers: Array<{
    userId: number
    name: string | null
    reviewCount: number
  }>
}> {
  const conditions = []

  if (userId) {
    conditions.push(
      or(
        eq(freelancerReviews.freelancerId, userId),
        eq(freelancerReviews.reviewerId, userId)
      )
    )
  }

  if (dateFrom) {
    conditions.push(gte(freelancerReviews.createdAt, dateFrom))
  }

  if (dateTo) {
    conditions.push(lte(freelancerReviews.createdAt, dateTo))
  }

  const [totalStats, trendData, topReviewers] = await Promise.all([
    db
      .select({
        totalReviews: sql<number>`count(*)`,
        averageRating: sql<number>`avg(rating)`
      })
      .from(freelancerReviews)
      .where(conditions.length > 0 ? and(...conditions) : undefined),

    db
      .select({
        date: sql<string>`date_trunc('day', created_at)`,
        count: sql<number>`count(*)`,
        averageRating: sql<number>`avg(rating)`
      })
      .from(freelancerReviews)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(sql`date_trunc('day', created_at)`)
      .orderBy(asc(sql`date_trunc('day', created_at)`))
      .limit(30),

    db
      .select({
        userId: freelancerReviews.reviewerId,
        name: users.name,
        reviewCount: sql<number>`count(*)`
      })
      .from(freelancerReviews)
      .leftJoin(users, eq(users.id, freelancerReviews.reviewerId))
      .groupBy(freelancerReviews.reviewerId, users.name)
      .orderBy(desc(sql`count(*)`))
      .limit(10)
  ])

  return {
    totalReviews: Number(totalStats[0]?.totalReviews || 0),
    averageRating: Number(totalStats[0]?.averageRating || 0),
    reviewTrend: trendData.map(d => ({
      date: d.date,
      count: Number(d.count),
      averageRating: Number(d.averageRating)
    })),
    topReviewers: topReviewers.map(r => ({
      userId: r.userId,
      name: r.name,
      reviewCount: Number(r.reviewCount)
    }))
  }
}

export async function moderateReview(
  reviewId: number,
  type: 'freelancer' | 'client',
  action: 'hide' | 'delete'
): Promise<void> {
  const table = type === 'freelancer' ? freelancerReviews : clientReviews

  if (action === 'hide') {
    await db
      .update(table)
      .set({
        isPublic: false,
        updatedAt: new Date()
      })
      .where(eq(table.id, reviewId))
  } else if (action === 'delete') {
    await db.delete(table).where(eq(table.id, reviewId))
  }
}
