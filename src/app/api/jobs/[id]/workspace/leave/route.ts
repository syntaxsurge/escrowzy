import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'

import { pusherChannels, pusherEvents } from '@/config/api-endpoints'
import { db } from '@/lib/db/drizzle'
import { workspaceSessions, users, jobPostings } from '@/lib/db/schema'
import { pusherServer } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

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

    // Update session to disconnected
    await db
      .update(workspaceSessions)
      .set({
        status: 'disconnected',
        leftAt: new Date(),
        lastActivityAt: new Date()
      })
      .where(
        and(
          eq(workspaceSessions.jobId, jobId),
          eq(workspaceSessions.userId, user.id),
          eq(workspaceSessions.status, 'active')
        )
      )

    // Send Pusher event for user left
    if (pusherServer) {
      // Get user and job details
      const userDetails = await db.query.users.findFirst({
        where: eq(users.id, user.id)
      })

      const job = await db.query.jobPostings.findFirst({
        where: eq(jobPostings.id, jobId)
      })

      const channel = pusherChannels.chat('job-workspace', jobId.toString())
      await pusherServer.trigger(channel, pusherEvents.chat.userLeft, {
        userId: user.id,
        userName: userDetails?.name || 'Unknown User',
        timestamp: new Date().toISOString()
      })

      // Notify other participants
      if (job) {
        const otherParticipantId =
          job.clientId === user.id ? job.freelancerId : job.clientId
        if (otherParticipantId) {
          await pusherServer.trigger(
            pusherChannels.user(otherParticipantId),
            pusherEvents.notification.created,
            {
              type: 'workspace_left',
              jobId,
              jobTitle: job.title,
              message: `${userDetails?.name || 'Someone'} left the workspace`,
              timestamp: new Date().toISOString()
            }
          )
        }
      }
    }

    return NextResponse.json({ message: 'Left workspace successfully' })
  } catch (error) {
    console.error('Failed to leave workspace:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to leave workspace' },
      { status: 500 }
    )
  }
}
