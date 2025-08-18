import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobMilestones, jobPostings, jobTasks, users } from '@/lib/db/schema'
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

    // Get tasks with related data
    const tasks = await db
      .select({
        id: jobTasks.id,
        title: jobTasks.title,
        description: jobTasks.description,
        status: jobTasks.status,
        priority: jobTasks.priority,
        assignedTo: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarPath
        },
        milestoneId: jobTasks.milestoneId,
        milestone: {
          id: jobMilestones.id,
          title: jobMilestones.title
        },
        dueDate: jobTasks.dueDate,
        estimatedHours: jobTasks.estimatedHours,
        actualHours: jobTasks.actualHours,
        tags: jobTasks.tags,
        sortOrder: jobTasks.sortOrder,
        createdAt: jobTasks.createdAt
      })
      .from(jobTasks)
      .leftJoin(users, eq(jobTasks.assignedTo, users.id))
      .leftJoin(jobMilestones, eq(jobTasks.milestoneId, jobMilestones.id))
      .where(eq(jobTasks.jobId, jobId))
      .orderBy(jobTasks.sortOrder)

    return NextResponse.json({ success: true, tasks })
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
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

    // Create task
    const [task] = await db
      .insert(jobTasks)
      .values({
        jobId,
        title: body.title,
        description: body.description || null,
        status: 'todo',
        priority: body.priority || 'medium',
        milestoneId: body.milestoneId || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        estimatedHours: body.estimatedHours || null,
        createdBy: user.id,
        tags: body.tags || [],
        sortOrder: 0
      })
      .returning()

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
