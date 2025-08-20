import { NextRequest, NextResponse } from 'next/server'

import { findMatchingJobs } from '@/lib/algorithms/skill-matching'
import { getUser } from '@/services/user'

// GET /api/jobs/recommendations - Get job recommendations for a freelancer
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
    const limit = parseInt(searchParams.get('limit') || '10')
    const minMatchScore = parseInt(searchParams.get('minMatchScore') || '60')
    const includeExpired = searchParams.get('includeExpired') === 'true'

    // Get matching jobs for the freelancer
    const recommendations = await findMatchingJobs(user.id, {
      limit,
      minMatchScore,
      includeExpired
    })

    return NextResponse.json({
      recommendations,
      total: recommendations.length
    })
  } catch (error) {
    console.error('Error fetching job recommendations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
