import { NextRequest, NextResponse } from 'next/server'

import { getJobById } from '@/lib/db/queries/jobs'

// GET /api/jobs/[id] - Get single job details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const jobId = parseInt(id)

    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      )
    }

    const job = await getJobById(jobId)

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: job
    })
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}
