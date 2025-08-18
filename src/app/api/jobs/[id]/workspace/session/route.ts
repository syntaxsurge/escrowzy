import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobPostings, workspaceSessions } from '@/lib/db/schema'
import { getUser } from '@/services/user'

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

    // Update active session
    const result = await db
      .update(workspaceSessions)
      .set({
        currentTab: body.currentTab || null,
        lastActivityAt: new Date(),
        metadata: body.metadata || null
      })
      .where(
        and(
          eq(workspaceSessions.jobId, jobId),
          eq(workspaceSessions.userId, user.id),
          eq(workspaceSessions.status, 'active')
        )
      )

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully'
    })
  } catch (error) {
    console.error('Failed to update session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    )
  }
}
