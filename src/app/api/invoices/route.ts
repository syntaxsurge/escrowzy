import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import { invoices, jobMilestones, jobPostings, users } from '@/lib/db/schema'
import { getUser } from '@/services/user'

const createInvoiceSchema = z.object({
  jobId: z.number(),
  milestoneId: z.number().optional(),
  amount: z.string(),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  items: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        rate: z.string(),
        amount: z.string()
      })
    )
    .optional()
})

// GET /api/invoices - Get user's invoices
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
    const role = searchParams.get('role') // 'freelancer' or 'client'
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query conditions
    const conditions = []

    if (role === 'freelancer') {
      conditions.push(eq(invoices.freelancerId, user.id))
    } else if (role === 'client') {
      conditions.push(eq(invoices.clientId, user.id))
    } else {
      // Get all invoices where user is either freelancer or client
      conditions.push(eq(invoices.freelancerId, user.id))
    }

    if (status) {
      conditions.push(eq(invoices.status, status))
    }

    // Fetch invoices with related data
    const userInvoices = await db
      .select({
        invoice: invoices,
        job: {
          id: jobPostings.id,
          title: jobPostings.title
        },
        milestone: {
          id: jobMilestones.id,
          title: jobMilestones.title
        },
        client: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        freelancer: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(invoices)
      .leftJoin(jobPostings, eq(invoices.jobId, jobPostings.id))
      .leftJoin(jobMilestones, eq(invoices.milestoneId, jobMilestones.id))
      .leftJoin(users, eq(invoices.clientId, users.id))
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      success: true,
      invoices: userInvoices,
      hasMore: userInvoices.length === limit
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create a new invoice
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
    const validatedData = createInvoiceSchema.parse(body)

    // Get job details to verify access
    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, validatedData.jobId))
      .limit(1)

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Only freelancer can create invoices
    if (job.freelancerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only the assigned freelancer can create invoices'
        },
        { status: 403 }
      )
    }

    // Generate invoice number
    const invoiceCount = await db
      .select()
      .from(invoices)
      .where(eq(invoices.freelancerId, user.id))

    const invoiceNumber = `INV-${user.id}-${(invoiceCount.length + 1).toString().padStart(5, '0')}`

    // Create the invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        jobId: validatedData.jobId,
        milestoneId: validatedData.milestoneId,
        freelancerId: user.id,
        clientId: job.clientId,
        amount: validatedData.amount,
        currency: 'ETH',
        status: 'draft',
        description: validatedData.description,
        dueDate: new Date(validatedData.dueDate),
        items: validatedData.items || [],
        tax: '0',
        discount: '0',
        total: validatedData.amount
      })
      .returning()

    return NextResponse.json({
      success: true,
      invoice
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
