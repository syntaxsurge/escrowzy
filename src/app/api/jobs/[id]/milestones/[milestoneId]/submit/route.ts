import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import { jobMilestones, jobPostings } from '@/lib/db/schema'
import { pusherServer } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

const submitMilestoneSchema = z.object({
  submissionUrl: z.string().url(),
  submissionNotes: z.string().optional(),
  files: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        size: z.number(),
        type: z.string()
      })
    )
    .optional()
})

// POST /api/jobs/[id]/milestones/[milestoneId]/submit - Submit milestone for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId: milestoneIdParam } = await params
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const jobId = parseInt(id)
    const milestoneId = parseInt(milestoneIdParam)

    if (isNaN(jobId) || isNaN(milestoneId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      )
    }

    // Get the milestone and job
    const [milestone] = await db
      .select({
        milestone: jobMilestones,
        job: jobPostings
      })
      .from(jobMilestones)
      .innerJoin(jobPostings, eq(jobMilestones.jobId, jobPostings.id))
      .where(
        and(eq(jobMilestones.id, milestoneId), eq(jobMilestones.jobId, jobId))
      )
      .limit(1)

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Check if user is the freelancer for this job
    if (milestone.job.freelancerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only the assigned freelancer can submit milestones'
        },
        { status: 403 }
      )
    }

    // Check if milestone is in the correct status
    if (milestone.milestone.status !== 'in_progress') {
      return NextResponse.json(
        { success: false, error: 'Milestone must be in progress to submit' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = submitMilestoneSchema.parse(body)

    // Update the milestone
    const [updatedMilestone] = await db
      .update(jobMilestones)
      .set({
        status: 'submitted',
        submissionUrl: validatedData.submissionUrl,
        submissionNote: validatedData.submissionNotes,
        submittedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(jobMilestones.id, milestoneId))
      .returning()

    // Send real-time notification to client
    if (pusherServer) {
      await pusherServer.trigger(
        `user-${milestone.job.clientId}`,
        'milestone-submitted',
        {
          milestoneId,
          jobId,
          jobTitle: milestone.job.title,
          milestoneTitle: milestone.milestone.title,
          freelancerName: user.name || user.email,
          submittedAt: new Date().toISOString()
        }
      )
    }

    return NextResponse.json({
      success: true,
      milestone: updatedMilestone,
      message: 'Milestone submitted successfully for client review'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting milestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit milestone' },
      { status: 500 }
    )
  }
}
