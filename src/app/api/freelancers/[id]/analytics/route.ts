import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, gte, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import {
  freelancerProfiles,
  freelancerReviews,
  freelancerSkills,
  jobBids,
  jobMilestones,
  jobPostings,
  skills,
  users
} from '@/lib/db/schema'
import { getUser } from '@/services/user'

// GET /api/freelancers/[id]/analytics - Get comprehensive analytics data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const freelancerId = parseInt(id)

    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid freelancer ID' },
        { status: 400 }
      )
    }

    // Check if user is authorized
    const user = await getUser()
    if (!user || user.id !== freelancerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get time range from query params
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30' // days
    const daysAgo = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Get freelancer profile
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, freelancerId))
      .limit(1)

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Freelancer profile not found' },
        { status: 404 }
      )
    }

    // 1. Skill Performance Analytics
    const skillPerformance = await db
      .select({
        skillId: freelancerSkills.skillId,
        skillName: skills.name,
        skillCategory: sql<string>`(
          SELECT name FROM job_categories WHERE id = ${skills.categoryId}
        )`,
        yearsOfExperience: freelancerSkills.yearsOfExperience,
        skillLevel: freelancerSkills.skillLevel,
        isVerified: freelancerSkills.isVerified,
        endorsements: freelancerSkills.endorsements,
        projectsUsed: sql<number>`(
          SELECT COUNT(DISTINCT jp.id)
          FROM job_postings jp
          WHERE jp.freelancer_id = ${freelancerId}
            AND jp.skills_required::jsonb ? ${skills.name}
            AND jp.status = 'completed'
        )`,
        earnings: sql<number>`(
          SELECT COALESCE(SUM(CAST(e.net_amount AS DECIMAL)), 0)
          FROM earnings e
          INNER JOIN job_postings jp ON e.job_id = jp.id
          WHERE e.freelancer_id = ${freelancerId}
            AND jp.skills_required::jsonb ? ${skills.name}
        )`,
        avgRating: sql<number>`(
          SELECT COALESCE(AVG((fr.skills_rating::jsonb->${skills.name})::int), 0)
          FROM freelancer_reviews fr
          WHERE fr.freelancer_id = ${profile.id}
            AND fr.skills_rating::jsonb ? ${skills.name}
        )`
      })
      .from(freelancerSkills)
      .innerJoin(skills, eq(freelancerSkills.skillId, skills.id))
      .where(eq(freelancerSkills.freelancerId, profile.id))

    // 2. Client Analytics
    const clientAnalytics = await db
      .select({
        clientId: users.id,
        clientName: users.name,
        totalProjects: sql<number>`COUNT(DISTINCT ${jobPostings.id})`,
        completedProjects: sql<number>`COUNT(DISTINCT ${jobPostings.id}) FILTER (WHERE ${jobPostings.status} = 'completed')`,
        totalEarnings: sql<number>`(
          SELECT COALESCE(SUM(CAST(e.net_amount AS DECIMAL)), 0)
          FROM earnings e
          WHERE e.freelancer_id = ${freelancerId}
            AND e.job_id IN (
              SELECT id FROM job_postings 
              WHERE client_id = ${users.id} 
                AND freelancer_id = ${freelancerId}
            )
        )`,
        avgProjectValue: sql<number>`(
          SELECT COALESCE(AVG(CAST(e.net_amount AS DECIMAL)), 0)
          FROM earnings e
          WHERE e.freelancer_id = ${freelancerId}
            AND e.job_id IN (
              SELECT id FROM job_postings 
              WHERE client_id = ${users.id} 
                AND freelancer_id = ${freelancerId}
            )
        )`,
        avgRating: sql<number>`(
          SELECT COALESCE(AVG(fr.rating), 0)
          FROM freelancer_reviews fr
          INNER JOIN job_postings jp ON fr.job_id = jp.id
          WHERE fr.freelancer_id = ${profile.id}
            AND jp.client_id = ${users.id}
        )`,
        lastProjectDate: sql<Date>`MAX(${jobPostings.createdAt})`,
        repeatClient: sql<boolean>`COUNT(DISTINCT ${jobPostings.id}) > 1`
      })
      .from(jobPostings)
      .innerJoin(users, eq(jobPostings.clientId, users.id))
      .where(eq(jobPostings.freelancerId, freelancerId))
      .groupBy(users.id, users.name)
      .orderBy(desc(sql`COUNT(DISTINCT ${jobPostings.id})`))

    // 3. Proposal Conversion Funnel
    const proposalFunnel = await db
      .select({
        totalProposals: sql<number>`COUNT(*)`,
        viewedProposals: sql<number>`COUNT(*) FILTER (WHERE ${jobBids.status} != 'draft')`,
        shortlistedProposals: sql<number>`COUNT(*) FILTER (WHERE ${jobBids.status} = 'shortlisted')`,
        acceptedProposals: sql<number>`COUNT(*) FILTER (WHERE ${jobBids.status} = 'accepted')`,
        completedProjects: sql<number>`(
          SELECT COUNT(*)
          FROM job_postings jp
          WHERE jp.freelancer_id = ${freelancerId}
            AND jp.status = 'completed'
            AND jp.id IN (SELECT job_id FROM job_bids WHERE freelancer_id = ${freelancerId} AND status = 'accepted')
        )`
      })
      .from(jobBids)
      .where(
        and(
          eq(jobBids.freelancerId, freelancerId),
          gte(jobBids.createdAt, startDate)
        )
      )

    // 4. Performance Trends (Monthly)
    const performanceTrends = await db
      .select({
        month: sql<string>`TO_CHAR(${jobPostings.createdAt}, 'YYYY-MM')`,
        projectsStarted: sql<number>`COUNT(DISTINCT ${jobPostings.id})`,
        projectsCompleted: sql<number>`COUNT(DISTINCT ${jobPostings.id}) FILTER (WHERE ${jobPostings.status} = 'completed')`,
        earnings: sql<number>`(
          SELECT COALESCE(SUM(CAST(e.net_amount AS DECIMAL)), 0)
          FROM earnings e
          WHERE e.freelancer_id = ${freelancerId}
            AND TO_CHAR(e.created_at, 'YYYY-MM') = TO_CHAR(${jobPostings.createdAt}, 'YYYY-MM')
        )`,
        avgRating: sql<number>`(
          SELECT COALESCE(AVG(fr.rating), 0)
          FROM freelancer_reviews fr
          WHERE fr.freelancer_id = ${profile.id}
            AND TO_CHAR(fr.created_at, 'YYYY-MM') = TO_CHAR(${jobPostings.createdAt}, 'YYYY-MM')
        )`,
        proposalsSubmitted: sql<number>`(
          SELECT COUNT(*)
          FROM job_bids jb
          WHERE jb.freelancer_id = ${freelancerId}
            AND TO_CHAR(jb.created_at, 'YYYY-MM') = TO_CHAR(${jobPostings.createdAt}, 'YYYY-MM')
        )`
      })
      .from(jobPostings)
      .where(
        and(
          eq(jobPostings.freelancerId, freelancerId),
          gte(jobPostings.createdAt, startDate)
        )
      )
      .groupBy(sql`TO_CHAR(${jobPostings.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${jobPostings.createdAt}, 'YYYY-MM')`)

    // 5. Milestone Performance
    const milestonePerformance = await db
      .select({
        totalMilestones: sql<number>`COUNT(*)`,
        completedOnTime: sql<number>`COUNT(*) FILTER (
          WHERE ${jobMilestones.status} = 'approved' 
            AND ${jobMilestones.approvedAt} <= ${jobMilestones.dueDate}
        )`,
        completedLate: sql<number>`COUNT(*) FILTER (
          WHERE ${jobMilestones.status} = 'approved' 
            AND ${jobMilestones.approvedAt} > ${jobMilestones.dueDate}
        )`,
        pending: sql<number>`COUNT(*) FILTER (WHERE ${jobMilestones.status} = 'pending')`,
        inProgress: sql<number>`COUNT(*) FILTER (WHERE ${jobMilestones.status} = 'in_progress')`,
        submitted: sql<number>`COUNT(*) FILTER (WHERE ${jobMilestones.status} = 'submitted')`,
        disputed: sql<number>`COUNT(*) FILTER (WHERE ${jobMilestones.status} = 'disputed')`,
        avgCompletionTime: sql<number>`
          AVG(
            EXTRACT(EPOCH FROM (${jobMilestones.approvedAt} - ${jobMilestones.createdAt})) / 86400
          ) FILTER (WHERE ${jobMilestones.status} = 'approved')
        `
      })
      .from(jobMilestones)
      .innerJoin(jobPostings, eq(jobMilestones.jobId, jobPostings.id))
      .where(eq(jobPostings.freelancerId, freelancerId))

    // 6. Category Performance
    const categoryPerformance = await db
      .select({
        categoryId: sql<number>`jc.id`,
        categoryName: sql<string>`jc.name`,
        projectCount: sql<number>`COUNT(DISTINCT ${jobPostings.id})`,
        completedCount: sql<number>`COUNT(DISTINCT ${jobPostings.id}) FILTER (WHERE ${jobPostings.status} = 'completed')`,
        totalEarnings: sql<number>`(
          SELECT COALESCE(SUM(CAST(e.net_amount AS DECIMAL)), 0)
          FROM earnings e
          WHERE e.freelancer_id = ${freelancerId}
            AND e.job_id IN (
              SELECT id FROM job_postings 
              WHERE category_id = jc.id 
                AND freelancer_id = ${freelancerId}
            )
        )`,
        avgRating: sql<number>`(
          SELECT COALESCE(AVG(fr.rating), 0)
          FROM freelancer_reviews fr
          INNER JOIN job_postings jp ON fr.job_id = jp.id
          WHERE fr.freelancer_id = ${profile.id}
            AND jp.category_id = jc.id
        )`
      })
      .from(jobPostings)
      .innerJoin(sql`job_categories jc`, sql`${jobPostings.categoryId} = jc.id`)
      .where(eq(jobPostings.freelancerId, freelancerId))
      .groupBy(sql`jc.id`, sql`jc.name`)
      .orderBy(desc(sql`COUNT(DISTINCT ${jobPostings.id})`))

    // 7. Response Time Analysis
    const responseTimeAnalysis = await db
      .select({
        avgResponseTime: sql<number>`
          AVG(
            EXTRACT(EPOCH FROM (jb.created_at - jp.created_at)) / 3600
          )
        `,
        fastResponses: sql<number>`
          COUNT(*) FILTER (
            WHERE EXTRACT(EPOCH FROM (jb.created_at - jp.created_at)) < 86400
          )
        `,
        mediumResponses: sql<number>`
          COUNT(*) FILTER (
            WHERE EXTRACT(EPOCH FROM (jb.created_at - jp.created_at)) BETWEEN 86400 AND 259200
          )
        `,
        slowResponses: sql<number>`
          COUNT(*) FILTER (
            WHERE EXTRACT(EPOCH FROM (jb.created_at - jp.created_at)) > 259200
          )
        `
      })
      .from(sql`job_bids jb`)
      .innerJoin(sql`job_postings jp`, sql`jb.job_id = jp.id`)
      .where(sql`jb.freelancer_id = ${freelancerId}`)

    // 8. Competition Analysis
    const [competitionAnalysis] = await db
      .select({
        avgBidAmount: sql<number>`AVG(CAST(${jobBids.bidAmount} AS DECIMAL))`,
        avgWinningBid: sql<number>`
          AVG(CAST(${jobBids.bidAmount} AS DECIMAL)) 
          FILTER (WHERE ${jobBids.status} = 'accepted')
        `,
        positionInBids: sql<number>`
          AVG(
            (SELECT COUNT(*) + 1
             FROM job_bids jb2
             WHERE jb2.job_id = ${jobBids.jobId}
               AND CAST(jb2.bid_amount AS DECIMAL) < CAST(${jobBids.bidAmount} AS DECIMAL))
          )
        `,
        totalCompetitors: sql<number>`
          AVG(
            (SELECT COUNT(DISTINCT freelancer_id)
             FROM job_bids jb2
             WHERE jb2.job_id = ${jobBids.jobId})
          )
        `
      })
      .from(jobBids)
      .where(eq(jobBids.freelancerId, freelancerId))

    // 9. Review Analysis
    const reviewAnalysis = await db
      .select({
        totalReviews: sql<number>`COUNT(*)`,
        avgRating: sql<number>`COALESCE(AVG(${freelancerReviews.rating}), 0)`,
        avgCommunication: sql<number>`COALESCE(AVG(${freelancerReviews.communicationRating}), 0)`,
        avgQuality: sql<number>`COALESCE(AVG(${freelancerReviews.qualityRating}), 0)`,
        avgDeadline: sql<number>`COALESCE(AVG(${freelancerReviews.deadlineRating}), 0)`,
        wouldHireAgainRate: sql<number>`
          (COUNT(*) FILTER (WHERE ${freelancerReviews.wouldHireAgain} = true) * 100.0 / NULLIF(COUNT(*), 0))
        `,
        fiveStarReviews: sql<number>`COUNT(*) FILTER (WHERE ${freelancerReviews.rating} = 5)`,
        fourStarReviews: sql<number>`COUNT(*) FILTER (WHERE ${freelancerReviews.rating} = 4)`,
        threeStarReviews: sql<number>`COUNT(*) FILTER (WHERE ${freelancerReviews.rating} = 3)`,
        twoStarReviews: sql<number>`COUNT(*) FILTER (WHERE ${freelancerReviews.rating} = 2)`,
        oneStarReviews: sql<number>`COUNT(*) FILTER (WHERE ${freelancerReviews.rating} = 1)`
      })
      .from(freelancerReviews)
      .where(eq(freelancerReviews.freelancerId, profile.id))

    return NextResponse.json({
      success: true,
      data: {
        skillPerformance,
        clientAnalytics,
        proposalFunnel: proposalFunnel[0] || {},
        performanceTrends,
        milestonePerformance: milestonePerformance[0] || {},
        categoryPerformance,
        responseTimeAnalysis: responseTimeAnalysis[0] || {},
        competitionAnalysis,
        reviewAnalysis: reviewAnalysis[0] || {},
        period: {
          days: daysAgo,
          startDate,
          endDate: new Date()
        }
      }
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
