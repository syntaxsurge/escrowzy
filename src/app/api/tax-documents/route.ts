import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import { earnings, jobPostings, taxDocuments, users } from '@/lib/db/schema'
import { getUser } from '@/services/user'

const generateTaxDocumentSchema = z.object({
  year: z.number().min(2020).max(new Date().getFullYear()),
  documentType: z.enum(['1099', 'w9', 'summary'])
})

// GET /api/tax-documents - Get user's tax documents
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
    const year = searchParams.get('year')
    const type = searchParams.get('type')

    // Build query conditions
    const conditions = [eq(taxDocuments.freelancerId, user.id)]

    if (year) {
      conditions.push(eq(taxDocuments.year, parseInt(year)))
    }

    if (type) {
      conditions.push(eq(taxDocuments.documentType, type))
    }

    // Fetch tax documents
    const documents = await db
      .select()
      .from(taxDocuments)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(taxDocuments.year), desc(taxDocuments.createdAt))

    return NextResponse.json({
      success: true,
      documents
    })
  } catch (error) {
    console.error('Error fetching tax documents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tax documents' },
      { status: 500 }
    )
  }
}

// POST /api/tax-documents - Generate tax document
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
    const validatedData = generateTaxDocumentSchema.parse(body)

    // Check if document already exists
    const [existing] = await db
      .select()
      .from(taxDocuments)
      .where(
        and(
          eq(taxDocuments.freelancerId, user.id),
          eq(taxDocuments.year, validatedData.year),
          eq(taxDocuments.documentType, validatedData.documentType)
        )
      )
      .limit(1)

    if (existing) {
      return NextResponse.json({
        success: true,
        document: existing,
        message: 'Document already exists'
      })
    }

    // Calculate earnings for the year
    const startDate = new Date(validatedData.year, 0, 1)
    const endDate = new Date(validatedData.year, 11, 31, 23, 59, 59)

    const [yearlyEarnings] = await db
      .select({
        totalEarnings: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`,
        totalTips: sql<string>`COALESCE(SUM(CAST(tip AS DECIMAL)), 0)`,
        transactionCount: sql<number>`COUNT(*)`
      })
      .from(earnings)
      .where(
        and(
          eq(earnings.freelancerId, user.id),
          eq(earnings.status, 'completed'),
          gte(earnings.createdAt, startDate),
          lte(earnings.createdAt, endDate)
        )
      )

    const totalAmount = parseFloat(yearlyEarnings?.totalEarnings || '0')
    const totalTips = parseFloat(yearlyEarnings?.totalTips || '0')
    const grandTotal = totalAmount + totalTips

    // Get earnings breakdown by client
    const clientBreakdown = await db
      .select({
        clientId: jobPostings.clientId,
        clientName: users.name,
        clientEmail: users.email,
        totalPaid: sql<string>`SUM(CAST(${earnings.amount} AS DECIMAL))`,
        jobCount: sql<number>`COUNT(DISTINCT ${earnings.jobId})`
      })
      .from(earnings)
      .innerJoin(jobPostings, eq(earnings.jobId, jobPostings.id))
      .leftJoin(users, eq(jobPostings.clientId, users.id))
      .where(
        and(
          eq(earnings.freelancerId, user.id),
          eq(earnings.status, 'completed'),
          gte(earnings.createdAt, startDate),
          lte(earnings.createdAt, endDate)
        )
      )
      .groupBy(jobPostings.clientId, users.name, users.email)
      .orderBy(sql`SUM(CAST(${earnings.amount} AS DECIMAL)) DESC`)

    // Generate document content based on type
    let documentContent: any = {
      year: validatedData.year,
      freelancerId: user.id,
      freelancerName: user.name || 'N/A',
      freelancerEmail: user.email,
      totalEarnings: grandTotal.toFixed(2),
      totalTips: totalTips.toFixed(2),
      transactionCount: yearlyEarnings?.transactionCount || 0,
      generatedAt: new Date().toISOString()
    }

    if (validatedData.documentType === '1099') {
      // Generate 1099-NEC content
      documentContent = {
        ...documentContent,
        formType: '1099-NEC',
        box1_nonemployeeCompensation: grandTotal.toFixed(2),
        payerInfo: {
          name: 'Escrowzy Platform',
          address: process.env.COMPANY_ADDRESS || 'N/A',
          ein: process.env.COMPANY_EIN || 'N/A'
        },
        recipientInfo: {
          name: user.name || 'N/A',
          address: user.address || 'N/A',
          tin: user.taxId || 'N/A'
        }
      }
    } else if (validatedData.documentType === 'w9') {
      // W-9 template
      documentContent = {
        ...documentContent,
        formType: 'W-9',
        requestDate: new Date().toISOString(),
        note: 'Please complete and return this W-9 form for tax reporting purposes'
      }
    } else if (validatedData.documentType === 'summary') {
      // Detailed earnings summary
      documentContent = {
        ...documentContent,
        breakdown: {
          byMonth: await getMonthlyBreakdown(user.id, validatedData.year),
          byClient: clientBreakdown.map(c => ({
            clientName: c.clientName || c.clientEmail,
            totalPaid: c.totalPaid,
            jobCount: c.jobCount
          }))
        }
      }
    }

    // Store the document
    const [document] = await db
      .insert(taxDocuments)
      .values({
        freelancerId: user.id,
        year: validatedData.year,
        documentType: validatedData.documentType,
        metadata: documentContent,
        status: 'generated',
        documentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/tax-documents/${user.id}/${validatedData.year}/${validatedData.documentType}` // This would be actual file URL in production
      })
      .returning()

    return NextResponse.json({
      success: true,
      document,
      summary: {
        year: validatedData.year,
        totalEarnings: grandTotal.toFixed(2),
        transactionCount: yearlyEarnings?.transactionCount || 0
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating tax document:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate tax document' },
      { status: 500 }
    )
  }
}

// Helper function to get monthly breakdown
async function getMonthlyBreakdown(freelancerId: number, year: number) {
  const months = []

  for (let month = 0; month < 12; month++) {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59)

    const [monthData] = await db
      .select({
        totalEarnings: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`,
        transactionCount: sql<number>`COUNT(*)`
      })
      .from(earnings)
      .where(
        and(
          eq(earnings.freelancerId, freelancerId),
          eq(earnings.status, 'completed'),
          gte(earnings.createdAt, startDate),
          lte(earnings.createdAt, endDate)
        )
      )

    months.push({
      month: month + 1,
      monthName: startDate.toLocaleString('default', { month: 'long' }),
      earnings: monthData?.totalEarnings || '0',
      transactions: monthData?.transactionCount || 0
    })
  }

  return months
}

// GET /api/tax-documents/summary - Get tax summary for current year
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentYear = new Date().getFullYear()
    const startDate = new Date(currentYear, 0, 1)
    const endDate = new Date()

    // Get YTD earnings
    const [ytdEarnings] = await db
      .select({
        totalEarnings: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`,
        totalTips: sql<string>`COALESCE(SUM(CAST(tip AS DECIMAL)), 0)`,
        transactionCount: sql<number>`COUNT(*)`
      })
      .from(earnings)
      .where(
        and(
          eq(earnings.freelancerId, user.id),
          eq(earnings.status, 'completed'),
          gte(earnings.createdAt, startDate),
          lte(earnings.createdAt, endDate)
        )
      )

    // Get quarterly breakdown
    const quarters = []
    for (let q = 0; q < 4; q++) {
      const qStart = new Date(currentYear, q * 3, 1)
      const qEnd = new Date(currentYear, (q + 1) * 3, 0, 23, 59, 59)

      if (qStart > endDate) break

      const [quarterData] = await db
        .select({
          totalEarnings: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
        })
        .from(earnings)
        .where(
          and(
            eq(earnings.freelancerId, user.id),
            eq(earnings.status, 'completed'),
            gte(earnings.createdAt, qStart),
            lte(earnings.createdAt, qEnd > endDate ? endDate : qEnd)
          )
        )

      quarters.push({
        quarter: `Q${q + 1}`,
        earnings: quarterData?.totalEarnings || '0'
      })
    }

    // Estimated tax calculation (simplified - 25% for federal + state)
    const estimatedTaxRate = 0.25
    const totalYtd =
      parseFloat(ytdEarnings?.totalEarnings || '0') +
      parseFloat(ytdEarnings?.totalTips || '0')
    const estimatedTax = (totalYtd * estimatedTaxRate).toFixed(2)

    return NextResponse.json({
      success: true,
      summary: {
        year: currentYear,
        ytdEarnings: totalYtd.toFixed(2),
        ytdTransactions: ytdEarnings?.transactionCount || 0,
        quarters,
        estimatedTax,
        taxRate: estimatedTaxRate,
        note: 'This is a simplified estimate. Please consult a tax professional for accurate calculations.'
      }
    })
  } catch (error) {
    console.error('Error fetching tax summary:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tax summary' },
      { status: 500 }
    )
  }
}
