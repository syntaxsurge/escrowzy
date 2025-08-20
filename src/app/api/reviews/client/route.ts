import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/session'
import { getClientReviews } from '@/lib/db/queries/reviews'
import { clientReviewSchema, reviewFilterSchema } from '@/lib/schemas/reviews'
import { submitClientReview } from '@/services/reviews'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = clientReviewSchema.parse(body)

    const result = await submitClientReview(session.user.id, validatedData)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      reviewId: result.reviewId
    })
  } catch (error) {
    console.error('Error submitting client review:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const filter = reviewFilterSchema.parse({
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 20,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      order: searchParams.get('order') || 'desc',
      minRating: searchParams.get('minRating')
        ? parseInt(searchParams.get('minRating')!)
        : undefined,
      isPublic: searchParams.get('isPublic') === 'false' ? false : true
    })

    const result = await getClientReviews(parseInt(clientId), filter)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching client reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
