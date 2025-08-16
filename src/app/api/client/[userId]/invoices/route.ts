import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, gte, lte } from 'drizzle-orm'

import { withAuth } from '@/lib/api/auth-middleware'
import { db } from '@/lib/db/drizzle'
import { jobBids, jobMilestones, jobPostings, users } from '@/lib/db/schema'

interface Invoice {
  id: string
  jobId: number
  jobTitle: string
  freelancerId: number
  freelancerName: string
  milestoneId: number
  milestoneTitle: string
  amount: number
  platformFee: number
  netAmount: number
  status: 'pending' | 'paid' | 'overdue'
  issueDate: Date
  dueDate: Date
  paidDate: Date | null
}

export const GET = withAuth(
  async (
    request: NextRequest,
    context: { session: any; params?: { userId: string } }
  ) => {
    try {
      const clientId = parseInt(context.params?.userId || '0')
      const { searchParams } = new URL(request.url)

      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      const status = searchParams.get('status')

      // Build query conditions
      const conditions = [eq(jobPostings.clientId, clientId)]

      if (startDate) {
        conditions.push(gte(jobMilestones.createdAt, new Date(startDate)))
      }
      if (endDate) {
        conditions.push(lte(jobMilestones.createdAt, new Date(endDate)))
      }
      if (status && status !== 'all') {
        conditions.push(eq(jobMilestones.status, status as any))
      }

      // Get invoice data from approved milestones
      const invoiceData = await db
        .select({
          milestone: jobMilestones,
          job: jobPostings,
          freelancer: users,
          bid: jobBids
        })
        .from(jobMilestones)
        .innerJoin(jobPostings, eq(jobPostings.id, jobMilestones.jobId))
        .innerJoin(
          jobBids,
          and(eq(jobBids.jobId, jobPostings.id), eq(jobBids.status, 'accepted'))
        )
        .innerJoin(users, eq(users.id, jobBids.freelancerId))
        .where(and(...conditions))
        .orderBy(desc(jobMilestones.createdAt))

      // Format as invoices
      const invoices: Invoice[] = invoiceData.map(
        ({ milestone, job, freelancer, bid }) => {
          const amount = parseFloat(milestone.amount)
          const platformFee = amount * 0.1 // 10% platform fee
          const netAmount = amount - platformFee

          const issueDate = milestone.createdAt
          const dueDate = new Date(issueDate)
          dueDate.setDate(dueDate.getDate() + 30) // 30 day payment terms

          let invoiceStatus: 'pending' | 'paid' | 'overdue' = 'pending'
          if (milestone.status === 'approved') {
            invoiceStatus = 'paid'
          } else if (new Date() > dueDate) {
            invoiceStatus = 'overdue'
          }

          return {
            id: `INV-${job.id}-${milestone.id}`,
            jobId: job.id,
            jobTitle: job.title,
            freelancerId: freelancer.id,
            freelancerName: freelancer.name || 'Unknown',
            milestoneId: milestone.id,
            milestoneTitle: milestone.title,
            amount,
            platformFee,
            netAmount,
            status: invoiceStatus,
            issueDate,
            dueDate,
            paidDate:
              milestone.status === 'approved' ? milestone.updatedAt : null
          }
        }
      )

      // Calculate summary statistics
      const summary = {
        totalInvoices: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
        totalPaid: invoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0),
        totalPending: invoices
          .filter(inv => inv.status === 'pending')
          .reduce((sum, inv) => sum + inv.amount, 0),
        totalOverdue: invoices
          .filter(inv => inv.status === 'overdue')
          .reduce((sum, inv) => sum + inv.amount, 0),
        platformFees: invoices.reduce((sum, inv) => sum + inv.platformFee, 0)
      }

      return NextResponse.json({
        success: true,
        data: {
          invoices,
          summary
        }
      })
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch invoice data'
        },
        { status: 500 }
      )
    }
  }
)

export const POST = withAuth(
  async (
    request: NextRequest,
    context: { session: any; params?: { userId: string } }
  ) => {
    try {
      const clientId = parseInt(context.params?.userId || '0')
      const body = await request.json()
      const { action, invoiceId } = body

      if (action === 'download') {
        // Generate PDF invoice
        const [jobId, milestoneId] = invoiceId
          .replace('INV-', '')
          .split('-')
          .map(Number)

        // Get invoice details
        const invoiceDetails = await db
          .select({
            milestone: jobMilestones,
            job: jobPostings,
            freelancer: users,
            bid: jobBids
          })
          .from(jobMilestones)
          .innerJoin(jobPostings, eq(jobPostings.id, milestoneId))
          .innerJoin(
            jobBids,
            and(
              eq(jobBids.jobId, jobPostings.id),
              eq(jobBids.status, 'accepted')
            )
          )
          .innerJoin(users, eq(users.id, jobBids.freelancerId))
          .where(
            and(
              eq(jobMilestones.id, milestoneId),
              eq(jobPostings.clientId, clientId)
            )
          )
          .limit(1)

        if (!invoiceDetails.length) {
          return NextResponse.json(
            { success: false, error: 'Invoice not found' },
            { status: 404 }
          )
        }

        // Generate download URL (would integrate with PDF generation service)
        const downloadUrl = `/api/invoices/${invoiceId}/download`

        return NextResponse.json({
          success: true,
          data: { downloadUrl }
        })
      }

      if (action === 'markPaid') {
        const [jobId, milestoneId] = invoiceId
          .replace('INV-', '')
          .split('-')
          .map(Number)

        await db
          .update(jobMilestones)
          .set({
            status: 'approved',
            updatedAt: new Date()
          })
          .where(eq(jobMilestones.id, milestoneId))

        return NextResponse.json({
          success: true,
          message: 'Invoice marked as paid'
        })
      }

      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    } catch (error) {
      console.error('Failed to process invoice action:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process invoice'
        },
        { status: 500 }
      )
    }
  }
)
