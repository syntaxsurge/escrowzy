import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/drizzle'
import {
  updateFreelancerSkills,
  getFreelancerProfileByUserId
} from '@/lib/db/queries/freelancers'
import { freelancerProfiles } from '@/lib/db/schema'
import { profileSkillsSchema } from '@/lib/schemas/freelancer'
import { getUser } from '@/services/user'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getFreelancerProfileByUserId(user.id)

    return NextResponse.json(profile?.skills || [])
  } catch (error) {
    console.error('Error fetching freelancer skills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
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
    const validationResult = profileSkillsSchema.safeParse(body)
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

    // Update skills
    await updateFreelancerSkills(profile.id, validationResult.data.skills)

    // Fetch updated profile
    const updatedProfile = await getFreelancerProfileByUserId(user.id)

    return NextResponse.json(updatedProfile?.skills || [])
  } catch (error) {
    console.error('Error updating freelancer skills:', error)
    return NextResponse.json(
      { error: 'Failed to update skills' },
      { status: 500 }
    )
  }
}
