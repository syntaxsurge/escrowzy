import { NextRequest, NextResponse } from 'next/server'

import {
  getFreelancerProfileByUserId,
  upsertFreelancerProfile
} from '@/lib/db/queries/freelancers'
import { freelancerProfileSchema } from '@/lib/schemas/freelancer'
import { getUser } from '@/services/user'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getFreelancerProfileByUserId(user.id)

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching freelancer profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
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
    const validationResult = freelancerProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const profile = await upsertFreelancerProfile(
      user.id,
      validationResult.data
    )

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating freelancer profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
