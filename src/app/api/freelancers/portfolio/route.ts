import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import {
  getFreelancerProfileByUserId,
  createPortfolioItem
} from '@/lib/db/queries/freelancers'
import { portfolioItems, freelancerProfiles } from '@/lib/db/schema'
import { profilePortfolioSchema } from '@/lib/schemas/freelancer'
import { getUser } from '@/services/user'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getFreelancerProfileByUserId(user.id)

    if (!profile) {
      return NextResponse.json([])
    }

    const items = await db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.freelancerId, profile.id))
      .orderBy(portfolioItems.sortOrder, portfolioItems.createdAt)

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate the data
    const validationResult = profilePortfolioSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    // Get or create freelancer profile
    let profile = await getFreelancerProfileByUserId(user.id)
    if (!profile) {
      // Create a basic profile first
      const [newProfile] = await db
        .insert(freelancerProfiles)
        .values({ userId: user.id })
        .returning()
      profile = await getFreelancerProfileByUserId(user.id)
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    // Create portfolio item
    const item = await createPortfolioItem({
      ...validationResult.data,
      freelancerId: profile.id,
      completionDate: validationResult.data.completionDate || null
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error creating portfolio item:', error)
    return NextResponse.json(
      { error: 'Failed to create portfolio item' },
      { status: 500 }
    )
  }
}
