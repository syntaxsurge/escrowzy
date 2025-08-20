import { NextResponse } from 'next/server'

import { pusherChannels, pusherEvents } from '@/config/api-endpoints'
import { getSession } from '@/lib/auth/session'
import { pusherServer } from '@/lib/pusher-server'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { battleId, action, value, playerNumber } = body

    if (!battleId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Broadcast action to opponent via Pusher
    if (pusherServer) {
      // Send to battle-specific channel for opponent
      await pusherServer.trigger(
        pusherChannels.battle(battleId),
        pusherEvents.battle.opponentAction,
        {
          userId: session.user.id,
          action,
          value,
          playerNumber,
          timestamp: new Date().toISOString()
        }
      )
    }

    return NextResponse.json({
      data: { action, value }
    })
  } catch (error) {
    console.error('Error in POST /api/battles/action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
