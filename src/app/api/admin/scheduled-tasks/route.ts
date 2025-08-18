import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, gte, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { scheduledTaskRuns, scheduledTasks } from '@/lib/db/schema'
import { getUser } from '@/services/user'

// GET /api/admin/scheduled-tasks - Get all scheduled tasks with their status
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all scheduled tasks
    const tasks = await db
      .select({
        id: scheduledTasks.id,
        name: scheduledTasks.name,
        description: scheduledTasks.description,
        schedule: scheduledTasks.schedule,
        lastRunAt: scheduledTasks.lastRunAt,
        nextRunAt: scheduledTasks.nextRunAt,
        status: scheduledTasks.isActive,
        successCount: scheduledTasks.successCount,
        errorCount: scheduledTasks.errorCount,
        averageRunTime: scheduledTasks.averageRunTime,
        taskType: scheduledTasks.taskType,
        endpoint: scheduledTasks.endpoint,
        metadata: scheduledTasks.metadata
      })
      .from(scheduledTasks)
      .orderBy(scheduledTasks.name)

    // Get recent runs for each task
    const taskIds = tasks.map(t => t.id)
    const recentRuns = await db
      .select({
        taskId: scheduledTaskRuns.taskId,
        status: scheduledTaskRuns.status,
        startedAt: scheduledTaskRuns.startedAt,
        completedAt: scheduledTaskRuns.completedAt,
        runTime: scheduledTaskRuns.runTime,
        error: scheduledTaskRuns.error
      })
      .from(scheduledTaskRuns)
      .where(
        and(
          sql`${scheduledTaskRuns.taskId} IN ${sql.raw(`(${taskIds.join(',')})`)}`,
          gte(
            scheduledTaskRuns.startedAt,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
        )
      )
      .orderBy(desc(scheduledTaskRuns.startedAt))
      .limit(100)

    // Group runs by task
    const runsByTask = new Map<number, any[]>()
    for (const run of recentRuns) {
      if (!runsByTask.has(run.taskId)) {
        runsByTask.set(run.taskId, [])
      }
      runsByTask.get(run.taskId)?.push(run)
    }

    // Format response
    const formattedTasks = tasks.map(task => ({
      id: task.id.toString(),
      name: task.name,
      description: task.description,
      schedule: task.schedule,
      lastRun: task.lastRunAt?.toISOString(),
      nextRun: task.nextRunAt?.toISOString(),
      status: task.status ? 'active' : 'paused',
      successCount: task.successCount,
      errorCount: task.errorCount,
      averageRunTime: task.averageRunTime,
      recentRuns: runsByTask.get(task.id) || []
    }))

    return NextResponse.json(formattedTasks)
  } catch (error) {
    console.error('Failed to fetch scheduled tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled tasks' },
      { status: 500 }
    )
  }
}

// POST /api/admin/scheduled-tasks/:id/run - Manually trigger a scheduled task
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Get task details
    const task = await db
      .select()
      .from(scheduledTasks)
      .where(eq(scheduledTasks.id, parseInt(taskId)))
      .limit(1)

    if (!task.length) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    const taskData = task[0]

    // Create a run record
    const [runRecord] = await db
      .insert(scheduledTaskRuns)
      .values({
        taskId: taskData.id,
        status: 'running',
        startedAt: new Date(),
        metadata: { triggeredBy: user.id, manual: true }
      })
      .returning()

    try {
      // Execute the task endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}${taskData.endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.CRON_API_KEY || ''
          }
        }
      )

      const result = await response.json()
      const endTime = new Date()
      const runTime = endTime.getTime() - runRecord.startedAt.getTime()

      // Update run record
      await db
        .update(scheduledTaskRuns)
        .set({
          status: response.ok ? 'success' : 'failed',
          completedAt: endTime,
          runTime,
          output: JSON.stringify(result),
          error: !response.ok ? result.error : null
        })
        .where(eq(scheduledTaskRuns.id, runRecord.id))

      // Update task statistics
      if (response.ok) {
        await db
          .update(scheduledTasks)
          .set({
            lastRunAt: runRecord.startedAt,
            successCount: sql`${scheduledTasks.successCount} + 1`,
            averageRunTime: sql`(${scheduledTasks.averageRunTime} * ${scheduledTasks.successCount} + ${runTime}) / (${scheduledTasks.successCount} + 1)`
          })
          .where(eq(scheduledTasks.id, taskData.id))
      } else {
        await db
          .update(scheduledTasks)
          .set({
            lastRunAt: runRecord.startedAt,
            errorCount: sql`${scheduledTasks.errorCount} + 1`
          })
          .where(eq(scheduledTasks.id, taskData.id))
      }

      return NextResponse.json({
        success: response.ok,
        message: response.ok
          ? 'Task executed successfully'
          : 'Task execution failed',
        result,
        runId: runRecord.id,
        runTime
      })
    } catch (error) {
      // Update run record with error
      await db
        .update(scheduledTaskRuns)
        .set({
          status: 'failed',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        .where(eq(scheduledTaskRuns.id, runRecord.id))

      // Update error count
      await db
        .update(scheduledTasks)
        .set({
          lastRunAt: runRecord.startedAt,
          errorCount: sql`${scheduledTasks.errorCount} + 1`
        })
        .where(eq(scheduledTasks.id, taskData.id))

      throw error
    }
  } catch (error) {
    console.error('Failed to run scheduled task:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run scheduled task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/scheduled-tasks/:id - Update task status (enable/disable)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { taskId, isActive } = body

    if (!taskId || isActive === undefined) {
      return NextResponse.json(
        { success: false, error: 'Task ID and isActive status are required' },
        { status: 400 }
      )
    }

    await db
      .update(scheduledTasks)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(eq(scheduledTasks.id, parseInt(taskId)))

    return NextResponse.json({
      success: true,
      message: `Task ${isActive ? 'enabled' : 'disabled'} successfully`
    })
  } catch (error) {
    console.error('Failed to update scheduled task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update scheduled task' },
      { status: 500 }
    )
  }
}
