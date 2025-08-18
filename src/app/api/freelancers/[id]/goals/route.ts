import { NextRequest, NextResponse } from 'next/server'

import { eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { freelancerProfiles } from '@/lib/db/schema'
import { getUser } from '@/services/user'

// Goals are stored in the freelancerProfiles metadata field
interface Goal {
  id: string
  title: string
  description?: string
  type: 'earnings' | 'projects' | 'skills' | 'reviews' | 'custom'
  target: number
  current: number
  deadline: Date
  status: 'active' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

// GET /api/freelancers/[id]/goals - Get freelancer goals
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const freelancerId = parseInt(id)

    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid freelancer ID' },
        { status: 400 }
      )
    }

    // Check if user is authorized
    const user = await getUser()
    if (!user || user.id !== freelancerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get freelancer profile
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, freelancerId))
      .limit(1)

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Freelancer profile not found' },
        { status: 404 }
      )
    }

    // Get goals from metadata field
    const metadata = (profile.metadata || {}) as any
    const goals: Goal[] = metadata.goals || []

    // Update current values for system goals
    const currentDate = new Date()
    const updatedGoals = await Promise.all(
      goals.map(async (goal: Goal) => {
        // Skip if goal is already completed or failed
        if (goal.status !== 'active') return goal

        // Check if deadline has passed
        if (new Date(goal.deadline) < currentDate) {
          goal.status = goal.current >= goal.target ? 'completed' : 'failed'
          return goal
        }

        // Update current values based on goal type
        switch (goal.type) {
          case 'earnings':
            const startOfPeriod = new Date(goal.createdAt)
            const [earningsData] = await db
              .select({
                total: sql<number>`COALESCE(SUM(CAST(net_amount AS DECIMAL)), 0)`
              })
              .from(sql`earnings`)
              .where(
                sql`freelancer_id = ${freelancerId} 
                  AND created_at >= ${startOfPeriod}
                  AND created_at <= ${goal.deadline}`
              )
            goal.current = Number(earningsData?.total) || 0
            break

          case 'projects':
            const [projectsData] = await db
              .select({
                count: sql<number>`COUNT(*)`
              })
              .from(sql`job_postings`)
              .where(
                sql`freelancer_id = ${freelancerId}
                  AND status = 'completed'
                  AND updated_at >= ${goal.createdAt}
                  AND updated_at <= ${goal.deadline}`
              )
            goal.current = Number(projectsData?.count) || 0
            break

          case 'reviews':
            const [reviewsData] = await db
              .select({
                avgRating: sql<number>`COALESCE(AVG(rating), 0)`
              })
              .from(sql`freelancer_reviews`)
              .where(
                sql`freelancer_id = ${profile.id}
                  AND created_at >= ${goal.createdAt}
                  AND created_at <= ${goal.deadline}`
              )
            goal.current = Number(reviewsData?.avgRating) || 0
            break

          case 'skills':
            const [skillsData] = await db
              .select({
                count: sql<number>`COUNT(*)`
              })
              .from(sql`freelancer_skills`)
              .where(
                sql`freelancer_id = ${profile.id}
                  AND is_verified = true`
              )
            goal.current = Number(skillsData?.count) || 0
            break
        }

        // Check if goal is completed
        if (goal.current >= goal.target) {
          goal.status = 'completed'
        }

        return goal
      })
    )

    // Save updated goals to metadata field
    await db
      .update(freelancerProfiles)
      .set({
        metadata: { ...metadata, goals: updatedGoals },
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.userId, freelancerId))

    // Calculate statistics
    const stats = {
      total: updatedGoals.length,
      active: updatedGoals.filter((g: Goal) => g.status === 'active').length,
      completed: updatedGoals.filter((g: Goal) => g.status === 'completed')
        .length,
      failed: updatedGoals.filter((g: Goal) => g.status === 'failed').length,
      completionRate:
        updatedGoals.length > 0
          ? Math.round(
              (updatedGoals.filter((g: Goal) => g.status === 'completed')
                .length /
                updatedGoals.length) *
                100
            )
          : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        goals: updatedGoals,
        stats
      }
    })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

// POST /api/freelancers/[id]/goals - Create a new goal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const freelancerId = parseInt(id)

    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid freelancer ID' },
        { status: 400 }
      )
    }

    // Check if user is authorized
    const user = await getUser()
    if (!user || user.id !== freelancerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, type, target, deadline } = body

    // Validate input
    if (!title || !type || !target || !deadline) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get freelancer profile
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, freelancerId))
      .limit(1)

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Freelancer profile not found' },
        { status: 404 }
      )
    }

    // Get goals from metadata field
    const metadata = (profile.metadata || {}) as any
    const goals: Goal[] = metadata.goals || []

    // Create new goal
    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      title,
      description,
      type,
      target,
      current: 0,
      deadline: new Date(deadline),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add goal to metadata
    goals.push(newGoal)

    // Save updated goals to metadata field
    await db
      .update(freelancerProfiles)
      .set({
        metadata: { ...metadata, goals },
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.userId, freelancerId))

    return NextResponse.json({
      success: true,
      data: newGoal
    })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}

// PATCH /api/freelancers/[id]/goals - Update a goal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const freelancerId = parseInt(id)

    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid freelancer ID' },
        { status: 400 }
      )
    }

    // Check if user is authorized
    const user = await getUser()
    if (!user || user.id !== freelancerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { goalId, ...updates } = body

    if (!goalId) {
      return NextResponse.json(
        { success: false, error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    // Get freelancer profile
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, freelancerId))
      .limit(1)

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Freelancer profile not found' },
        { status: 404 }
      )
    }

    // Get goals from metadata field
    const metadata = (profile.metadata || {}) as any
    const goals: Goal[] = metadata.goals || []

    // Find and update goal
    const goalIndex = goals.findIndex((g: Goal) => g.id === goalId)
    if (goalIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    goals[goalIndex] = {
      ...goals[goalIndex],
      ...updates,
      updatedAt: new Date()
    }

    // Save updated goals to metadata field
    await db
      .update(freelancerProfiles)
      .set({
        metadata: { ...metadata, goals },
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.userId, freelancerId))

    return NextResponse.json({
      success: true,
      data: goals[goalIndex]
    })
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

// DELETE /api/freelancers/[id]/goals - Delete a goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const freelancerId = parseInt(id)

    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid freelancer ID' },
        { status: 400 }
      )
    }

    // Check if user is authorized
    const user = await getUser()
    if (!user || user.id !== freelancerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const goalId = searchParams.get('goalId')

    if (!goalId) {
      return NextResponse.json(
        { success: false, error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    // Get freelancer profile
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, freelancerId))
      .limit(1)

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Freelancer profile not found' },
        { status: 404 }
      )
    }

    // Get goals from metadata field
    const metadata = (profile.metadata || {}) as any
    const goals: Goal[] = metadata.goals || []

    // Remove goal
    const updatedGoals = goals.filter((g: Goal) => g.id !== goalId)

    if (goals.length === updatedGoals.length) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Save updated goals to metadata field
    await db
      .update(freelancerProfiles)
      .set({
        metadata: { ...metadata, goals: updatedGoals },
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.userId, freelancerId))

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}
