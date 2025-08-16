import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { getFreelancerReviews } from '@/lib/db/queries/reviews'
import {
  freelancerReviewSchema,
  reviewFilterSchema
} from '@/lib/schemas/reviews'
import { submitFreelancerReview } from '@/services/reviews'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = freelancerReviewSchema.parse(body)

    const result = await submitFreelancerReview(session.userId, validatedData)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      reviewId: result.reviewId
    })
  } catch (error) {
    console.error('Error submitting freelancer review:', error)
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
    const freelancerId = searchParams.get('freelancerId')

    if (!freelancerId) {
      return NextResponse.json(
        { error: 'Freelancer ID is required' },
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

    const result = await getFreelancerReviews(parseInt(freelancerId), filter)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching freelancer reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
