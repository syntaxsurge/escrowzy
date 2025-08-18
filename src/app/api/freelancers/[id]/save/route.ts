import { NextRequest, NextResponse } from 'next/server'

import {
  toggleSavedFreelancer,
  isFreelancerSaved
} from '@/lib/db/queries/freelancers'
import { getUser } from '@/services/user'

export async function GET(
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

    const freelancerId = parseInt(id)
    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid freelancer ID' },
        { status: 400 }
      )
    }

    const isSaved = await isFreelancerSaved(user.id, freelancerId)

    return NextResponse.json({
      success: true,
      saved: isSaved
    })
  } catch (error) {
    console.error('Error checking saved status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check saved status' },
      { status: 500 }
    )
  }
}

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

    const freelancerId = parseInt(id)
    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid freelancer ID' },
        { status: 400 }
      )
    }

    const result = await toggleSavedFreelancer(user.id, freelancerId)

    return NextResponse.json({
      success: true,
      saved: result.saved
    })
  } catch (error) {
    console.error('Error toggling saved freelancer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save/unsave freelancer' },
      { status: 500 }
    )
  }
}
