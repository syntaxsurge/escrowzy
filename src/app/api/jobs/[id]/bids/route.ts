import { NextRequest, NextResponse } from 'next/server'

import { eq, desc } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import {
  jobBids,
  jobPostings,
  users,
  freelancerProfiles
} from '@/lib/db/schema'
import { getUser } from '@/services/user'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(params.id)
    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user owns this job
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.clientId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
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
      .where(eq(jobBids.jobId, jobId))
      .orderBy(desc(jobBids.createdAt))

    // Format the response
    const formattedBids = bidsWithFreelancers.map(
      ({ bid, freelancer, freelancerProfile }) => ({
        id: bid.id,
        jobId: bid.jobId,
        freelancerId: bid.freelancerId,
        bidAmount: bid.bidAmount,
        deliveryTimeDays: bid.deliveryDays,
        proposalText: bid.proposalText,
        attachments: bid.attachments,
        status: bid.status,
        coverLetter: bid.coverLetter,
        createdAt: bid.createdAt,
        updatedAt: bid.updatedAt,
        freelancer: freelancer
          ? {
              id: freelancer.id,
              name: freelancer.name,
              email: freelancer.email,
              avatarUrl: freelancer.avatarPath,
              username: freelancer.name
            }
          : null,
        freelancerProfile: freelancerProfile
          ? {
              professionalTitle: freelancerProfile.professionalTitle,
              hourlyRate: freelancerProfile.hourlyRate,
              yearsOfExperience: freelancerProfile.yearsOfExperience,
              verificationStatus: freelancerProfile.verificationStatus
            }
          : null
      })
    )

    return NextResponse.json({
      success: true,
      bids: formattedBids,
      total: formattedBids.length
    })
  } catch (error) {
    console.error('Error fetching job bids:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bids' },
      { status: 500 }
    )
  }
}
