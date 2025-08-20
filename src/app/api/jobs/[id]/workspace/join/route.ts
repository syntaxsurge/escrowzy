import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { pusherChannels, pusherEvents } from '@/config/api-endpoints'
import { db } from '@/lib/db/drizzle'
import { jobPostings, workspaceSessions, users } from '@/lib/db/schema'
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = parseInt(id)
    const body = await request.json()

    // Verify access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.clientId !== user.id && job.freelancerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user already has an active session
    const existingSession = await db.query.workspaceSessions.findFirst({
      where: and(
        eq(workspaceSessions.jobId, jobId),
        eq(workspaceSessions.userId, user.id),
        eq(workspaceSessions.status, 'active')
      )
    })

    if (existingSession) {
      // Update existing session
      await db
        .update(workspaceSessions)
        .set({
          lastActivityAt: new Date(),
          currentTab: body.currentTab || null
        })
        .where(eq(workspaceSessions.id, existingSession.id))

      return NextResponse.json({
        sessionId: existingSession.sessionId
      })
    }

    // Create new session
    const sessionId = nanoid()
    const [session] = await db
      .insert(workspaceSessions)
      .values({
        jobId,
        userId: user.id,
        sessionId,
        status: 'active',
        currentTab: body.currentTab || null,
        lastActivityAt: new Date(),
        joinedAt: new Date()
      })
      .returning()

    // Trigger real-time update
    if (pusherServer) {
      // Get user details for the notification
      const userDetails = await db.query.users.findFirst({
        where: eq(users.id, user.id)
      })

      const channel = pusherChannels.chat('job-workspace', jobId.toString())
      await pusherServer.trigger(channel, pusherEvents.chat.userJoined, {
        userId: user.id,
        userName: userDetails?.name || 'Unknown User',
        sessionId,
        currentTab: body.currentTab,
        timestamp: new Date().toISOString()
      })

      // Also notify all participants in the workspace
      const otherParticipantId =
        job.clientId === user.id ? job.freelancerId : job.clientId
      if (otherParticipantId) {
        await pusherServer.trigger(
          pusherChannels.user(otherParticipantId),
          pusherEvents.notification.created,
          {
            type: 'workspace_joined',
            jobId,
            jobTitle: job.title,
            message: `${userDetails?.name || 'Someone'} joined the workspace`,
            timestamp: new Date().toISOString()
          }
        )
      }
    }

    return NextResponse.json({ sessionId })
  } catch (error) {
    console.error('Failed to join workspace:', error)
    return NextResponse.json(
      { error: 'Failed to join workspace' },
      { status: 500 }
    )
  }
}
