import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import { jobMilestones, jobPostings } from '@/lib/db/schema'
import { getUser } from '@/services/user'

const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  amount: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  status: z
    .enum(['pending', 'in_progress', 'submitted', 'approved', 'disputed'])
    .optional(),
  submissionUrl: z.string().url().optional(),
  feedback: z.string().optional()
})

// GET /api/jobs/[id]/milestones/[milestoneId] - Get specific milestone
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { milestoneId } = await params
    const milestoneId = parseInt(milestoneId)

    if (isNaN(milestoneId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid milestone ID' },
        { status: 400 }
      )
    }

    const [milestone] = await db
      .select()
      .from(jobMilestones)
      .where(eq(jobMilestones.id, milestoneId))
      .limit(1)

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      milestone
    })
  } catch (error) {
    console.error('Error fetching milestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch milestone' },
      { status: 500 }
    )
  }
}

// PATCH /api/jobs/[id]/milestones/[milestoneId] - Update specific milestone
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
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
    const milestoneId = parseInt(milestoneId)

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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateMilestoneSchema.parse(body)

    // Check permissions based on what's being updated
    const isClient = milestone.job.clientId === user.id
    const isFreelancer = milestone.job.freelancerId === user.id

    // Status updates have different permission requirements
    if (validatedData.status) {
      const currentStatus = milestone.milestone.status
      const newStatus = validatedData.status

      // Validation for status transitions
      if (newStatus === 'in_progress' && currentStatus !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Can only start pending milestones' },
          { status: 400 }
        )
      }

      if (newStatus === 'submitted') {
        if (!isFreelancer) {
          return NextResponse.json(
            { success: false, error: 'Only freelancer can submit milestones' },
            { status: 403 }
          )
        }
        if (currentStatus !== 'in_progress') {
          return NextResponse.json(
            { success: false, error: 'Can only submit in-progress milestones' },
            { status: 400 }
          )
        }
      }

      if (newStatus === 'approved') {
        if (!isClient) {
          return NextResponse.json(
            { success: false, error: 'Only client can approve milestones' },
            { status: 403 }
          )
        }
        if (currentStatus !== 'submitted') {
          return NextResponse.json(
            { success: false, error: 'Can only approve submitted milestones' },
            { status: 400 }
          )
        }
      }

      if (newStatus === 'disputed') {
        if (!isClient && !isFreelancer) {
          return NextResponse.json(
            { success: false, error: 'Only parties can dispute milestones' },
            { status: 403 }
          )
        }
      }
    }

    // For other updates, only client can modify (unless it's submission-related)
    if (!validatedData.status && !validatedData.submissionUrl && !isClient) {
      return NextResponse.json(
        { success: false, error: 'Only client can update milestone details' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.description)
      updateData.description = validatedData.description
    if (validatedData.amount) updateData.amount = validatedData.amount
    if (validatedData.dueDate)
      updateData.dueDate = new Date(validatedData.dueDate)
    if (validatedData.status) {
      updateData.status = validatedData.status

      // Set status timestamps
      if (validatedData.status === 'submitted') {
        updateData.submittedAt = new Date()
      } else if (validatedData.status === 'approved') {
        updateData.approvedAt = new Date()
      }
    }
    if (validatedData.submissionUrl)
      updateData.submissionUrl = validatedData.submissionUrl
    if (validatedData.feedback !== undefined)
      updateData.feedback = validatedData.feedback

    // Update the milestone
    const [updatedMilestone] = await db
      .update(jobMilestones)
      .set(updateData)
      .where(eq(jobMilestones.id, milestoneId))
      .returning()

    return NextResponse.json({
      success: true,
      milestone: updatedMilestone
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating milestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update milestone' },
      { status: 500 }
    )
  }
}

// DELETE /api/jobs/[id]/milestones/[milestoneId] - Delete milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const jobId = parseInt(id)
    const milestoneId = parseInt(milestoneId)

    if (isNaN(jobId) || isNaN(milestoneId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      )
    }

    // Check if user is the client for this job
    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, jobId))
      .limit(1)

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.clientId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the client can delete milestones' },
        { status: 403 }
      )
    }

    // Check if milestone exists and belongs to this job
    const [milestone] = await db
      .select()
      .from(jobMilestones)
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

    // Can't delete milestones that are already in progress or completed
    if (milestone.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete milestone that is already in progress'
        },
        { status: 400 }
      )
    }

    // Delete the milestone
    await db.delete(jobMilestones).where(eq(jobMilestones.id, milestoneId))

    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting milestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete milestone' },
      { status: 500 }
    )
  }
}
