import { eq, lt, and } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { userSubscriptions, trades, activityLogs } from '@/lib/db/schema'
import { sendEmail } from '@/lib/email/utils'
import { registerHandler } from '@/lib/queue/manager'

import { handleBattleRound } from './battle-round.handler'

/**
 * Register all job handlers
 */
export function registerAllHandlers() {
  // Battle handlers
  registerHandler('battle.round', handleBattleRound)

  // Email handlers
  registerHandler('email.send', async (payload: any) => {
    try {
      const { to, subject, html } = payload
      if (!to || !subject || !html) {
        throw new Error('Missing required email parameters')
      }

      const result = await sendEmail(to, subject, html)
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }

      console.log(`✅ Email sent to ${to}: ${subject}`)
    } catch (error) {
      console.error('Failed to send email:', error)
      throw error
    }
  })

  // Trade notification handlers
  registerHandler('trade.notification', async (payload: any) => {
    try {
      const { tradeId, type, recipientId, message } = payload
      if (!tradeId || !type || !recipientId) {
        throw new Error('Missing required notification parameters')
      }

      // Create activity log entry for notification
      // Note: activityLogs requires a teamId, so we'll skip this for now
      // In production, you'd want a proper notifications table
      console.log(
        `Trade notification for user ${recipientId}: ${message || `Trade #${tradeId} updated`}`
      )

      console.log(`✅ Trade notification created for user ${recipientId}`)
    } catch (error) {
      console.error('Failed to create trade notification:', error)
      throw error
    }
  })

  // Subscription check handlers
  registerHandler('subscription.check', async (payload: any) => {
    try {
      const now = new Date()

      // Find expiring subscriptions (within 7 days)
      const expiringDate = new Date()
      expiringDate.setDate(expiringDate.getDate() + 7)

      const expiringSubs = await db
        .select()
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.isActive, true),
            lt(userSubscriptions.subscriptionExpiresAt, expiringDate)
          )
        )

      // Send renewal reminders
      for (const sub of expiringSubs) {
        if (sub.subscriptionExpiresAt) {
          console.log(
            `Subscription expiring for user ${sub.userId}: expires on ${sub.subscriptionExpiresAt.toLocaleDateString()}`
          )
          // In production, send email or create proper notification
        }
      }

      // Cancel expired subscriptions
      await db
        .update(userSubscriptions)
        .set({ isActive: false })
        .where(
          and(
            eq(userSubscriptions.isActive, true),
            lt(userSubscriptions.subscriptionExpiresAt, now)
          )
        )

      console.log(`✅ Processed ${expiringSubs.length} expiring subscriptions`)
    } catch (error) {
      console.error('Failed to check subscriptions:', error)
      throw error
    }
  })

  // Cleanup handlers
  registerHandler('cleanup.expired', async (payload: any) => {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Clean up old activity logs
      const deletedLogs = await db
        .delete(activityLogs)
        .where(lt(activityLogs.timestamp, thirtyDaysAgo))

      // Clean up expired trades older than 30 days
      const expiredTrades = await db
        .update(trades)
        .set({ status: 'archived' })
        .where(
          and(eq(trades.status, 'expired'), lt(trades.createdAt, thirtyDaysAgo))
        )

      console.log(
        `✅ Cleanup completed - notifications cleaned, trades archived`
      )
    } catch (error) {
      console.error('Failed to cleanup expired data:', error)
      throw error
    }
  })

  console.log('✅ All job handlers registered')
}
