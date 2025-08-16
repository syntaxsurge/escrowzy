import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import {
  invoices,
  jobMilestones,
  jobPostings,
  paymentReminders,
  users
} from '@/lib/db/schema'
import { sendEmail } from '@/lib/email'
import { pusherServer } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

const createReminderSchema = z.object({
  invoiceId: z.number().optional(),
  milestoneId: z.number().optional(),
  reminderType: z.enum(['invoice', 'milestone', 'custom']),
  message: z.string().optional(),
  scheduledFor: z.string().datetime().optional()
})

// GET /api/payment-reminders - Get payment reminders
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
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Build query conditions - get reminders where user is recipient
    const conditions = [eq(paymentReminders.recipientId, user.id)]

    if (status) {
      conditions.push(eq(paymentReminders.status, status))
    }

    if (type) {
      conditions.push(eq(paymentReminders.reminderType, type))
    }

    // Fetch reminders
    const reminders = await db
      .select()
      .from(paymentReminders)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(paymentReminders.createdAt))

    return NextResponse.json({
      success: true,
      reminders
    })
  } catch (error) {
    console.error('Error fetching payment reminders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment reminders' },
      { status: 500 }
    )
  }
}

// POST /api/payment-reminders - Create payment reminder
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
    const validatedData = createReminderSchema.parse(body)

    let clientId: number | null = null
    let defaultMessage = ''

    // Validate and get client based on reminder type
    if (validatedData.reminderType === 'invoice' && validatedData.invoiceId) {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, validatedData.invoiceId))
        .limit(1)

      if (!invoice) {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        )
      }

      if (invoice.freelancerId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }

      clientId = invoice.clientId
      defaultMessage = `Reminder: Invoice ${invoice.invoiceNumber} is due on ${new Date(invoice.dueDate).toLocaleDateString()}`
    } else if (
      validatedData.reminderType === 'milestone' &&
      validatedData.milestoneId
    ) {
      const [milestone] = await db
        .select({
          milestone: jobMilestones,
          clientId: jobPostings.clientId
        })
        .from(jobMilestones)
        .innerJoin(jobPostings, eq(jobMilestones.jobId, jobPostings.id))
        .where(eq(jobMilestones.id, validatedData.milestoneId))
        .limit(1)

      if (!milestone) {
        return NextResponse.json(
          { success: false, error: 'Milestone not found' },
          { status: 404 }
        )
      }

      // Check if user is either the client or the freelancer for this milestone's job
      const [job] = await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, milestone.milestone.jobId))
        .limit(1)

      if (milestone.clientId !== user.id && job?.freelancerId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }

      clientId = milestone.clientId
      defaultMessage = `Reminder: Milestone "${milestone.milestone.title}" is pending review`
    }

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 400 }
      )
    }

    // Create reminder
    const [reminder] = await db
      .insert(paymentReminders)
      .values({
        invoiceId: validatedData.invoiceId || 0, // Use 0 as placeholder if no invoice
        recipientId: clientId,
        reminderType: validatedData.reminderType,
        status: 'scheduled',
        scheduledFor: validatedData.scheduledFor
          ? new Date(validatedData.scheduledFor)
          : new Date(),
        metadata: {
          milestoneId: validatedData.milestoneId,
          message: validatedData.message || defaultMessage,
          senderId: user.id
        }
      })
      .returning()

    // Send immediate reminder if not scheduled for future
    if (
      !validatedData.scheduledFor ||
      new Date(validatedData.scheduledFor) <= new Date()
    ) {
      // Get client details
      const [client] = await db
        .select()
        .from(users)
        .where(eq(users.id, clientId))
        .limit(1)

      if (client?.email) {
        // Send email reminder
        await sendEmail({
          to: client.email,
          subject: 'Payment Reminder from ' + (user.name || user.email),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Payment Reminder</h2>
              <p>Hi ${client.name || 'there'},</p>
              <p>${validatedData.message || defaultMessage}</p>
              
              <p style="margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Details
                </a>
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This reminder was sent through Escrowzy - Secure Freelancer Marketplace
              </p>
            </div>
          `
        })

        // Update reminder status
        await db
          .update(paymentReminders)
          .set({
            status: 'sent',
            sentAt: new Date()
          })
          .where(eq(paymentReminders.id, reminder.id))
      }

      // Send real-time notification
      if (pusherServer) {
        await pusherServer.trigger(`user-${clientId}`, 'payment-reminder', {
          reminderId: reminder.id,
          type: validatedData.reminderType,
          message: validatedData.message || defaultMessage,
          freelancerName: user.name || user.email
        })
      }
    }

    return NextResponse.json({
      success: true,
      reminder,
      message: 'Payment reminder created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating payment reminder:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment reminder' },
      { status: 500 }
    )
  }
}

// POST /api/payment-reminders/auto - Auto-send overdue reminders (cron job)
export async function PUT(request: NextRequest) {
  try {
    // This endpoint would be called by a cron job
    // Check for API key or admin authentication
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find overdue invoices
    const overdueInvoices = await db
      .select({
        invoice: invoices,
        client: users,
        freelancer: users
      })
      .from(invoices)
      .leftJoin(users, eq(invoices.clientId, users.id))
      .where(
        and(eq(invoices.status, 'sent'), lte(invoices.dueDate, new Date()))
      )

    let remindersSent = 0

    for (const record of overdueInvoices) {
      if (!record.client?.email) continue

      // Check if reminder was already sent today
      const [existingReminder] = await db
        .select()
        .from(paymentReminders)
        .where(
          and(
            eq(paymentReminders.invoiceId, record.invoice.id),
            gte(
              paymentReminders.sentAt,
              new Date(new Date().setHours(0, 0, 0, 0))
            )
          )
        )
        .limit(1)

      if (existingReminder) continue

      // Create and send reminder
      await db.insert(paymentReminders).values({
        invoiceId: record.invoice.id,
        recipientId: record.invoice.clientId,
        reminderType: 'overdue',
        status: 'sent',
        sentAt: new Date(),
        scheduledFor: new Date(),
        metadata: {
          message: `Invoice ${record.invoice.invoiceNumber} is overdue. Please make payment as soon as possible.`,
          senderId: record.invoice.freelancerId
        }
      })

      // Send email
      await sendEmail({
        to: record.client.email,
        subject: `Overdue Invoice Reminder: ${record.invoice.invoiceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Overdue Invoice Reminder</h2>
            <p>Hi ${record.client.name || 'there'},</p>
            <p>This is a reminder that invoice ${record.invoice.invoiceNumber} is now overdue.</p>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Invoice Number:</strong> ${record.invoice.invoiceNumber}</p>
              <p><strong>Amount Due:</strong> ${record.invoice.amount} ${record.invoice.currency}</p>
              <p><strong>Due Date:</strong> ${new Date(record.invoice.dueDate).toLocaleDateString()}</p>
            </div>
            
            <p>Please make payment as soon as possible to avoid any service interruption.</p>
            
            <p style="margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoices/${record.invoice.invoiceNumber}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Pay Now
              </a>
            </p>
          </div>
        `
      })

      remindersSent++
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      message: `Sent ${remindersSent} overdue payment reminders`
    })
  } catch (error) {
    console.error('Error sending auto reminders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send auto reminders' },
      { status: 500 }
    )
  }
}
