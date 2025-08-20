import { NextRequest, NextResponse } from 'next/server'

import { getClientStats, getUserLocation } from '@/lib/db/queries/user-stats'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const [stats, location] = await Promise.all([
      getClientStats(userId),
      getUserLocation(userId)
    ])

    return NextResponse.json({
      ...stats,
      location: location || 'Not specified'
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}
