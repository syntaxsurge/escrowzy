import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/session'
import { getUserTutorialProgress } from '@/lib/db/queries/tutorials'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const progress = await getUserTutorialProgress(session.user.id)

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Failed to fetch tutorial progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutorial progress' },
      { status: 500 }
    )
  }
}
