import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/session'
import { acceptBattleInvitation } from '@/services/battle'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { invitationId } = body

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: 'Invitation ID required' },
        { status: 400 }
      )
    }

    // Accept the invitation
    const battleResult = await acceptBattleInvitation(
      invitationId,
      session.user.id
    )

    if (!battleResult) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: battleResult
    })
  } catch (error) {
    console.error('Error in POST /api/battles/accept:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
