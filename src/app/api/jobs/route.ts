import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/drizzle'
import { getJobsWithFilters, type JobFilters } from '@/lib/db/queries/jobs'
import { jobPostings } from '@/lib/db/schema'
import { getUser } from '@/services/user'

// GET /api/jobs - List job postings with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Build filters from query params
    const filters: JobFilters = {
      status: searchParams.get('status') || 'open',
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId')
        ? parseInt(searchParams.get('categoryId')!)
        : undefined,
      budgetMin: searchParams.get('budgetMin') || undefined,
      budgetMax: searchParams.get('budgetMax') || undefined,
      experienceLevel: searchParams.get('experienceLevel') || undefined,
      skillsRequired: searchParams.get('skills')
        ? searchParams.get('skills')!.split(',')
        : undefined,
      sortBy: (searchParams.get('sortBy') as JobFilters['sortBy']) || 'newest',
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 20,
      offset: searchParams.get('offset')
        ? parseInt(searchParams.get('offset')!)
        : 0
    }

    const { jobs, total } = await getJobsWithFilters(filters)

    return NextResponse.json({
      success: true,
      jobs,
      total,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset || 0) + (filters.limit || 20) < total
      }
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Create a new job posting
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.description || !body.categoryId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create job posting
    const [job] = await db
      .insert(jobPostings)
      .values({
        clientId: user.id,
        title: body.title,
        description: body.description,
        categoryId: body.categoryId,
        budgetType: body.budgetType || 'fixed',
        budgetMin: body.budgetMin,
        budgetMax: body.budgetMax,
        currency: body.currency || 'USD',
        deadline: body.deadline ? new Date(body.deadline) : null,
        skillsRequired: body.skillsRequired || [],
        experienceLevel: body.experienceLevel || 'intermediate',
        visibility: body.visibility || 'public',
        status: body.status || 'open',
        attachments: body.attachments || [],
        metadata: body.metadata || {}
      })
      .returning()

    return NextResponse.json({
      success: true,
      job
    })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
