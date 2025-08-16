import { NextRequest, NextResponse } from 'next/server'

import { getJobReviews } from '@/lib/db/queries/reviews'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const jobId = parseInt(id)

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }

    const reviews = await getJobReviews(jobId)

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching job reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
