import { NextRequest, NextResponse } from 'next/server'

import { and, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobBids, jobPostings, trades } from '@/lib/db/schema'
import { sendNotification } from '@/lib/pusher-server'
import { bidStatusUpdateSchema, bidUpdateSchema } from '@/lib/schemas/bid'
import { getUser } from '@/services/user'

// GET /api/jobs/[id]/bids/[bidId] - Get a specific bid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const { id, bidId: bidIdParam } = await params
    const jobId = parseInt(id)
    const bidId = parseInt(bidIdParam)

    if (isNaN(jobId) || isNaN(bidId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const user = await getUser()

    // Get the bid with job and freelancer info
    const [bid] = await db
      .select()
      .from(jobBids)
      .where(and(eq(jobBids.id, bidId), eq(jobBids.jobId, jobId)))
      .limit(1)

    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    // Get job to check ownership
    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, jobId))
      .limit(1)

    // Only job owner or bid owner can view the bid details
    if (!user || (user.id !== job.clientId && user.id !== bid.freelancerId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(bid)
  } catch (error) {
    console.error('Error fetching bid:', error)
    return NextResponse.json({ error: 'Failed to fetch bid' }, { status: 500 })
  }
}

// PATCH /api/jobs/[id]/bids/[bidId] - Update a bid (freelancer only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, bidId: bidIdParam } = await params
    const jobId = parseInt(id)
    const bidId = parseInt(bidIdParam)

    if (isNaN(jobId) || isNaN(bidId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()

    // Check if this is a status update or bid update
    const isStatusUpdate = body.status !== undefined

    if (isStatusUpdate) {
      // Handle status update (accept/reject/shortlist/withdraw)
      const validationResult = bidStatusUpdateSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationResult.error.errors
          },
          { status: 400 }
        )
      }

      // Get the bid and job
      const [bid] = await db
        .select()
        .from(jobBids)
        .where(and(eq(jobBids.id, bidId), eq(jobBids.jobId, jobId)))
        .limit(1)

      if (!bid) {
        return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
      }

      const [job] = await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, jobId))
        .limit(1)

      // Determine who can update based on status
      const { status } = validationResult.data
      let canUpdate = false
      let updateData: any = { status, updatedAt: new Date() }

      if (status === 'withdrawn') {
        // Only freelancer can withdraw
        canUpdate = user.id === bid.freelancerId
        if (bid.status !== 'pending') {
          return NextResponse.json(
            { error: 'Can only withdraw pending bids' },
            { status: 400 }
          )
        }
      } else if (status === 'shortlisted') {
        // Only client can shortlist
        canUpdate = user.id === job.clientId
        updateData.shortlistedAt = new Date()
      } else if (status === 'accepted') {
        // Only client can accept
        canUpdate = user.id === job.clientId
        updateData.acceptedAt = new Date()

        // Check if job is still open
        if (job.status !== 'open') {
          return NextResponse.json(
            { error: 'Job is no longer accepting bids' },
            { status: 400 }
          )
        }

        // Create a trade for the accepted bid
        await db.insert(trades).values({
          buyerId: job.clientId,
          sellerId: bid.freelancerId,
          listingCategory: 'service',
          jobPostingId: jobId,
          bidId: bidId,
          amount: bid.bidAmount,
          currency: job.currency || 'USD',
          chainId: 1,
          escrowId: 0,
          depositDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'pending_deposit'
        })

        // Update job status to in_progress
        await db
          .update(jobPostings)
          .set({
            status: 'in_progress',
            freelancerId: bid.freelancerId,
            updatedAt: new Date()
          })
          .where(eq(jobPostings.id, jobId))

        // Reject all other pending bids
        await db
          .update(jobBids)
          .set({
            status: 'rejected',
            rejectedAt: new Date(),
            updatedAt: new Date()
          })
          .where(
            and(
              eq(jobBids.jobId, jobId),
              eq(jobBids.status, 'pending'),
              sql`${jobBids.id} != ${bidId}`
            )
          )
      } else if (status === 'rejected') {
        // Only client can reject
        canUpdate = user.id === job.clientId
        updateData.rejectedAt = new Date()
      }

      if (!canUpdate) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Update the bid
      const [updatedBid] = await db
        .update(jobBids)
        .set(updateData)
        .where(eq(jobBids.id, bidId))
        .returning()

      // Send notifications
      const notificationTarget =
        status === 'withdrawn' ? job.clientId : bid.freelancerId
      const notificationMessages: Record<string, string> = {
        withdrawn: 'withdrew their bid',
        shortlisted: 'shortlisted your bid',
        accepted: 'accepted your bid! 🎉',
        rejected: 'declined your bid'
      }

      try {
        await sendNotification(notificationTarget, {
          type: 'bid_status_update',
          title: 'Bid Status Update',
          message: `${user.name} ${notificationMessages[status]} for "${job.title}"`,
          data: {
            jobId,
            bidId,
            status,
            userId: user.id
          }
        })
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError)
      }

      return NextResponse.json(updatedBid)
    } else {
      // Handle bid content update (only freelancer can update their own bid)
      const validationResult = bidUpdateSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationResult.error.errors
          },
          { status: 400 }
        )
      }

      // Check if user owns this bid
      const [bid] = await db
        .select()
        .from(jobBids)
        .where(
          and(
            eq(jobBids.id, bidId),
            eq(jobBids.jobId, jobId),
            eq(jobBids.freelancerId, user.id)
          )
        )
        .limit(1)

      if (!bid) {
        return NextResponse.json(
          { error: 'Bid not found or unauthorized' },
          { status: 404 }
        )
      }

      // Can only update pending bids
      if (bid.status !== 'pending') {
        return NextResponse.json(
          { error: 'Can only update pending bids' },
          { status: 400 }
        )
      }

      // Update the bid
      const [updatedBid] = await db
        .update(jobBids)
        .set({
          ...validationResult.data,
          updatedAt: new Date()
        })
        .where(eq(jobBids.id, bidId))
        .returning()

      return NextResponse.json(updatedBid)
    }
  } catch (error) {
    console.error('Error updating bid:', error)
    return NextResponse.json({ error: 'Failed to update bid' }, { status: 500 })
  }
}

// DELETE /api/jobs/[id]/bids/[bidId] - Withdraw a bid (freelancer only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, bidId: bidIdParam } = await params
    const jobId = parseInt(id)
    const bidId = parseInt(bidIdParam)

    if (isNaN(jobId) || isNaN(bidId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Check if user owns this bid
    const [bid] = await db
      .select()
      .from(jobBids)
      .where(
        and(
          eq(jobBids.id, bidId),
          eq(jobBids.jobId, jobId),
          eq(jobBids.freelancerId, user.id)
        )
      )
      .limit(1)

    if (!bid) {
      return NextResponse.json(
        { error: 'Bid not found or unauthorized' },
        { status: 404 }
      )
    }

    // Can only withdraw pending bids
    if (bid.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only withdraw pending bids' },
        { status: 400 }
      )
    }

    // Update bid status to withdrawn
    const [withdrawnBid] = await db
      .update(jobBids)
      .set({
        status: 'withdrawn',
        updatedAt: new Date()
      })
      .where(eq(jobBids.id, bidId))
      .returning()

    // Update job bid count
    await db
      .update(jobPostings)
      .set({
        currentBidsCount: sql`GREATEST(${jobPostings.currentBidsCount} - 1, 0)`,
        updatedAt: new Date()
      })
      .where(eq(jobPostings.id, jobId))

    return NextResponse.json({
      message: 'Bid withdrawn successfully',
      bid: withdrawnBid
    })
  } catch (error) {
    console.error('Error withdrawing bid:', error)
    return NextResponse.json(
      { error: 'Failed to withdraw bid' },
      { status: 500 }
    )
  }
}
