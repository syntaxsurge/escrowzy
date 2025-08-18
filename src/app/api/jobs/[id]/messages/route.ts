import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'

import { pusherChannels, pusherEvents } from '@/config/api-endpoints'
import { db } from '@/lib/db/drizzle'
import { jobPostings, messages, users } from '@/lib/db/schema'
import { pusherServer } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

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

    // Verify access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.clientId !== user.id && job.freelancerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get messages for this job workspace
    const jobMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        sender: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarPath
        },
        createdAt: messages.createdAt,
        attachments: messages.metadata
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.contextType, 'job_workspace'),
          eq(messages.contextId, jobId.toString())
        )
      )
      .orderBy(messages.createdAt)
      .limit(100)

    return NextResponse.json({ success: true, messages: jobMessages })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

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
    const body = await request.json()

    // Verify access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.clientId !== user.id && job.freelancerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create message
    const [message] = await db
      .insert(messages)
      .values({
        contextType: 'job_workspace',
        contextId: jobId.toString(),
        senderId: user.id,
        content: body.content,
        messageType: 'text',
        jobPostingId: jobId,
        metadata: body.attachments || null
      })
      .returning()

    // Get sender info
    const messageWithSender = {
      ...message,
      sender: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarPath
      }
    }

    // Send Pusher event for new message
    if (pusherServer) {
      const channel = pusherChannels.chat('job', jobId.toString())
      await pusherServer.trigger(channel, pusherEvents.chat.messageNew, {
        message: messageWithSender,
        timestamp: new Date().toISOString()
      })

      // Also notify the other party (client or freelancer)
      const recipientId =
        job.clientId === user.id ? job.freelancerId : job.clientId
      if (recipientId) {
        await pusherServer.trigger(
          pusherChannels.user(recipientId),
          pusherEvents.notification.created,
          {
            type: 'new_message',
            jobId,
            jobTitle: job.title,
            message: 'New message in job workspace',
            timestamp: new Date().toISOString()
          }
        )
      }
    }

    return NextResponse.json({ success: true, message: messageWithSender })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
