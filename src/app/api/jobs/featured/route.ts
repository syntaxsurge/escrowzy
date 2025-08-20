import { NextRequest, NextResponse } from 'next/server'

import { getFeaturedJobs } from '@/lib/db/queries/jobs'

// GET /api/jobs/featured - Get featured jobs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '5')

    const jobs = await getFeaturedJobs(limit)

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching featured jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured jobs' },
      { status: 500 }
    )
  }
}
