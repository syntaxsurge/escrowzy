import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import { invoices, jobMilestones, jobPostings, users } from '@/lib/db/schema'
import { pusherServer } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

const updateInvoiceSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  amount: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  items: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        rate: z.string(),
        amount: z.string()
      })
    )
    .optional(),
  tax: z.string().optional(),
  discount: z.string().optional()
})

// GET /api/invoices/[id] - Get specific invoice
export async function GET(
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

    // Get invoice with related data
    const [invoiceData] = await db
      .select({
        invoice: invoices,
        job: jobPostings,
        milestone: jobMilestones,
        client: users,
        freelancer: users
      })
      .from(invoices)
      .leftJoin(jobPostings, eq(invoices.jobId, jobPostings.id))
      .leftJoin(jobMilestones, eq(invoices.milestoneId, jobMilestones.id))
      .where(eq(invoices.id, invoiceId))
      .limit(1)

    if (!invoiceData) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check access - user must be either client or freelancer
    if (
      invoiceData.invoice.clientId !== user.id &&
      invoiceData.invoice.freelancerId !== user.id
    ) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get client and freelancer details separately
    const [clientData] = await db
      .select()
      .from(users)
      .where(eq(users.id, invoiceData.invoice.clientId))
      .limit(1)

    const [freelancerData] = await db
      .select()
      .from(users)
      .where(eq(users.id, invoiceData.invoice.freelancerId))
      .limit(1)

    return NextResponse.json({
      success: true,
      invoice: {
        ...invoiceData.invoice,
        job: invoiceData.job,
        milestone: invoiceData.milestone,
        client: clientData,
        freelancer: freelancerData
      }
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PATCH /api/invoices/[id] - Update invoice
export async function PATCH(
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

    // Get invoice to check ownership
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateInvoiceSchema.parse(body)

    // Check permissions
    if (validatedData.status === 'paid') {
      // Only client can mark as paid
      if (invoice.clientId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Only client can mark invoice as paid' },
          { status: 403 }
        )
      }
    } else {
      // Only freelancer can edit other fields
      if (invoice.freelancerId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Only freelancer can edit invoice' },
          { status: 403 }
        )
      }

      // Can't edit if already paid
      if (invoice.status === 'paid') {
        return NextResponse.json(
          { success: false, error: 'Cannot edit paid invoice' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (validatedData.status) {
      updateData.status = validatedData.status
      if (validatedData.status === 'sent') {
        updateData.sentAt = new Date()
      } else if (validatedData.status === 'paid') {
        updateData.paidAt = new Date()
      }
    }

    if (validatedData.amount) updateData.amount = validatedData.amount
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description
    if (validatedData.dueDate)
      updateData.dueDate = new Date(validatedData.dueDate)
    if (validatedData.items) updateData.items = validatedData.items
    if (validatedData.tax) updateData.tax = validatedData.tax
    if (validatedData.discount) updateData.discount = validatedData.discount

    // Calculate total if amount, tax, or discount changed
    if (validatedData.amount || validatedData.tax || validatedData.discount) {
      const amount = parseFloat(validatedData.amount || invoice.amount)
      const tax = parseFloat(validatedData.tax || invoice.tax || '0')
      const discount = parseFloat(
        validatedData.discount || invoice.discount || '0'
      )
      updateData.total = (amount + tax - discount).toString()
    }

    // Update the invoice
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, invoiceId))
      .returning()

    // Send notifications for status changes
    if (validatedData.status && pusherServer) {
      const recipientId =
        invoice.freelancerId === user.id
          ? invoice.clientId
          : invoice.freelancerId

      await pusherServer.trigger(`user-${recipientId}`, 'invoice-updated', {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        status: validatedData.status,
        updatedBy: user.name || user.email
      })
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
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

    // Get invoice to check ownership
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

    // Only freelancer can delete their own invoices
    if (invoice.freelancerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only invoice owner can delete' },
        { status: 403 }
      )
    }

    // Can't delete paid invoices
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete paid invoice' },
        { status: 400 }
      )
    }

    // Delete the invoice
    await db.delete(invoices).where(eq(invoices.id, invoiceId))

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
