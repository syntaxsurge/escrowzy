import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { interviews } from '@/lib/db/schema'
import { sendNotification } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

// GET /api/interviews/[id] - Get a specific interview
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

    const interviewId = parseInt(id)

    if (isNaN(interviewId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid interview ID' },
        { status: 400 }
      )
    }

    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, interviewId))
      .limit(1)

    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      )
    }

    // Check if user is participant
    if (interview.clientId !== user.id && interview.freelancerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You are not a participant in this interview'
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      interview
    })
  } catch (error) {
    console.error('Error fetching interview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interview' },
      { status: 500 }
    )
  }
}

// PATCH /api/interviews/[id] - Update an interview
export async function PATCH(
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

    const interviewId = parseInt(id)

    if (isNaN(interviewId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid interview ID' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Get the interview
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, interviewId))
      .limit(1)

    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      )
    }

    // Check if user is participant
    if (interview.clientId !== user.id && interview.freelancerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You are not a participant in this interview'
        },
        { status: 403 }
      )
    }

    const updateData: any = { updatedAt: new Date() }

    // Handle different update types
    if (body.action === 'confirm') {
      // Freelancer confirming the interview
      if (user.id === interview.freelancerId) {
        updateData.freelancerConfirmed = true
      } else {
        return NextResponse.json(
          { success: false, error: 'Only the freelancer can confirm' },
          { status: 403 }
        )
      }
    } else if (body.action === 'reschedule') {
      // Either party can request reschedule
      if (body.scheduledAt) {
        updateData.scheduledAt = new Date(body.scheduledAt)
        updateData.status = 'rescheduled'
        updateData.freelancerConfirmed = false // Reset confirmation

        // Send notification to other party
        const otherUserId =
          user.id === interview.clientId
            ? interview.freelancerId
            : interview.clientId

        await sendNotification(otherUserId, {
          type: 'interview_rescheduled',
          title: 'Interview Rescheduled',
          message: `${user.name} has rescheduled the interview`,
          data: {
            interviewId,
            newScheduledAt: body.scheduledAt
          }
        })
      }
    } else if (body.action === 'cancel') {
      // Either party can cancel
      updateData.status = 'cancelled'
      updateData.cancelledBy = user.id
      updateData.cancelReason = body.reason || 'No reason provided'

      // Send notification to other party
      const otherUserId =
        user.id === interview.clientId
          ? interview.freelancerId
          : interview.clientId

      await sendNotification(otherUserId, {
        type: 'interview_cancelled',
        title: 'Interview Cancelled',
        message: `${user.name} has cancelled the interview`,
        data: {
          interviewId,
          reason: updateData.cancelReason
        }
      })
    } else if (body.action === 'complete') {
      // Mark interview as completed
      if (user.id === interview.clientId) {
        updateData.status = 'completed'
      } else {
        return NextResponse.json(
          { success: false, error: 'Only the client can mark as completed' },
          { status: 403 }
        )
      }
    } else {
      // General update (notes, meeting link, etc.)
      if (user.id !== interview.clientId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Only the client can update interview details'
          },
          { status: 403 }
        )
      }

      if (body.notes !== undefined) updateData.notes = body.notes
      if (body.meetingLink !== undefined)
        updateData.meetingUrl = body.meetingLink
      if (body.location !== undefined) updateData.location = body.location
      if (body.duration !== undefined) updateData.duration = body.duration
    }

    // Update the interview
    const [updatedInterview] = await db
      .update(interviews)
      .set(updateData)
      .where(eq(interviews.id, interviewId))
      .returning()

    return NextResponse.json({
      success: true,
      interview: updatedInterview
    })
  } catch (error) {
    console.error('Error updating interview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update interview' },
      { status: 500 }
    )
  }
}

// DELETE /api/interviews/[id] - Delete an interview
export async function DELETE(
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

    const interviewId = parseInt(id)

    if (isNaN(interviewId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid interview ID' },
        { status: 400 }
      )
    }

    // Get the interview
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, interviewId))
      .limit(1)

    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      )
    }

    // Only client can delete
    if (interview.clientId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the client can delete interviews' },
        { status: 403 }
      )
    }

    // Delete the interview
    await db.delete(interviews).where(eq(interviews.id, interviewId))

    // Send notification to freelancer
    await sendNotification(interview.freelancerId, {
      type: 'interview_deleted',
      title: 'Interview Deleted',
      message: `The interview has been removed`,
      data: {
        interviewId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Interview deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting interview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete interview' },
      { status: 500 }
    )
  }
}
