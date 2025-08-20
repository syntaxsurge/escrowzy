import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { getServerSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import {
  createReviewDispute,
  getDisputesByUser,
  getPendingDisputes
} from '@/lib/db/queries/review-disputes'
import { users } from '@/lib/db/schema'
import { reviewDisputeSchema } from '@/lib/schemas/review-disputes'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = reviewDisputeSchema.parse(body)

    const result = await createReviewDispute(session.user.id, validatedData)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      disputeId: result.disputeId
    })
  } catch (error) {
    console.error('Error creating review dispute:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to submit dispute' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    if (type === 'pending') {
      // Check if user is admin
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)

      if (user && user.role === 'admin') {
        const disputes = await getPendingDisputes()
        return NextResponse.json({ disputes })
      }
    }

    const disputes = await getDisputesByUser(session.user.id)
    return NextResponse.json({ disputes })
  } catch (error) {
    console.error('Error fetching disputes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    )
  }
}
