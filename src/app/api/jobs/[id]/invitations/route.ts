import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, inArray } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import {
  freelancerProfiles,
  jobInvitations,
  jobPostings,
  users
} from '@/lib/db/schema'
import { sendNotification } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

// GET /api/jobs/[id]/invitations - Get invitations for a job
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

    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      )
    }

    // Check if user owns the job
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
        {
          success: false,
          error: 'You can only view invitations for your own jobs'
        },
        { status: 403 }
      )
    }

    // Fetch invitations with freelancer details
    const invitations = await db
      .select({
        invitation: jobInvitations,
        freelancer: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarPath
        },
        freelancerProfile: {
          professionalTitle: freelancerProfiles.professionalTitle,
          hourlyRate: freelancerProfiles.hourlyRate,
          yearsOfExperience: freelancerProfiles.yearsOfExperience,
          avgRating: freelancerProfiles.avgRating,
          totalJobs: freelancerProfiles.totalJobs
        }
      })
      .from(jobInvitations)
      .leftJoin(users, eq(jobInvitations.freelancerId, users.id))
      .leftJoin(
        freelancerProfiles,
        eq(jobInvitations.freelancerId, freelancerProfiles.userId)
      )
      .where(eq(jobInvitations.jobId, jobId))
      .orderBy(desc(jobInvitations.createdAt))

    return NextResponse.json({
      success: true,
      invitations
    })
  } catch (error) {
    console.error('Error fetching job invitations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

// POST /api/jobs/[id]/invitations - Send invitations to freelancers
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { freelancerIds, message } = body

    if (
      !freelancerIds ||
      !Array.isArray(freelancerIds) ||
      freelancerIds.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'At least one freelancer must be selected' },
        { status: 400 }
      )
    }

    // Check if user owns the job
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
        {
          success: false,
          error: 'You can only send invitations for your own jobs'
        },
        { status: 403 }
      )
    }

    // Check for existing invitations
    const existingInvitations = await db
      .select()
      .from(jobInvitations)
      .where(
        and(
          eq(jobInvitations.jobId, jobId),
          inArray(jobInvitations.freelancerId, freelancerIds)
        )
      )

    const existingFreelancerIds = existingInvitations.map(
      inv => inv.freelancerId
    )
    const newFreelancerIds = freelancerIds.filter(
      id => !existingFreelancerIds.includes(id)
    )

    if (newFreelancerIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'All selected freelancers have already been invited'
        },
        { status: 400 }
      )
    }

    // Create invitations
    const invitationsToCreate = newFreelancerIds.map(freelancerId => ({
      jobId,
      freelancerId,
      invitedBy: user.id,
      message: message || `You've been invited to apply for "${job.title}"`,
      status: 'pending' as const
    }))

    const createdInvitations = await db
      .insert(jobInvitations)
      .values(invitationsToCreate)
      .returning()

    // Update job visibility if needed
    if (job.visibility === 'public') {
      await db
        .update(jobPostings)
        .set({
          visibility: 'invited',
          updatedAt: new Date()
        })
        .where(eq(jobPostings.id, jobId))
    }

    // Send notifications to invited freelancers
    for (const freelancerId of newFreelancerIds) {
      try {
        await sendNotification(freelancerId, {
          type: 'job_invitation',
          title: 'New Job Invitation',
          message: `${user.name} invited you to apply for "${job.title}"`,
          data: {
            jobId,
            clientId: user.id,
            clientName: user.name
          }
        })
      } catch (notificationError) {
        console.error(
          `Failed to send notification to freelancer ${freelancerId}:`,
          notificationError
        )
      }
    }

    return NextResponse.json({
      success: true,
      invitations: createdInvitations,
      invited: newFreelancerIds.length,
      alreadyInvited: existingFreelancerIds.length
    })
  } catch (error) {
    console.error('Error sending job invitations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invitations' },
      { status: 500 }
    )
  }
}
