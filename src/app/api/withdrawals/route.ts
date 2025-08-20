import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import { earnings, withdrawals } from '@/lib/db/schema'
import { pusherServer } from '@/lib/pusher-server'
import { getUser } from '@/services/user'

const createWithdrawalSchema = z.object({
  amount: z.string(),
  method: z.enum(['crypto', 'bank', 'paypal']),
  destinationAddress: z.string().optional(),
  accountDetails: z
    .object({
      accountNumber: z.string().optional(),
      routingNumber: z.string().optional(),
      accountName: z.string().optional(),
      bankName: z.string().optional(),
      paypalEmail: z.string().email().optional()
    })
    .optional(),
  notes: z.string().optional()
})

// GET /api/withdrawals - Get user's withdrawals
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query conditions
    const conditions = [eq(withdrawals.freelancerId, user.id)]

    if (status) {
      conditions.push(eq(withdrawals.status, status))
    }

    if (method) {
      conditions.push(eq(withdrawals.method, method))
    }

    // Fetch withdrawals
    const userWithdrawals = await db
      .select()
      .from(withdrawals)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(withdrawals.createdAt))
      .limit(limit)
      .offset(offset)

    // Calculate totals
    const [totals] = await db
      .select({
        totalWithdrawn: sql<string>`COALESCE(SUM(CASE WHEN status = 'completed' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        totalPending: sql<string>`COALESCE(SUM(CASE WHEN status = 'pending' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        totalProcessing: sql<string>`COALESCE(SUM(CASE WHEN status = 'processing' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`
      })
      .from(withdrawals)
      .where(eq(withdrawals.freelancerId, user.id))

    return NextResponse.json({
      withdrawals: userWithdrawals,
      totals: {
        totalWithdrawn: totals?.totalWithdrawn || '0',
        totalPending: totals?.totalPending || '0',
        totalProcessing: totals?.totalProcessing || '0'
      },
      hasMore: userWithdrawals.length === limit
    })
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}

// POST /api/withdrawals - Create withdrawal request
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createWithdrawalSchema.parse(body)

    // Check available balance
    const [balance] = await db
      .select({
        totalEarned: sql<string>`COALESCE(SUM(CASE WHEN status = 'completed' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        totalWithdrawn: sql<string>`COALESCE(SUM(CASE WHEN status IN ('completed', 'processing') THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`
      })
      .from(earnings)
      .where(eq(earnings.freelancerId, user.id))

    const [withdrawnAmount] = await db
      .select({
        total: sql<string>`COALESCE(SUM(CASE WHEN status IN ('completed', 'processing', 'pending') THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`
      })
      .from(withdrawals)
      .where(eq(withdrawals.freelancerId, user.id))

    const availableBalance =
      parseFloat(balance?.totalEarned || '0') -
      parseFloat(withdrawnAmount?.total || '0')
    const requestedAmount = parseFloat(validatedData.amount)

    if (requestedAmount > availableBalance) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          availableBalance: availableBalance.toString()
        },
        { status: 400 }
      )
    }

    // Minimum withdrawal amount
    const minAmount = 0.01 // 0.01 ETH minimum
    if (requestedAmount < minAmount) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal amount is ${minAmount} ETH`
        },
        { status: 400 }
      )
    }

    // Calculate fee (2% platform fee)
    const feePercentage = 0.02
    const fee = (requestedAmount * feePercentage).toFixed(6)
    const netAmount = (requestedAmount - parseFloat(fee)).toFixed(6)

    // Create withdrawal request
    const [withdrawal] = await db
      .insert(withdrawals)
      .values({
        freelancerId: user.id,
        amount: validatedData.amount,
        fee,
        netAmount,
        method: validatedData.method,
        destinationAccount:
          validatedData.destinationAddress ||
          JSON.stringify(validatedData.accountDetails || {}),
        status: 'pending',
        metadata: {
          notes: validatedData.notes,
          accountDetails: validatedData.accountDetails
        }
      })
      .returning()

    // Send notification to admin
    if (pusherServer) {
      await pusherServer.trigger('admin-channel', 'withdrawal-requested', {
        withdrawalId: withdrawal.id,
        freelancerId: user.id,
        freelancerName: user.name || user.email,
        amount: validatedData.amount,
        method: validatedData.method,
        requestedAt: withdrawal.createdAt
      })
    }

    return NextResponse.json({
      withdrawal,
      message: 'Withdrawal request submitted successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating withdrawal:', error)
    return NextResponse.json(
      { error: 'Failed to create withdrawal request' },
      { status: 500 }
    )
  }
}
