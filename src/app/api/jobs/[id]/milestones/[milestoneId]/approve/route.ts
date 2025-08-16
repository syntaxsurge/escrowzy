import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import { earnings, jobMilestones, jobPostings } from '@/lib/db/schema'
import { pusherServer } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

const approveMilestoneSchema = z.object({
  feedback: z.string().optional(),
  tip: z.string().optional(),
  rating: z.number().min(1).max(5).optional()
})

// POST /api/jobs/[id]/milestones/[milestoneId]/approve - Approve milestone and release payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const jobId = parseInt(params.id)
    const milestoneId = parseInt(params.milestoneId)

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

    // Check if user is the client for this job
    if (milestone.job.clientId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the client can approve milestones' },
        { status: 403 }
      )
    }

    // Check if milestone is in the correct status
    if (milestone.milestone.status !== 'submitted') {
      return NextResponse.json(
        { success: false, error: 'Milestone must be submitted to approve' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = approveMilestoneSchema.parse(body)

    // Start transaction
    await db.transaction(async tx => {
      // Update the milestone
      await tx
        .update(jobMilestones)
        .set({
          status: 'approved',
          feedback: validatedData.feedback,
          approvedAt: new Date(),
          rating: validatedData.rating,
          updatedAt: new Date()
        })
        .where(eq(jobMilestones.id, milestoneId))

      // Create earnings record for freelancer
      const totalAmount = parseFloat(milestone.milestone.amount)
      const tipAmount = validatedData.tip ? parseFloat(validatedData.tip) : 0
      const finalAmount = totalAmount + tipAmount

      if (milestone.job.freelancerId) {
        await tx.insert(earnings).values({
          freelancerId: milestone.job.freelancerId,
          jobId,
          milestoneId,
          amount: finalAmount.toString(),
          type: 'milestone',
          status: 'completed',
          description: `Payment for milestone: ${milestone.milestone.title}`,
          tip: tipAmount > 0 ? tipAmount.toString() : null
        })
      }

      // TODO: Trigger smart contract payment release
      // This would integrate with EscrowCore.sol to release funds
    })

    // Send real-time notification to freelancer
    if (pusherServer && milestone.job.freelancerId) {
      await pusherServer.trigger(
        `user-${milestone.job.freelancerId}`,
        'milestone-approved',
        {
          milestoneId,
          jobId,
          jobTitle: milestone.job.title,
          milestoneTitle: milestone.milestone.title,
          clientName: user.name || user.email,
          amount: milestone.milestone.amount,
          tip: validatedData.tip,
          approvedAt: new Date().toISOString()
        }
      )
    }

    // Check if all milestones are completed
    const allMilestones = await db
      .select()
      .from(jobMilestones)
      .where(eq(jobMilestones.jobId, jobId))

    const allCompleted = allMilestones.every(m => m.status === 'approved')

    if (allCompleted) {
      // Update job status to completed
      await db
        .update(jobPostings)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(jobPostings.id, jobId))
    }

    return NextResponse.json({
      success: true,
      message: 'Milestone approved and payment released',
      allMilestonesCompleted: allCompleted
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error approving milestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to approve milestone' },
      { status: 500 }
    )
  }
}
