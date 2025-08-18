import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobPostings } from '@/lib/db/schema'
import { getUser } from '@/services/user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const jobId = parseInt(id)

    // Verify access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId),
      with: {
        client: true,
        freelancer: true,
        milestones: {
          orderBy: (milestones, { desc }) => [desc(milestones.createdAt)],
          limit: 10
        }
      }
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.clientId !== user.id && job.freelancerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Build activity feed from various sources
    const activities = []

    // Add job creation activity
    activities.push({
      id: `job-created-${job.id}`,
      type: 'job_created',
      title: 'Project created',
      description: job.title,
      user: job.client,
      createdAt: job.createdAt
    })

    // Add milestone activities
    job.milestones?.forEach(milestone => {
      if (milestone.createdAt) {
        activities.push({
          id: `milestone-created-${milestone.id}`,
          type: 'milestone_created',
          title: `Milestone created: ${milestone.title}`,
          description: milestone.description,
          user: job.client,
          metadata: { amount: milestone.amount },
          createdAt: milestone.createdAt
        })
      }

      if (milestone.submittedAt) {
        activities.push({
          id: `milestone-submitted-${milestone.id}`,
          type: 'milestone_submitted',
          title: `Milestone submitted: ${milestone.title}`,
          description: milestone.submissionNote,
          user: job.freelancer,
          metadata: { amount: milestone.amount },
          createdAt: milestone.submittedAt
        })
      }

      if (milestone.approvedAt) {
        activities.push({
          id: `milestone-approved-${milestone.id}`,
          type: 'milestone_approved',
          title: `Milestone approved: ${milestone.title}`,
          description: milestone.feedback,
          user: job.client,
          metadata: { amount: milestone.amount },
          createdAt: milestone.approvedAt
        })
      }
    })

    // Add freelancer assignment
    if (job.freelancer && job.startedAt) {
      activities.push({
        id: `freelancer-assigned-${job.id}`,
        type: 'member_joined',
        title: 'Freelancer joined the project',
        description: null,
        user: job.freelancer,
        createdAt: job.startedAt
      })
    }

    // Sort activities by date
    activities.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Limit to recent activities
    const recentActivities = activities.slice(0, 50)

    return NextResponse.json({ success: true, activities: recentActivities })
  } catch (error) {
    console.error('Failed to fetch activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
