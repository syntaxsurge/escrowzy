import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db/drizzle'
import { jobMilestones, jobPostings } from '@/lib/db/schema'
import { getUser } from '@/services/user'

const createMilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  amount: z.string(),
  dueDate: z.string().datetime(),
  order: z.number().optional()
})

const updateMilestoneSchema = createMilestoneSchema.partial()

// GET /api/jobs/[id]/milestones - Get job milestones
export async function GET(
  request: NextRequest,
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

    // Get milestones for the job
    const milestones = await db
      .select()
      .from(jobMilestones)
      .where(eq(jobMilestones.jobId, jobId))
      .orderBy(desc(jobMilestones.sortOrder))

    return NextResponse.json({
      milestones
    })
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch milestones' },
      { status: 500 }
    )
  }
}

// POST /api/jobs/[id]/milestones - Create a new milestone
export async function POST(
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

    // Check if user is the client for this job
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
        { success: false, error: 'Only the client can create milestones' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createMilestoneSchema.parse(body)

    // Get the current max order value
    const existingMilestones = await db
      .select({ maxOrder: jobMilestones.sortOrder })
      .from(jobMilestones)
      .where(eq(jobMilestones.jobId, jobId))
      .orderBy(desc(jobMilestones.sortOrder))
      .limit(1)

    const nextOrder =
      existingMilestones.length > 0
        ? (existingMilestones[0].maxOrder || 0) + 1
        : 1

    // Create the milestone
    const [milestone] = await db
      .insert(jobMilestones)
      .values({
        jobId,
        title: validatedData.title,
        description: validatedData.description,
        amount: validatedData.amount,
        dueDate: new Date(validatedData.dueDate),
        sortOrder: validatedData.order ?? nextOrder,
        status: 'pending'
      })
      .returning()

    return NextResponse.json(milestone)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating milestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create milestone' },
      { status: 500 }
    )
  }
}

// PATCH /api/jobs/[id]/milestones - Update milestones (bulk update for reordering)
export async function PATCH(
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

    // Check if user is the client for this job
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
        { success: false, error: 'Only the client can update milestones' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { milestones: milestonesToUpdate } = body

    if (!Array.isArray(milestonesToUpdate)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Update each milestone's order
    const updatePromises = milestonesToUpdate.map(milestone =>
      db
        .update(jobMilestones)
        .set({ sortOrder: milestone.order || milestone.sortOrder })
        .where(
          and(
            eq(jobMilestones.id, milestone.id),
            eq(jobMilestones.jobId, jobId)
          )
        )
    )

    await Promise.all(updatePromises)

    // Fetch updated milestones
    const updatedMilestones = await db
      .select()
      .from(jobMilestones)
      .where(eq(jobMilestones.jobId, jobId))
      .orderBy(desc(jobMilestones.sortOrder))

    return NextResponse.json({
      milestones: updatedMilestones
    })
  } catch (error) {
    console.error('Error updating milestones:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update milestones' },
      { status: 500 }
    )
  }
}
