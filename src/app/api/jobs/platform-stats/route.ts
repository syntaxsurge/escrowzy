import { NextResponse } from 'next/server'

import { getPlatformStats } from '@/lib/db/queries/user-stats'

export async function GET() {
  try {
    const stats = await getPlatformStats()

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching platform stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform stats' },
      { status: 500 }
    )
  }
}
