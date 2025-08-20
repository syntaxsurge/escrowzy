import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobPostings, jobTasks } from '@/lib/db/schema'
import { getUser } from '@/services/user'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId: taskIdParam } = await params
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = parseInt(id)
    const taskId = parseInt(taskIdParam)
    const body = await request.json()

    // Verify access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.clientId !== user.id && job.freelancerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the task
    const task = await db.query.jobTasks.findFirst({
      where: eq(jobTasks.id, taskId)
    })

    if (!task || task.jobId !== jobId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update task
    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.status !== undefined) updateData.status = body.status
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined)
      updateData.description = body.description
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo
    if (body.dueDate !== undefined)
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.estimatedHours !== undefined)
      updateData.estimatedHours = body.estimatedHours
    if (body.actualHours !== undefined)
      updateData.actualHours = body.actualHours
    if (body.position !== undefined) updateData.position = body.position
    if (body.tags !== undefined) updateData.tags = body.tags

    // If task is marked as done, set completedAt
    if (body.status === 'done' && task.status !== 'done') {
      updateData.completedAt = new Date()
    }

    const [updatedTask] = await db
      .update(jobTasks)
      .set(updateData)
      .where(eq(jobTasks.id, taskId))
      .returning()

    return NextResponse.json({
      task: updatedTask,
      message: 'Task updated successfully'
    })
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId: taskIdParam } = await params
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = parseInt(id)
    const taskId = parseInt(taskIdParam)

    // Verify access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.clientId !== user.id && job.freelancerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the task
    const task = await db.query.jobTasks.findFirst({
      where: eq(jobTasks.id, taskId)
    })

    if (!task || task.jobId !== jobId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Delete task
    await db.delete(jobTasks).where(eq(jobTasks.id, taskId))

    return NextResponse.json({
      message: 'Task deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
