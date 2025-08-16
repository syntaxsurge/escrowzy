import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, gte, or } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { interviews, jobBids, jobPostings, users } from '@/lib/db/schema'
import { sendNotification } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

// GET /api/interviews - Get user's interviews
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming') === 'true'

    // Build query conditions
    const conditions = [
      or(eq(interviews.clientId, user.id), eq(interviews.freelancerId, user.id))
    ]

    if (status) {
      conditions.push(eq(interviews.status, status))
    }

    if (upcoming) {
      conditions.push(gte(interviews.scheduledAt, new Date()))
    }

    // Fetch interviews with related data
    const userInterviews = await db
      .select({
        interview: interviews,
        job: {
          id: jobPostings.id,
          title: jobPostings.title,
          clientId: jobPostings.clientId
        },
        bid: {
          id: jobBids.id,
          bidAmount: jobBids.bidAmount,
          freelancerId: jobBids.freelancerId
        },
        client: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarPath: users.avatarPath
        },
        freelancer: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarPath: users.avatarPath
        }
      })
      .from(interviews)
      .leftJoin(jobPostings, eq(interviews.jobId, jobPostings.id))
      .leftJoin(jobBids, eq(interviews.bidId, jobBids.id))
      .leftJoin(users, eq(interviews.clientId, users.id))
      .where(and(...conditions))
      .orderBy(desc(interviews.scheduledAt))

    return NextResponse.json({
      success: true,
      interviews: userInterviews
    })
  } catch (error) {
    console.error('Error fetching interviews:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interviews' },
      { status: 500 }
    )
  }
}

// POST /api/interviews - Schedule a new interview
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      jobId,
      bidId,
      freelancerId,
      scheduledAt,
      duration = 30,
      meetingType = 'video',
      meetingLink,
      location,
      notes
    } = body

    // Verify the user is the client for this job
    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, jobId))
      .limit(1)

    if (!job || job.clientId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only schedule interviews for your own jobs'
        },
        { status: 403 }
      )
    }

    // Verify the bid exists
    const [bid] = await db
      .select()
      .from(jobBids)
      .where(and(eq(jobBids.id, bidId), eq(jobBids.jobId, jobId)))
      .limit(1)

    if (!bid) {
      return NextResponse.json(
        { success: false, error: 'Bid not found' },
        { status: 404 }
      )
    }

    // Check for conflicting interviews
    const existingInterview = await db
      .select()
      .from(interviews)
      .where(
        and(eq(interviews.bidId, bidId), eq(interviews.status, 'scheduled'))
      )
      .limit(1)

    if (existingInterview.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'An interview is already scheduled for this bid'
        },
        { status: 400 }
      )
    }

    // Generate meeting link if video type and not provided
    let finalMeetingLink = meetingLink
    if (meetingType === 'video' && !meetingLink) {
      // In production, integrate with a service like Zoom, Google Meet, etc.
      finalMeetingLink = `https://meet.escrowzy.com/interview/${jobId}-${bidId}-${Date.now()}`
    }

    // Create the interview
    const [newInterview] = await db
      .insert(interviews)
      .values({
        jobId,
        bidId,
        clientId: user.id,
        freelancerId: bid.freelancerId,
        scheduledAt: new Date(scheduledAt),
        duration,
        meetingType,
        meetingLink: finalMeetingLink,
        location,
        notes,
        status: 'scheduled',
        clientConfirmed: true,
        freelancerConfirmed: false
      })
      .returning()

    // Send notification to freelancer
    try {
      const [freelancer] = await db
        .select()
        .from(users)
        .where(eq(users.id, bid.freelancerId))
        .limit(1)

      await sendNotification(bid.freelancerId, {
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: `${user.name} has scheduled an interview for "${job.title}"`,
        data: {
          interviewId: newInterview.id,
          jobId,
          bidId,
          scheduledAt: newInterview.scheduledAt,
          meetingType,
          meetingLink: finalMeetingLink
        }
      })
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      interview: newInterview
    })
  } catch (error) {
    console.error('Error scheduling interview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to schedule interview' },
      { status: 500 }
    )
  }
}
