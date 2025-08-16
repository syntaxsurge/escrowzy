import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobInvitations, jobPostings, users } from '@/lib/db/schema'
import { sendNotification } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

// GET /api/invitations/[id] - Get a specific invitation
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

    const invitationId = parseInt(id)

    if (isNaN(invitationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation ID' },
        { status: 400 }
      )
    }

    const [invitation] = await db
      .select({
        invitation: jobInvitations,
        job: {
          id: jobPostings.id,
          title: jobPostings.title,
          description: jobPostings.description,
          budgetMin: jobPostings.budgetMin,
          budgetMax: jobPostings.budgetMax,
          deadline: jobPostings.deadline,
          clientId: jobPostings.clientId
        },
        invitedBy: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarPath
        }
      })
      .from(jobInvitations)
      .leftJoin(jobPostings, eq(jobInvitations.jobId, jobPostings.id))
      .leftJoin(users, eq(jobInvitations.invitedBy, users.id))
      .where(eq(jobInvitations.id, invitationId))
      .limit(1)

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if user is the freelancer or the client
    if (
      invitation.invitation.freelancerId !== user.id &&
      invitation.job?.clientId !== user.id
    ) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this invitation' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitation' },
      { status: 500 }
    )
  }
}

// PATCH /api/invitations/[id] - Update invitation status (accept/decline)
export async function PATCH(
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

    const invitationId = parseInt(id)

    if (isNaN(invitationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['accepted', 'declined'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Must be "accepted" or "declined"'
        },
        { status: 400 }
      )
    }

    // Get the invitation
    const [invitation] = await db
      .select()
      .from(jobInvitations)
      .where(eq(jobInvitations.id, invitationId))
      .limit(1)

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if user is the freelancer
    if (invitation.freelancerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only the invited freelancer can respond to this invitation'
        },
        { status: 403 }
      )
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'This invitation has already been responded to'
        },
        { status: 400 }
      )
    }

    // Update the invitation
    const [updatedInvitation] = await db
      .update(jobInvitations)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(jobInvitations.id, invitationId))
      .returning()

    // Get job details for notification
    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, invitation.jobId))
      .limit(1)

    // Send notification to the client
    if (job) {
      try {
        await sendNotification(job.clientId, {
          type: 'invitation_response',
          title: `Invitation ${status === 'accepted' ? 'Accepted' : 'Declined'}`,
          message: `${user.name} has ${status} your invitation for "${job.title}"`,
          data: {
            invitationId,
            jobId: job.id,
            freelancerId: user.id,
            freelancerName: user.name,
            status
          }
        })
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      invitation: updatedInvitation,
      message:
        status === 'accepted'
          ? 'Invitation accepted! You can now submit a bid for this job.'
          : 'Invitation declined.'
    })
  } catch (error) {
    console.error('Error updating invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update invitation' },
      { status: 500 }
    )
  }
}

// DELETE /api/invitations/[id] - Cancel an invitation (client only)
export async function DELETE(
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

    const invitationId = parseInt(id)

    if (isNaN(invitationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation ID' },
        { status: 400 }
      )
    }

    // Get the invitation
    const [invitation] = await db
      .select()
      .from(jobInvitations)
      .where(eq(jobInvitations.id, invitationId))
      .limit(1)

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if user is the client who sent the invitation
    if (invitation.invitedBy !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only the client who sent the invitation can cancel it'
        },
        { status: 403 }
      )
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot cancel an invitation that has been responded to'
        },
        { status: 400 }
      )
    }

    // Delete the invitation
    await db.delete(jobInvitations).where(eq(jobInvitations.id, invitationId))

    // Send notification to the freelancer
    try {
      await sendNotification(invitation.freelancerId, {
        type: 'invitation_cancelled',
        title: 'Invitation Cancelled',
        message: 'A job invitation has been cancelled by the client',
        data: {
          invitationId,
          jobId: invitation.jobId
        }
      })
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel invitation' },
      { status: 500 }
    )
  }
}
