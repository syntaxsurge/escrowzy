import { NextRequest, NextResponse } from 'next/server'

import { getFreelancerProfileById } from '@/lib/db/queries/freelancers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profileId = parseInt(id)
    if (isNaN(profileId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid profile ID' },
        { status: 400 }
      )
    }

    const profile = await getFreelancerProfileById(profileId)

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching freelancer profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
