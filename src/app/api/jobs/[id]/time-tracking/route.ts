import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, gte } from 'drizzle-orm'

import { db } from '@/lib/db'
import { jobPostings, timeTracking } from '@/lib/db/schema'
import { requireAuth } from '@/lib/middleware/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)
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

    // Get time entries for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const entries = await db
      .select({
        id: timeTracking.id,
        startTime: timeTracking.startTime,
        endTime: timeTracking.endTime,
        duration: timeTracking.duration,
        description: timeTracking.description,
        isBillable: timeTracking.isBillable,
        hourlyRate: timeTracking.hourlyRate,
        totalAmount: timeTracking.totalAmount,
        status: timeTracking.status,
        createdAt: timeTracking.createdAt
      })
      .from(timeTracking)
      .where(
        and(
          eq(timeTracking.jobId, jobId),
          eq(timeTracking.userId, user.id),
          gte(timeTracking.startTime, thirtyDaysAgo)
        )
      )
      .orderBy(desc(timeTracking.startTime))

    return NextResponse.json({ success: true, entries })
  } catch (error) {
    console.error('Failed to fetch time entries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch time entries' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const jobId = parseInt(id)
    const body = await request.json()

    // Verify freelancer access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.freelancerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only freelancer can track time' },
        { status: 403 }
      )
    }

    // Calculate total amount
    const totalAmount =
      body.duration && body.hourlyRate
        ? ((body.duration / 60) * parseFloat(body.hourlyRate)).toFixed(2)
        : null

    // Create time entry
    const [entry] = await db
      .insert(timeTracking)
      .values({
        jobId,
        userId: user.id,
        milestoneId: body.milestoneId || null,
        taskId: body.taskId || null,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        duration: body.duration || null,
        description: body.description || null,
        isBillable: body.isBillable ?? true,
        hourlyRate: body.hourlyRate || null,
        totalAmount: totalAmount || null,
        status: 'tracked'
      })
      .returning()

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Failed to create time entry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create time entry' },
      { status: 500 }
    )
  }
}
