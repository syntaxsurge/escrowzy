import { NextRequest, NextResponse } from 'next/server'

import { eq, desc, and, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import {
  jobBids,
  jobPostings,
  users,
  freelancerProfiles
} from '@/lib/db/schema'
import { sendNotification } from '@/lib/pusher-server'
import { bidSubmissionSchema } from '@/lib/schemas/bid'
import { getUser } from '@/services/user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const jobId = parseInt(id)
    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await getUser()

    // Check if job exists
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Build query conditions based on user role
    let queryConditions

    // If user is logged in and not the job owner, only show their own bids
    if (user && user.id !== job.clientId) {
      queryConditions = and(
        eq(jobBids.jobId, jobId),
        eq(jobBids.freelancerId, user.id)
      )
    } else if (!user || user.id !== job.clientId) {
      // If not logged in or not the owner, return empty
      return NextResponse.json({
        bids: [],
        total: 0,
        isOwner: false
      })
    } else {
      // Job owner can see all bids
      queryConditions = eq(jobBids.jobId, jobId)
    }

    // Fetch bids with freelancer information
    const bidsWithFreelancers = await db
      .select({
        bid: jobBids,
        freelancer: users,
        freelancerProfile: freelancerProfiles
      })
      .from(jobBids)
      .leftJoin(users, eq(jobBids.freelancerId, users.id))
      .leftJoin(
        freelancerProfiles,
        eq(jobBids.freelancerId, freelancerProfiles.userId)
      )
      .where(queryConditions)
      .orderBy(desc(jobBids.createdAt))

    // Format the response
    const formattedBids = bidsWithFreelancers.map(
      ({ bid, freelancer, freelancerProfile }) => ({
        id: bid.id,
        jobId: bid.jobId,
        freelancerId: bid.freelancerId,
        bidAmount: bid.bidAmount,
        deliveryDays: bid.deliveryDays,
        proposalText: bid.proposalText,
        attachments: bid.attachments,
        status: bid.status,
        coverLetter: bid.coverLetter,
        shortlistedAt: bid.shortlistedAt,
        acceptedAt: bid.acceptedAt,
        rejectedAt: bid.rejectedAt,
        createdAt: bid.createdAt,
        updatedAt: bid.updatedAt,
        freelancer: freelancer
          ? {
              id: freelancer.id,
              name: freelancer.name,
              email: freelancer.email,
              avatarUrl: freelancer.avatarPath,
              walletAddress: freelancer.walletAddress
            }
          : null,
        freelancerProfile: freelancerProfile
          ? {
              professionalTitle: freelancerProfile.professionalTitle,
              hourlyRate: freelancerProfile.hourlyRate,
              yearsOfExperience: freelancerProfile.yearsOfExperience,
              verificationStatus: freelancerProfile.verificationStatus,
              rating: freelancerProfile.avgRating
                ? freelancerProfile.avgRating / 10.0
                : 0,
              completedJobs: freelancerProfile.totalJobs
            }
          : null
      })
    )

    return NextResponse.json({
      bids: formattedBids,
      total: formattedBids.length,
      isOwner: user?.id === job.clientId
    })
  } catch (error) {
    console.error('Error fetching job bids:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bids' },
      { status: 500 }
    )
  }
}

// POST /api/jobs/[id]/bids - Submit a bid for a job
export async function POST(
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
    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate input
    const validationResult = bidSubmissionSchema.safeParse({ ...body, jobId })
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    // Check if job exists and is open
    const [job] = await db
      .select()
      .from(jobPostings)
      .where(and(eq(jobPostings.id, jobId), eq(jobPostings.status, 'open')))
      .limit(1)

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found or not accepting bids' },
        { status: 404 }
      )
    }

    // Check if user is the job owner
    if (job.clientId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot bid on your own job' },
        { status: 400 }
      )
    }

    // Check if freelancer has already bid
    const [existingBid] = await db
      .select()
      .from(jobBids)
      .where(and(eq(jobBids.jobId, jobId), eq(jobBids.freelancerId, user.id)))
      .limit(1)

    if (existingBid) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have already submitted a bid for this job'
        },
        { status: 400 }
      )
    }

    // Check if user has a freelancer profile
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, user.id))
      .limit(1)

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please complete your freelancer profile before bidding'
        },
        { status: 400 }
      )
    }

    // Create the bid
    const [newBid] = await db
      .insert(jobBids)
      .values({
        jobId,
        freelancerId: user.id,
        bidAmount: validationResult.data.bidAmount,
        deliveryDays: validationResult.data.deliveryDays,
        proposalText: validationResult.data.proposalText,
        coverLetter: validationResult.data.coverLetter || null,
        attachments: validationResult.data.attachments || [],
        status: 'pending'
      })
      .returning()

    // Update job bid count
    await db
      .update(jobPostings)
      .set({
        currentBidsCount: sql`${jobPostings.currentBidsCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(jobPostings.id, jobId))

    // Send notification to job owner
    try {
      await sendNotification(job.clientId, {
        type: 'bid_received',
        title: 'New Bid Received',
        message: `${user.name} submitted a bid for "${job.title}"`,
        data: {
          jobId,
          bidId: newBid.id,
          freelancerId: user.id,
          freelancerName: user.name,
          bidAmount: newBid.bidAmount
        }
      })
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
      // Continue even if notification fails
    }

    return NextResponse.json(newBid)
  } catch (error) {
    console.error('Error submitting bid:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit bid' },
      { status: 500 }
    )
  }
}
