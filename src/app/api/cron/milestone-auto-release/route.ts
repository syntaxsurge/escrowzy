import { NextRequest, NextResponse } from 'next/server'

import { and, eq, lte, or } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { earnings, jobMilestones, jobPostings } from '@/lib/db/schema'
import { pusherServer } from '@/lib/pusher-server'

// POST /api/cron/milestone-auto-release - Auto-release approved milestones after grace period
export async function POST(request: NextRequest) {
  try {
    // Verify cron API key for security
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find milestones that should be auto-released
    // Auto-release after 72 hours of approval without client action
    const gracePeriodHours = 72
    const cutoffDate = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000)

    const milestonesToRelease = await db
      .select({
        milestone: jobMilestones,
        job: jobPostings
      })
      .from(jobMilestones)
      .innerJoin(jobPostings, eq(jobMilestones.jobId, jobPostings.id))
      .where(
        and(
          eq(jobMilestones.status, 'submitted'),
          lte(jobMilestones.submittedAt, cutoffDate),
          eq(jobMilestones.autoReleaseEnabled, true)
        )
      )

    let releasedCount = 0
    const errors: string[] = []

    for (const record of milestonesToRelease) {
      try {
        // Update milestone status to approved
        await db
          .update(jobMilestones)
          .set({
            status: 'approved',
            approvedAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              ...((record.milestone.metadata as any) || {}),
              autoReleased: true,
              autoReleaseDate: new Date().toISOString()
            }
          })
          .where(eq(jobMilestones.id, record.milestone.id))

        // Create earnings record for freelancer
        if (record.job.freelancerId) {
          await db.insert(earnings).values({
            freelancerId: record.job.freelancerId,
            jobId: record.job.id,
            milestoneId: record.milestone.id,
            amount: record.milestone.amount,
            netAmount: record.milestone.amount,
            currency: 'USD',
            status: 'completed',
            description: `Auto-released payment for milestone: ${record.milestone.title}`,
            metadata: {
              autoReleased: true,
              releaseDate: new Date().toISOString()
            }
          })

          // Send notification to freelancer
          if (pusherServer) {
            await pusherServer.trigger(
              `user-${record.job.freelancerId}`,
              'milestone-auto-released',
              {
                milestoneId: record.milestone.id,
                jobId: record.job.id,
                jobTitle: record.job.title,
                milestoneTitle: record.milestone.title,
                amount: record.milestone.amount,
                message:
                  'Your milestone payment has been automatically released after the grace period.'
              }
            )
          }
        }

        // Send notification to client
        if (pusherServer && record.job.clientId) {
          await pusherServer.trigger(
            `user-${record.job.clientId}`,
            'milestone-auto-released',
            {
              milestoneId: record.milestone.id,
              jobId: record.job.id,
              jobTitle: record.job.title,
              milestoneTitle: record.milestone.title,
              amount: record.milestone.amount,
              message:
                'Milestone payment has been automatically released after 72 hours.'
            }
          )
        }

        releasedCount++
      } catch (error) {
        console.error(
          `Failed to auto-release milestone ${record.milestone.id}:`,
          error
        )
        errors.push(`Milestone ${record.milestone.id}: ${error}`)
      }
    }

    // Check for milestones with expired deadlines that need attention
    const expiredMilestones = await db
      .select({
        milestone: jobMilestones,
        job: jobPostings
      })
      .from(jobMilestones)
      .innerJoin(jobPostings, eq(jobMilestones.jobId, jobPostings.id))
      .where(
        and(
          or(
            eq(jobMilestones.status, 'pending'),
            eq(jobMilestones.status, 'in_progress')
          ),
          lte(jobMilestones.dueDate, new Date())
        )
      )

    // Send reminders for expired milestones
    for (const record of expiredMilestones) {
      if (record.job.freelancerId && pusherServer) {
        await pusherServer.trigger(
          `user-${record.job.freelancerId}`,
          'milestone-overdue',
          {
            milestoneId: record.milestone.id,
            jobId: record.job.id,
            jobTitle: record.job.title,
            milestoneTitle: record.milestone.title,
            dueDate: record.milestone.dueDate,
            message:
              'This milestone is overdue. Please submit your work or request an extension.'
          }
        )
      }
    }

    return NextResponse.json({
      autoReleased: releasedCount,
      overdueNotifications: expiredMilestones.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Auto-released ${releasedCount} milestones, sent ${expiredMilestones.length} overdue notifications`
    })
  } catch (error) {
    console.error('Error in milestone auto-release cron:', error)
    return NextResponse.json(
      { error: 'Failed to process auto-releases' },
      { status: 500 }
    )
  }
}

// GET /api/cron/milestone-auto-release - Check auto-release status (for monitoring)
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gracePeriodHours = 72
    const cutoffDate = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000)

    // Count milestones pending auto-release
    const pendingAutoRelease = await db
      .select({ count: jobMilestones.id })
      .from(jobMilestones)
      .where(
        and(
          eq(jobMilestones.status, 'submitted'),
          lte(jobMilestones.submittedAt, cutoffDate),
          eq(jobMilestones.autoReleaseEnabled, true)
        )
      )

    // Count overdue milestones
    const overdueMilestones = await db
      .select({ count: jobMilestones.id })
      .from(jobMilestones)
      .where(
        and(
          or(
            eq(jobMilestones.status, 'pending'),
            eq(jobMilestones.status, 'in_progress')
          ),
          lte(jobMilestones.dueDate, new Date())
        )
      )

    return NextResponse.json({
      pendingAutoRelease: pendingAutoRelease.length,
      overdueMilestones: overdueMilestones.length,
      nextRunTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Next hour
    })
  } catch (error) {
    console.error('Error checking auto-release status:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
