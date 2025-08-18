import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobPostings, users, workspaceSessions } from '@/lib/db/schema'
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

    // Get active workspace sessions
    const sessions = await db
      .select({
        id: workspaceSessions.id,
        userId: workspaceSessions.userId,
        status: workspaceSessions.status,
        currentTab: workspaceSessions.currentTab,
        lastActivityAt: workspaceSessions.lastActivityAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarPath
        }
      })
      .from(workspaceSessions)
      .innerJoin(users, eq(workspaceSessions.userId, users.id))
      .where(
        and(
          eq(workspaceSessions.jobId, jobId),
          eq(workspaceSessions.status, 'active')
        )
      )
      .orderBy(desc(workspaceSessions.lastActivityAt))

    return NextResponse.json({ success: true, sessions })
  } catch (error) {
    console.error('Failed to fetch workspace sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
