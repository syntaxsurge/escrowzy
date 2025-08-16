import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobBids, jobPostings, messages, users } from '@/lib/db/schema'
import { pusherServer, sendNotification } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

// GET /api/jobs/[id]/bids/[bidId]/messages - Get bid negotiation messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const { id, bidId } = await params
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const jobId = parseInt(id)
    const bidId = parseInt(bidId)

    if (isNaN(jobId) || isNaN(bidId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      )
    }

    // Verify user has access to this bid
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

    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, jobId))
      .limit(1)

    // Check if user is either the client or the freelancer
    if (user.id !== job.clientId && user.id !== bid.freelancerId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch messages for this bid negotiation
    const bidMessages = await db
      .select({
        id: messages.id,
        bidId: messages.relatedId,
        senderId: messages.senderId,
        message: messages.message,
        attachments: messages.attachments,
        messageType: messages.messageType,
        metadata: messages.metadata,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarPath
        }
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.relatedId, bidId),
          eq(messages.relatedType, 'bid_negotiation')
        )
      )
      .orderBy(messages.createdAt)

    return NextResponse.json({
      success: true,
      messages: bidMessages
    })
  } catch (error) {
    console.error('Error fetching bid messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/jobs/[id]/bids/[bidId]/messages - Send a negotiation message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
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
    const bidId = parseInt(bidId)

    if (isNaN(jobId) || isNaN(bidId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { message, messageType = 'text', metadata, attachments } = body

    // Verify user has access to this bid
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

    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, jobId))
      .limit(1)

    // Check if user is either the client or the freelancer
    if (user.id !== job.clientId && user.id !== bid.freelancerId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create the message
    const [newMessage] = await db
      .insert(messages)
      .values({
        senderId: user.id,
        receiverId: user.id === job.clientId ? bid.freelancerId : job.clientId,
        relatedType: 'bid_negotiation',
        relatedId: bidId,
        message,
        messageType,
        metadata: metadata || {},
        attachments: attachments || [],
        isRead: false
      })
      .returning()

    // Get sender info for the response
    const messageWithSender = {
      ...newMessage,
      sender: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarPath
      }
    }

    // Send real-time update via Pusher
    if (pusherServer) {
      await pusherServer.trigger(
        `bid-${bidId}`,
        'new-message',
        messageWithSender
      )
    }

    // Send notification to the other party
    const recipientId =
      user.id === job.clientId ? bid.freelancerId : job.clientId
    const recipientType = user.id === job.clientId ? 'freelancer' : 'client'

    try {
      await sendNotification(recipientId, {
        type: 'bid_negotiation_message',
        title: 'New Negotiation Message',
        message: `${user.name} sent a message about "${job.title}"`,
        data: {
          jobId,
          bidId,
          messageId: newMessage.id,
          messageType,
          senderName: user.name
        }
      })
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
    }

    // Handle special message types
    if (messageType === 'offer' && metadata) {
      // Update bid with new proposed terms (optional - could track separately)
      // For now, just log the offer
      console.log('New offer received:', metadata)
    }

    return NextResponse.json({
      success: true,
      message: messageWithSender
    })
  } catch (error) {
    console.error('Error sending bid message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
