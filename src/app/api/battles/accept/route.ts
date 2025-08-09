import { NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { battleInvitations } from '@/lib/db/schema'
import {
  broadcastBattleAccepted,
  broadcastBattleStats
} from '@/lib/pusher-server'
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

    // Get the invitation details first
    const [invitation] = await db
      .select()
      .from(battleInvitations)
      .where(eq(battleInvitations.id, invitationId))
      .limit(1)

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
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

    // Broadcast acceptance to both users
    await broadcastBattleAccepted(invitation.fromUserId, invitation.toUserId, {
      battleId: battleResult,
      invitationId,
      fromUserId: invitation.fromUserId,
      toUserId: invitation.toUserId
    })

    // Broadcast stats update
    await broadcastBattleStats()

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
