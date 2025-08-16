import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { invoices, users } from '@/lib/db/schema'
import { sendEmail } from '@/lib/email'
import { pusherServer } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

// POST /api/invoices/[id]/send - Send invoice to client
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const invoiceId = parseInt(params.id)
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid invoice ID' },
        { status: 400 }
      )
    }

    // Get invoice details
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1)

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Only freelancer can send their invoice
    if (invoice.freelancerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only invoice owner can send' },
        { status: 403 }
      )
    }

    // Can't send if already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Invoice is already paid' },
        { status: 400 }
      )
    }

    // Get client details
    const [client] = await db
      .select()
      .from(users)
      .where(eq(users.id, invoice.clientId))
      .limit(1)

    if (!client || !client.email) {
      return NextResponse.json(
        { success: false, error: 'Client email not found' },
        { status: 400 }
      )
    }

    // Update invoice status to sent
    await db
      .update(invoices)
      .set({
        status: 'sent',
        sentAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId))

    // Generate invoice URL (in production, this would be a public URL)
    const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.invoiceNumber}`

    // Send email to client
    await sendEmail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${user.name || user.email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Invoice</h2>
          <p>Hi ${client.name || 'there'},</p>
          <p>You have received a new invoice from ${user.name || user.email}.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Amount:</strong> ${invoice.amount} ${invoice.currency}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            ${invoice.description ? `<p><strong>Description:</strong> ${invoice.description}</p>` : ''}
          </div>
          
          <p>
            <a href="${invoiceUrl}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Invoice
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This invoice was sent through Escrowzy - Secure Freelancer Marketplace
          </p>
        </div>
      `
    })

    // Send real-time notification
    if (pusherServer) {
      await pusherServer.trigger(
        `user-${invoice.clientId}`,
        'invoice-received',
        {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          currency: invoice.currency,
          freelancerName: user.name || user.email,
          dueDate: invoice.dueDate
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully'
    })
  } catch (error) {
    console.error('Error sending invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
