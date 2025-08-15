import { NextRequest, NextResponse } from 'next/server'

import { eq, and, or, ilike, desc, asc } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobPostings } from '@/lib/db/schema'
import { getUser } from '@/services/user'

// GET /api/jobs - List job postings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'open'
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query conditions
    const conditions = [eq(jobPostings.status, status)]

    if (categoryId) {
      conditions.push(eq(jobPostings.categoryId, parseInt(categoryId)))
    }

    if (search) {
      conditions.push(
        or(
          ilike(jobPostings.title, `%${search}%`),
          ilike(jobPostings.description, `%${search}%`)
        )!
      )
    }

    // Get jobs with related data
    const orderColumn = jobPostings.createdAt // Default to createdAt for ordering
    const jobs = await db
      .select()
      .from(jobPostings)
      .where(and(...conditions))
      .orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn))
      .limit(50)

    return NextResponse.json({
      success: true,
      jobs
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
        projectDuration: body.projectDuration,
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
