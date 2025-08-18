import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/session'
import { completeTutorial } from '@/lib/db/queries/tutorials'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { tutorialId } = await req.json()

    if (!tutorialId) {
      return NextResponse.json(
        { error: 'Tutorial ID is required' },
        { status: 400 }
      )
    }

    const progress = await completeTutorial(session.user.id, tutorialId)

    return NextResponse.json({
      progress,
      message: 'Tutorial completed successfully'
    })
  } catch (error) {
    console.error('Failed to complete tutorial:', error)
    return NextResponse.json(
      { error: 'Failed to complete tutorial' },
      { status: 500 }
    )
  }
}
