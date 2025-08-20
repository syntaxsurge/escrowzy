import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/drizzle'
import { getJobsWithFilters, type JobFilters } from '@/lib/db/queries/jobs'
import { jobPostings } from '@/lib/db/schema'
import { getUser } from '@/services/user'

// GET /api/jobs - List job and service postings with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Handle special 'current' clientId
    let clientId: number | undefined
    const clientIdParam = searchParams.get('clientId')
    if (clientIdParam === 'current') {
      const user = await getUser()
      if (user) {
        clientId = user.id
      }
    } else if (clientIdParam) {
      clientId = parseInt(clientIdParam)
    }

    // Handle 'all' status to get all statuses
    const statusParam = searchParams.get('status')
    const status = statusParam === 'all' ? undefined : statusParam || 'open'

    // Build filters from query params
    const filters: JobFilters = {
      postingType:
        (searchParams.get('postingType') as 'job' | 'service') || undefined,
      status,
      clientId,
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

// POST /api/jobs - Create a new job or service posting
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

    // Determine posting type (job or service)
    const postingType = body.postingType || 'job'

    // Build values object based on posting type
    const values: any = {
      postingType,
      clientId: user.id,
      title: body.title,
      description: body.description,
      categoryId: body.categoryId,
      budgetType: body.budgetType || 'fixed',
      currency: body.currency || 'USD',
      skillsRequired: body.skillsRequired || body.skillsOffered || [],
      experienceLevel: body.experienceLevel || 'intermediate',
      visibility: body.visibility || 'public',
      status: body.status || 'open',
      attachments: body.attachments || [],
      metadata: body.metadata || {}
    }

    if (postingType === 'service') {
      // Service-specific fields
      values.servicePrice = body.servicePrice || body.amount || body.budget
      values.pricePerUnit = body.pricePerUnit
      values.deliveryTime = body.deliveryTime || 7
      values.revisions = body.revisions || 0
      values.paymentMethods = body.paymentMethods || [
        'bank_transfer',
        'paypal',
        'crypto'
      ]

      // For services, we use servicePrice as the budget
      if (!values.budgetMin) {
        values.budgetMin = values.servicePrice
      }
      if (!values.budgetMax) {
        values.budgetMax = values.servicePrice
      }
    } else {
      // Job-specific fields
      values.budgetMin = body.budgetMin
      values.budgetMax = body.budgetMax
      values.deadline = body.deadline ? new Date(body.deadline) : null
      values.paymentMethods = body.paymentMethods || []
    }

    // Create job/service posting
    const [job] = await db.insert(jobPostings).values(values).returning()

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
