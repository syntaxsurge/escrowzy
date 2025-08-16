import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { jobPostings, messages, users } from '@/lib/db/schema'
import { requireAuth } from '@/lib/middleware/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const jobId = parseInt(params.id)

    // Verify access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    if (job.clientId !== user.id && job.freelancerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const jobId = parseInt(params.id)
    const body = await request.json()

    // Verify access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    if (job.clientId !== user.id && job.freelancerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
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

    // TODO: Send Pusher event for new message

    return NextResponse.json({ success: true, message: messageWithSender })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}