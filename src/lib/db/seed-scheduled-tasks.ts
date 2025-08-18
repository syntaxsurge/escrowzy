import { db } from './drizzle'
import { scheduledTasks } from './schema'

export async function seedScheduledTasks() {
  console.log('🌱 Seeding scheduled tasks...')

  const tasksData = [
    {
      name: 'milestone-auto-release',
      description:
        'Automatically releases approved milestones after grace period',
      taskType: 'cron',
      schedule: '0 * * * *', // Every hour
      endpoint: '/api/cron/milestone-auto-release',
      isActive: true,
      metadata: {
        gracePeriodHours: 72,
        notificationEnabled: true
      }
    },
    {
      name: 'payment-reminders',
      description: 'Sends automated payment reminders for overdue invoices',
      taskType: 'cron',
      schedule: '0 9 * * *', // Daily at 9 AM
      endpoint: '/api/payment-reminders',
      isActive: true,
      metadata: {
        reminderDays: [3, 7, 14],
        maxReminders: 3
      }
    },
    {
      name: 'tax-document-generation',
      description: 'Generates quarterly tax documents for freelancers',
      taskType: 'cron',
      schedule: '0 0 1 */3 *', // Quarterly on the 1st
      endpoint: '/api/tax-documents/generate',
      isActive: true,
      metadata: {
        documentTypes: ['1099', 'W9'],
        quarters: [1, 2, 3, 4]
      }
    },
    {
      name: 'milestone-overdue-check',
      description: 'Checks for overdue milestones and sends notifications',
      taskType: 'cron',
      schedule: '0 0 * * *', // Daily at midnight
      endpoint: '/api/cron/milestone-overdue',
      isActive: true,
      metadata: {
        warningDays: 2,
        escalationEnabled: true
      }
    },
    {
      name: 'cleanup-sessions',
      description: 'Cleans up expired user sessions',
      taskType: 'cron',
      schedule: '0 */6 * * *', // Every 6 hours
      endpoint: '/api/cron/cleanup-sessions',
      isActive: true,
      metadata: {
        maxSessionAge: 30, // days
        batchSize: 100
      }
    },
    {
      name: 'cleanup-invitations',
      description: 'Removes expired job invitations',
      taskType: 'cron',
      schedule: '0 2 * * *', // Daily at 2 AM
      endpoint: '/api/cron/cleanup-invitations',
      isActive: true,
      metadata: {
        expirationDays: 7
      }
    },
    {
      name: 'subscription-check',
      description: 'Checks and updates subscription statuses',
      taskType: 'cron',
      schedule: '0 0 * * *', // Daily at midnight
      endpoint: '/api/cron/subscription-check',
      isActive: true,
      metadata: {
        checkOnChain: true,
        sendExpiryWarnings: true
      }
    },
    {
      name: 'sync-transactions',
      description: 'Syncs blockchain transactions with database',
      taskType: 'cron',
      schedule: '*/15 * * * *', // Every 15 minutes
      endpoint: '/api/cron/sync-transactions',
      isActive: true,
      metadata: {
        chains: ['1', '56', '137'],
        confirmations: 12
      }
    },
    {
      name: 'update-expired-trades',
      description: 'Updates status of expired trades',
      taskType: 'cron',
      schedule: '0 */2 * * *', // Every 2 hours
      endpoint: '/api/cron/update-expired-trades',
      isActive: true,
      metadata: {
        autoCancel: false,
        notifyParties: true
      }
    },
    {
      name: 'referral-payout',
      description: 'Processes referral commission payouts',
      taskType: 'cron',
      schedule: '0 0 1 * *', // Monthly on the 1st
      endpoint: '/api/cron/referral-payout',
      isActive: true,
      metadata: {
        minPayoutAmount: 50,
        payoutMethods: ['crypto', 'bank']
      }
    },
    {
      name: 'partner-commission-calc',
      description: 'Calculates partner commissions for the period',
      taskType: 'cron',
      schedule: '0 0 * * 0', // Weekly on Sunday
      endpoint: '/api/cron/partner-commissions',
      isActive: true,
      metadata: {
        includePending: false,
        notifyPartners: true
      }
    },
    {
      name: 'backup-database',
      description: 'Creates automated database backups',
      taskType: 'cron',
      schedule: '0 3 * * *', // Daily at 3 AM
      endpoint: '/api/cron/backup',
      isActive: false, // Disabled by default
      metadata: {
        retention: 30, // days
        compression: true
      }
    }
  ]

  const insertedTasks = await db
    .insert(scheduledTasks)
    .values(tasksData)
    .onConflictDoNothing()
    .returning()

  console.log(`✅ Inserted ${insertedTasks.length} scheduled tasks`)

  // Update next run times based on cron expressions
  for (const task of insertedTasks) {
    if (task.schedule) {
      // Calculate next run time from cron expression
      // For now, we'll set a placeholder
      const nextRun = new Date()
      nextRun.setHours(nextRun.getHours() + 1)

      await db
        .update(scheduledTasks)
        .set({ nextRunAt: nextRun })
        .where({ id: task.id })
    }
  }

  return insertedTasks
}
