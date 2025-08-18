import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobAlerts, jobPostings, savedSearches } from '@/lib/db/schema'
import { sendNotification } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

// GET /api/job-alerts - Get user's job alerts
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, sent, viewed, dismissed
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build query conditions
    const conditions = [eq(jobAlerts.userId, user.id)]
    if (status) {
      conditions.push(eq(jobAlerts.status, status))
    }

    // Fetch alerts with job details
    const alerts = await db
      .select({
        alert: jobAlerts,
        job: {
          id: jobPostings.id,
          title: jobPostings.title,
          description: jobPostings.description,
          budgetMin: jobPostings.budgetMin,
          budgetMax: jobPostings.budgetMax,
          deadline: jobPostings.deadline,
          createdAt: jobPostings.createdAt
        },
        savedSearch: {
          id: savedSearches.id,
          name: savedSearches.name
        }
      })
      .from(jobAlerts)
      .leftJoin(jobPostings, eq(jobAlerts.jobId, jobPostings.id))
      .leftJoin(savedSearches, eq(jobAlerts.savedSearchId, savedSearches.id))
      .where(and(...conditions))
      .orderBy(desc(jobAlerts.createdAt))
      .limit(limit)

    // Get unread count
    const [{ count: unreadCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobAlerts)
      .where(
        and(eq(jobAlerts.userId, user.id), eq(jobAlerts.status, 'pending'))
      )

    return NextResponse.json({
      success: true,
      alerts,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching job alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job alerts' },
      { status: 500 }
    )
  }
}

// POST /api/job-alerts - Create a new job alert
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobId, savedSearchId, alertType = 'new_match' } = body

    // Validate input
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Check if alert already exists
    const existing = await db
      .select()
      .from(jobAlerts)
      .where(
        and(
          eq(jobAlerts.userId, user.id),
          eq(jobAlerts.jobId, jobId),
          eq(jobAlerts.alertType, alertType)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Alert already exists for this job' },
        { status: 400 }
      )
    }

    // Create the alert
    const [newAlert] = await db
      .insert(jobAlerts)
      .values({
        userId: user.id,
        jobId,
        savedSearchId,
        alertType,
        status: 'pending'
      })
      .returning()

    // Send real-time notification
    try {
      const [job] = await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, jobId))
        .limit(1)

      await sendNotification(user.id, {
        type: 'job_alert',
        title: 'New Job Match',
        message: `New job matching your criteria: "${job?.title}"`,
        data: {
          alertId: newAlert.id,
          jobId,
          alertType
        }
      })
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      alert: newAlert
    })
  } catch (error) {
    console.error('Error creating job alert:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create job alert' },
      { status: 500 }
    )
  }
}

// PATCH /api/job-alerts - Update alert status
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Alert ID and status are required' },
        { status: 400 }
      )
    }

    // Check ownership
    const [alert] = await db
      .select()
      .from(jobAlerts)
      .where(and(eq(jobAlerts.id, id), eq(jobAlerts.userId, user.id)))
      .limit(1)

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      )
    }

    // Update the alert
    const updateData: any = { status }
    if (status === 'viewed' && !alert.viewedAt) {
      updateData.viewedAt = new Date()
    }
    if (status === 'sent' && !alert.sentAt) {
      updateData.sentAt = new Date()
    }

    const [updatedAlert] = await db
      .update(jobAlerts)
      .set(updateData)
      .where(eq(jobAlerts.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      alert: updatedAlert
    })
  } catch (error) {
    console.error('Error updating job alert:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update job alert' },
      { status: 500 }
    )
  }
}

// DELETE /api/job-alerts - Delete an alert
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const dismissAll = searchParams.get('dismissAll') === 'true'

    if (dismissAll) {
      // Dismiss all pending alerts
      await db
        .update(jobAlerts)
        .set({ status: 'dismissed' })
        .where(
          and(eq(jobAlerts.userId, user.id), eq(jobAlerts.status, 'pending'))
        )

      return NextResponse.json({
        success: true,
        message: 'All alerts dismissed'
      })
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    // Check ownership
    const [alert] = await db
      .select()
      .from(jobAlerts)
      .where(and(eq(jobAlerts.id, parseInt(id)), eq(jobAlerts.userId, user.id)))
      .limit(1)

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      )
    }

    // Delete the alert
    await db.delete(jobAlerts).where(eq(jobAlerts.id, parseInt(id)))

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting job alert:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete job alert' },
      { status: 500 }
    )
  }
}

// Import sql from drizzle-orm
