import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, inArray, sql } from 'drizzle-orm'

import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { jobBids, jobMilestones, jobPostings, users } from '@/lib/db/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await verifySession()
    if (!session || Number(id) !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const freelancerId = Number(id)

    // Get all accepted bids for this freelancer where job is completed or cancelled
    const acceptedBids = await db
      .select({
        id: jobBids.id,
        jobId: jobBids.jobId,
        bidAmount: jobBids.bidAmount,
        deliveryTimeDays: jobBids.deliveryDays,
        status: jobBids.status,
        createdAt: jobBids.createdAt,
        job: {
          id: jobPostings.id,
          title: jobPostings.title,
          description: jobPostings.description,
          budgetType: jobPostings.budgetType,
          budgetMin: jobPostings.budgetMin,
          budgetMax: jobPostings.budgetMax,
          status: jobPostings.status,
          createdAt: jobPostings.createdAt,
          completedAt: jobPostings.updatedAt
        },
        client: {
          id: users.id,
          name: users.name,
          avatar: users.avatarPath
        }
      })
      .from(jobBids)
      .leftJoin(jobPostings, eq(jobBids.jobId, jobPostings.id))
      .leftJoin(users, eq(jobPostings.clientId, users.id))
      .where(
        and(
          eq(jobBids.freelancerId, freelancerId),
          eq(jobBids.status, 'accepted'),
          inArray(jobPostings.status, ['completed', 'cancelled'])
        )
      )
      .orderBy(desc(jobPostings.updatedAt))

    // Get milestone stats for each archived job
    const jobIds = acceptedBids.map(bid => bid.jobId).filter(Boolean)

    const milestoneStats = await db
      .select({
        jobId: jobMilestones.jobId,
        totalMilestones: sql<number>`COUNT(${jobMilestones.id})`,
        completedMilestones: sql<number>`COUNT(CASE WHEN ${jobMilestones.status} = 'approved' THEN 1 END)`,
        totalAmount: sql<number>`SUM(${jobMilestones.amount})`,
        paidAmount: sql<number>`SUM(CASE WHEN ${jobMilestones.status} = 'approved' THEN ${jobMilestones.amount} ELSE 0 END)`
      })
      .from(jobMilestones)
      .where(inArray(jobMilestones.jobId, jobIds))
      .groupBy(jobMilestones.jobId)

    // Transform the data
    const archivedJobs = acceptedBids.map(bid => {
      const stats = milestoneStats.find(s => s.jobId === bid.jobId)

      return {
        id: bid.id,
        jobId: bid.jobId,
        title: bid.job?.title || 'Unknown Job',
        clientName: bid.client?.name || 'Unknown Client',
        clientAvatar: bid.client?.avatar,
        bidAmount: bid.bidAmount,
        deliveryTimeDays: bid.deliveryTimeDays,
        status: bid.job?.status || 'unknown',
        startDate: bid.createdAt,
        completedDate: bid.job?.completedAt,
        totalMilestones: stats?.totalMilestones || 0,
        completedMilestones: stats?.completedMilestones || 0,
        totalAmount: stats?.totalAmount || 0,
        paidAmount: stats?.paidAmount || 0,
        completionRate: stats?.totalMilestones
          ? Math.round(
              (stats.completedMilestones / stats.totalMilestones) * 100
            )
          : 0
      }
    })

    // Calculate summary stats
    const summary = {
      totalJobs: archivedJobs.length,
      completedJobs: archivedJobs.filter(j => j.status === 'completed').length,
      cancelledJobs: archivedJobs.filter(j => j.status === 'cancelled').length,
      totalEarnings: archivedJobs.reduce((sum, j) => sum + j.paidAmount, 0),
      averageCompletionRate: archivedJobs.length
        ? Math.round(
            archivedJobs.reduce((sum, j) => sum + j.completionRate, 0) /
              archivedJobs.length
          )
        : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        jobs: archivedJobs,
        summary
      }
    })
  } catch (error) {
    console.error('Error fetching archived jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch archived jobs' },
      { status: 500 }
    )
  }
}

// Archive a job (mark it as completed/cancelled)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await verifySession()
    if (!session || Number(id) !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { jobId, action } = await request.json()

    if (!jobId || !['complete', 'cancel'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    // Verify the freelancer has an accepted bid for this job
    const bid = await db
      .select()
      .from(jobBids)
      .where(
        and(
          eq(jobBids.jobId, jobId),
          eq(jobBids.freelancerId, Number(id)),
          eq(jobBids.status, 'accepted')
        )
      )
      .limit(1)

    if (!bid.length) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Update job status
    const newStatus = action === 'complete' ? 'completed' : 'cancelled'

    await db
      .update(jobPostings)
      .set({
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(jobPostings.id, jobId))

    return NextResponse.json({
      success: true,
      message: `Job ${action === 'complete' ? 'completed' : 'cancelled'} successfully`
    })
  } catch (error) {
    console.error('Error archiving job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to archive job' },
      { status: 500 }
    )
  }
}
