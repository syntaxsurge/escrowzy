import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { findMatchingFreelancers } from '@/lib/algorithms/skill-matching'
import { db } from '@/lib/db/drizzle'
import { jobPostings } from '@/lib/db/schema'
import { getUser } from '@/services/user'

// GET /api/jobs/[id]/matching-freelancers - Get matching freelancers for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const jobId = parseInt(id)

    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      )
    }

    // Check if user owns the job
    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, jobId))
      .limit(1)

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.clientId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only view matching freelancers for your own jobs'
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const minMatchScore = parseInt(searchParams.get('minMatchScore') || '60')
    const excludeApplied = searchParams.get('excludeApplied') !== 'false'

    // Get matching freelancers
    const matches = await findMatchingFreelancers(jobId, {
      limit,
      minMatchScore,
      excludeApplied
    })

    return NextResponse.json({
      matches,
      total: matches.length
    })
  } catch (error) {
    console.error('Error fetching matching freelancers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch matching freelancers' },
      { status: 500 }
    )
  }
}
