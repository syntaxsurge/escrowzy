import { NextResponse } from 'next/server'

import { eq, or } from 'drizzle-orm'

import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { battles } from '@/lib/db/schema'
import { getBattleState } from '@/services/battle'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const battleId = searchParams.get('battleId')

    if (!battleId) {
      // Get the most recent ongoing battle for the user
      const [currentBattle] = await db
        .select()
        .from(battles)
        .where(
          or(
            eq(battles.player1Id, session.user.id),
            eq(battles.player2Id, session.user.id)
          )
        )
        .orderBy(battles.createdAt)
        .limit(1)

      if (!currentBattle) {
        return NextResponse.json({
          success: true,
          data: null
        })
      }

      const battleState = await getBattleState(currentBattle.id)

      return NextResponse.json({
        success: true,
        data: {
          battle: currentBattle,
          state: battleState
        }
      })
    }

    // Get specific battle state
    const battleIdNum = parseInt(battleId)

    // Verify user is part of this battle
    const [battle] = await db
      .select()
      .from(battles)
      .where(eq(battles.id, battleIdNum))
      .limit(1)

    if (!battle) {
      return NextResponse.json(
        { success: false, error: 'Battle not found' },
        { status: 404 }
      )
    }

    if (
      battle.player1Id !== session.user.id &&
      battle.player2Id !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to view this battle' },
        { status: 403 }
      )
    }

    const battleState = await getBattleState(battleIdNum)

    return NextResponse.json({
      success: true,
      data: {
        battle,
        state: battleState
      }
    })
  } catch (error) {
    console.error('Error in GET /api/battles/state:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
