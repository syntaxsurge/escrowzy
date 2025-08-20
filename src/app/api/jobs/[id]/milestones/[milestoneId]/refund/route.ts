import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import {
  earnings,
  jobMilestones,
  jobPostings,
  milestoneChats,
  users
} from '@/lib/db/schema'
import { sendEmail } from '@/lib/email/utils'
import { pusherServer } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

const refundRequestSchema = z.object({
  reason: z.string().min(10).max(1000),
  refundAmount: z.string().optional(), // Full or partial refund
  evidence: z
    .array(
      z.object({
        type: z.string(),
        url: z.string().url(),
        description: z.string()
      })
    )
    .optional()
})

// POST /api/jobs/[id]/milestones/[milestoneId]/refund - Request refund
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId: milestoneIdParam } = await params
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = parseInt(id)
    const milestoneId = parseInt(milestoneIdParam)

    if (isNaN(jobId) || isNaN(milestoneId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
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
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Only client can request refund
    if (milestone.job.clientId !== user.id) {
      return NextResponse.json(
        { error: 'Only the client can request a refund' },
        { status: 403 }
      )
    }

    // Check milestone status - can only refund submitted or approved milestones
    if (!['submitted', 'approved'].includes(milestone.milestone.status)) {
      return NextResponse.json(
        {
          error: 'Can only request refund for submitted or approved milestones'
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = refundRequestSchema.parse(body)

    const refundAmount =
      validatedData.refundAmount || milestone.milestone.amount

    // Update milestone status to disputed
    await db
      .update(jobMilestones)
      .set({
        status: 'disputed',
        disputedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...((milestone.milestone.metadata as any) || {}),
          refundRequest: {
            requestedBy: user.id,
            requestedAt: new Date().toISOString(),
            reason: validatedData.reason,
            amount: refundAmount,
            evidence: validatedData.evidence
          }
        }
      })
      .where(eq(jobMilestones.id, milestoneId))

    // Add system message to milestone chat
    await db.insert(milestoneChats).values({
      milestoneId,
      senderId: 0, // System message
      message: `🔴 Refund requested by client\n\nReason: ${validatedData.reason}\nAmount: $${refundAmount}`,
      messageType: 'dispute',
      attachments: validatedData.evidence || []
    })

    // If milestone was already approved and paid, reverse the payment
    if (
      milestone.milestone.status === 'approved' &&
      milestone.milestone.paidAt
    ) {
      // Find and update the earnings record
      await db
        .update(earnings)
        .set({
          status: 'disputed',
          metadata: {
            disputedAt: new Date().toISOString(),
            disputeReason: validatedData.reason
          }
        })
        .where(
          and(
            eq(earnings.milestoneId, milestoneId),
            eq(earnings.status, 'completed')
          )
        )
    }

    // Send notifications
    if (milestone.job.freelancerId) {
      // Get freelancer details
      const [freelancer] = await db
        .select()
        .from(users)
        .where(eq(users.id, milestone.job.freelancerId))
        .limit(1)

      // Send email notification
      if (freelancer?.email) {
        await sendEmail(
          freelancer.email,
          `Refund Requested - ${milestone.job.title}`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Refund Request</h2>
              <p>Hi ${freelancer.name || 'there'},</p>
              <p>The client has requested a refund for the milestone "${milestone.milestone.title}" on job "${milestone.job.title}".</p>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>Details:</h3>
                <p><strong>Reason:</strong> ${validatedData.reason}</p>
                <p><strong>Amount:</strong> $${refundAmount}</p>
              </div>
              
              <p>Please respond to this dispute through the platform. You have 72 hours to provide your response.</p>
              
              <p style="margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/trades/jobs/${jobId}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Dispute
                </a>
              </p>
            </div>
          `
        )
      }

      // Send real-time notification
      if (pusherServer) {
        await pusherServer.trigger(
          `user-${milestone.job.freelancerId}`,
          'milestone-disputed',
          {
            milestoneId,
            jobId,
            jobTitle: milestone.job.title,
            milestoneTitle: milestone.milestone.title,
            reason: validatedData.reason,
            amount: refundAmount,
            clientName: user.name || user.email
          }
        )
      }
    }

    return NextResponse.json({
      message: 'Refund request submitted successfully',
      dispute: {
        milestoneId,
        status: 'disputed',
        reason: validatedData.reason,
        amount: refundAmount,
        createdAt: new Date()
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error requesting refund:', error)
    return NextResponse.json(
      { error: 'Failed to request refund' },
      { status: 500 }
    )
  }
}

// PUT /api/jobs/[id]/milestones/[milestoneId]/refund - Process refund (admin/resolution)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId: milestoneIdParam } = await params
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = parseInt(id)
    const milestoneId = parseInt(milestoneIdParam)

    if (isNaN(jobId) || isNaN(milestoneId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()
    const { action, amount, note } = body

    if (!['approve', 'reject', 'partial'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get the milestone
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
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Check if milestone is disputed
    if (milestone.milestone.status !== 'disputed') {
      return NextResponse.json(
        { error: 'Milestone is not in dispute' },
        { status: 400 }
      )
    }

    // Only allow resolution by involved parties or admin
    const isClient = milestone.job.clientId === user.id
    const isFreelancer = milestone.job.freelancerId === user.id
    const isAdmin = user.role === 'admin'

    if (!isClient && !isFreelancer && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to resolve this dispute' },
        { status: 403 }
      )
    }

    let newStatus = milestone.milestone.status
    let refundAmount = '0'

    if (action === 'approve') {
      // Full refund approved
      newStatus = 'refunded'
      refundAmount = milestone.milestone.amount

      // Update earnings if exists
      await db
        .update(earnings)
        .set({
          status: 'refunded',
          metadata: {
            refundedAt: new Date().toISOString(),
            refundedBy: user.id,
            refundNote: note
          }
        })
        .where(eq(earnings.milestoneId, milestoneId))
    } else if (action === 'partial') {
      // Partial refund
      if (!amount) {
        return NextResponse.json(
          { error: 'Amount required for partial refund' },
          { status: 400 }
        )
      }
      newStatus = 'partially_refunded'
      refundAmount = amount

      // Update earnings with partial refund
      await db
        .update(earnings)
        .set({
          amount: (
            parseFloat(milestone.milestone.amount) - parseFloat(amount)
          ).toString(),
          metadata: {
            partialRefund: {
              amount,
              refundedAt: new Date().toISOString(),
              refundedBy: user.id,
              note
            }
          }
        })
        .where(eq(earnings.milestoneId, milestoneId))
    } else if (action === 'reject') {
      // Refund rejected, milestone returns to previous state
      newStatus = milestone.milestone.paidAt ? 'approved' : 'submitted'

      // Update earnings back to completed if exists
      await db
        .update(earnings)
        .set({
          status: 'completed',
          metadata: {
            disputeResolved: new Date().toISOString(),
            resolvedBy: user.id,
            resolution: 'rejected',
            note
          }
        })
        .where(eq(earnings.milestoneId, milestoneId))
    }

    // Update milestone
    await db
      .update(jobMilestones)
      .set({
        status: newStatus,
        refundedAt: ['refunded', 'partially_refunded'].includes(newStatus)
          ? new Date()
          : null,
        updatedAt: new Date(),
        metadata: {
          ...((milestone.milestone.metadata as any) || {}),
          refundResolution: {
            action,
            amount: refundAmount,
            resolvedBy: user.id,
            resolvedAt: new Date().toISOString(),
            note
          }
        }
      })
      .where(eq(jobMilestones.id, milestoneId))

    // Add system message to chat
    const resolutionMessage =
      action === 'approve'
        ? `✅ Refund approved: $${refundAmount}`
        : action === 'partial'
          ? `⚠️ Partial refund approved: $${refundAmount}`
          : '❌ Refund request rejected'

    await db.insert(milestoneChats).values({
      milestoneId,
      senderId: 0,
      message: `${resolutionMessage}\n\n${note ? `Note: ${note}` : ''}`,
      messageType: 'resolution',
      attachments: []
    })

    // Send notifications to both parties
    const notificationTargets = [
      milestone.job.clientId,
      milestone.job.freelancerId
    ].filter(id => id && id !== user.id)

    for (const targetId of notificationTargets) {
      if (pusherServer) {
        await pusherServer.trigger(`user-${targetId}`, 'dispute-resolved', {
          milestoneId,
          jobId,
          jobTitle: milestone.job.title,
          milestoneTitle: milestone.milestone.title,
          resolution: action,
          amount: refundAmount,
          note
        })
      }
    }

    return NextResponse.json({
      message: 'Dispute resolved successfully',
      resolution: {
        action,
        amount: refundAmount,
        status: newStatus
      }
    })
  } catch (error) {
    console.error('Error processing refund:', error)
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}

// GET /api/jobs/[id]/milestones/[milestoneId]/refund - Get refund status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId: milestoneIdParam } = await params
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = parseInt(id)
    const milestoneId = parseInt(milestoneIdParam)

    if (isNaN(jobId) || isNaN(milestoneId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Get the milestone with refund information
    const [milestone] = await db
      .select()
      .from(jobMilestones)
      .innerJoin(jobPostings, eq(jobMilestones.jobId, jobPostings.id))
      .where(
        and(eq(jobMilestones.id, milestoneId), eq(jobMilestones.jobId, jobId))
      )
      .limit(1)

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Check authorization
    const isClient = milestone.job_postings.clientId === user.id
    const isFreelancer = milestone.job_postings.freelancerId === user.id

    if (!isClient && !isFreelancer) {
      return NextResponse.json(
        { error: 'Not authorized to view this milestone' },
        { status: 403 }
      )
    }

    const metadata = (milestone.job_milestones.metadata as any) || {}
    const refundInfo = {
      status: milestone.job_milestones.status,
      isDisputed: milestone.job_milestones.status === 'disputed',
      disputedAt: milestone.job_milestones.disputedAt,
      refundedAt: milestone.job_milestones.refundedAt,
      refundRequest: metadata.refundRequest || null,
      refundResolution: metadata.refundResolution || null
    }

    return NextResponse.json(refundInfo)
  } catch (error) {
    console.error('Error fetching refund status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refund status' },
      { status: 500 }
    )
  }
}
