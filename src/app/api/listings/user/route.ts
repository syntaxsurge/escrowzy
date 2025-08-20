import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/session'
import { getUserListings } from '@/services/listings'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's listings (include inactive ones so user can manage them)
    const result = await getUserListings(session.user.id, true)

    // Return the listings directly without double-wrapping
    return NextResponse.json({
      ...result
    })
  } catch (error) {
    console.error('Error in GET /api/listings/user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
