import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/session'
import { rejectBattleInvitation } from '@/services/battle'

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

    // Get session ID from cookies
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value || ''

    // Reject the invitation
    const success = await rejectBattleInvitation(
      invitationId,
      session.user.id,
      sessionToken
    )

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Battle invitation rejected'
    })
  } catch (error) {
    console.error('Error in POST /api/battles/reject:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
