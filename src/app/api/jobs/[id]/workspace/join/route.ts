import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { db } from '@/lib/db'
import { jobPostings, workspaceSessions } from '@/lib/db/schema'
import { requireAuth } from '@/lib/middleware/auth'

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

      return NextResponse.json({ success: true, sessionId: existingSession.sessionId })
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
    // TODO: Send Pusher event for user joined

    return NextResponse.json({ success: true, sessionId })
  } catch (error) {
    console.error('Failed to join workspace:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to join workspace' },
      { status: 500 }
    )
  }
}