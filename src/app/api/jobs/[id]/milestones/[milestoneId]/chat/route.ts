import { NextRequest, NextResponse } from 'next/server'

import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import {
  jobMilestones,
  jobPostings,
  milestoneChats,
  users
} from '@/lib/db/schema'
import { pusherServer } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

const sendMessageSchema = z.object({
  message: z.string().min(1),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        size: z.number(),
        type: z.string()
      })
    )
    .optional()
})

// GET /api/jobs/[id]/milestones/[milestoneId]/chat - Get milestone chat messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId: milestoneIdParam } = await params
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = parseInt(id)
    const milestoneId = parseInt(milestoneIdParam)

    if (isNaN(jobId) || isNaN(milestoneId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Get the milestone and job to verify access
    const [milestone] = await db
      .select({
        milestone: jobMilestones,
        job: jobPostings
      })
      .from(jobMilestones)
      .innerJoin(jobPostings, eq(jobMilestones.jobId, jobPostings.id))
      .where(
        and(eq(jobMilestones.id, milestoneId), eq(jobMilestones.jobId, jobId))
      )
      .limit(1)

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this milestone
    const isClient = milestone.job.clientId === user.id
    const isFreelancer = milestone.job.freelancerId === user.id

    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get pagination params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch messages with user details
    const messages = await db
      .select({
        id: milestoneChats.id,
        milestoneId: milestoneChats.milestoneId,
        userId: milestoneChats.senderId,
        message: milestoneChats.message,
        attachments: milestoneChats.attachments,
        messageType: milestoneChats.messageType,
        createdAt: milestoneChats.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.avatarPath
        }
      })
      .from(milestoneChats)
      .leftJoin(users, eq(milestoneChats.senderId, users.id))
      .where(eq(milestoneChats.milestoneId, milestoneId))
      .orderBy(asc(milestoneChats.createdAt))
      .limit(limit)
      .offset(offset)

    // Mark messages as read
    await db
      .update(milestoneChats)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(milestoneChats.milestoneId, milestoneId),
          eq(milestoneChats.isRead, false)
        )
      )

    // Transform messages to include isSystem field
    const transformedMessages = messages.map(msg => ({
      ...msg,
      isSystem: msg.messageType === 'system'
    }))

    return NextResponse.json({
      messages: transformedMessages,
      hasMore: messages.length === limit
    })
  } catch (error) {
    console.error('Error fetching milestone chat:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/jobs/[id]/milestones/[milestoneId]/chat - Send message in milestone chat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId: milestoneIdParam } = await params
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = parseInt(id)
    const milestoneId = parseInt(milestoneIdParam)

    if (isNaN(jobId) || isNaN(milestoneId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Get the milestone and job to verify access
    const [milestone] = await db
      .select({
        milestone: jobMilestones,
        job: jobPostings
      })
      .from(jobMilestones)
      .innerJoin(jobPostings, eq(jobMilestones.jobId, jobPostings.id))
      .where(
        and(eq(jobMilestones.id, milestoneId), eq(jobMilestones.jobId, jobId))
      )
      .limit(1)

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this milestone
    const isClient = milestone.job.clientId === user.id
    const isFreelancer = milestone.job.freelancerId === user.id

    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)

    // Create the message
    const [message] = await db
      .insert(milestoneChats)
      .values({
        milestoneId,
        senderId: user.id,
        message: validatedData.message,
        attachments: validatedData.attachments || [],
        messageType: 'text'
      })
      .returning()

    // Get the recipient ID
    const recipientId = isClient
      ? milestone.job.freelancerId
      : milestone.job.clientId

    // Send real-time notification
    if (pusherServer && recipientId) {
      await pusherServer.trigger(`milestone-${milestoneId}`, 'new-message', {
        id: message.id,
        milestoneId,
        userId: user.id,
        message: validatedData.message,
        attachments: validatedData.attachments,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarPath
        },
        createdAt: message.createdAt
      })

      // Also send notification to recipient's channel
      await pusherServer.trigger(`user-${recipientId}`, 'milestone-message', {
        milestoneId,
        jobId,
        jobTitle: milestone.job.title,
        milestoneTitle: milestone.milestone.title,
        senderName: user.name || user.email,
        message: validatedData.message,
        createdAt: message.createdAt
      })
    }

    return NextResponse.json({
      ...message,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.avatarPath
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error sending milestone message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// POST /api/jobs/[id]/milestones/[milestoneId]/chat/system - Add system message
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { milestoneId: milestoneIdParam } = await params
    const milestoneId = parseInt(milestoneIdParam)

    if (isNaN(milestoneId)) {
      return NextResponse.json(
        { error: 'Invalid milestone ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { message, type } = body

    if (!message || !type) {
      return NextResponse.json(
        { error: 'Message and type are required' },
        { status: 400 }
      )
    }

    // Create system message (use a system user ID or 0)
    const [systemMessage] = await db
      .insert(milestoneChats)
      .values({
        milestoneId,
        senderId: 0, // System messages use 0 as senderId
        message,
        messageType: type || 'system',
        attachments: []
      })
      .returning()

    // Send real-time update
    if (pusherServer) {
      await pusherServer.trigger(`milestone-${milestoneId}`, 'system-message', {
        id: systemMessage.id,
        milestoneId,
        message,
        type,
        createdAt: systemMessage.createdAt
      })
    }

    return NextResponse.json(systemMessage)
  } catch (error) {
    console.error('Error adding system message:', error)
    return NextResponse.json(
      { error: 'Failed to add system message' },
      { status: 500 }
    )
  }
}
