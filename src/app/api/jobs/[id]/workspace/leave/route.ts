import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { workspaceSessions } from '@/lib/db/schema'
import { requireAuth } from '@/lib/middleware/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)
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

    // TODO: Send Pusher event for user left

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to leave workspace:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to leave workspace' },
      { status: 500 }
    )
  }
}
