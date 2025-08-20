import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/session'
import { reviewResponseSchema } from '@/lib/schemas/reviews'
import { respondToReview } from '@/services/reviews'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviewId = parseInt(id)
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = reviewResponseSchema.parse(body)

    const type = body.type as 'freelancer' | 'client'
    if (!type || !['freelancer', 'client'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid review type' },
        { status: 400 }
      )
    }

    const result = await respondToReview(
      session.user.id,
      reviewId,
      type,
      validatedData
    )

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    console.error('Error responding to review:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to add response' },
      { status: 500 }
    )
  }
}
