import { NextResponse } from 'next/server'

import { desc, eq, or } from 'drizzle-orm'

import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { battles, users, battleStates } from '@/lib/db/schema'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the most recent battle that is not completed
    const [currentBattle] = await db
      .select({
        id: battles.id,
        player1Id: battles.player1Id,
        player2Id: battles.player2Id,
        player1CP: battles.player1CP,
        player2CP: battles.player2CP,
        winnerId: battles.winnerId,
        status: battles.status,
        feeDiscountPercent: battles.feeDiscountPercent,
        startedAt: battles.startedAt,
        createdAt: battles.createdAt
      })
      .from(battles)
      .where(
        or(
          eq(battles.player1Id, session.user.id),
          eq(battles.player2Id, session.user.id)
        )
      )
      .orderBy(desc(battles.createdAt))
      .limit(1)

    if (!currentBattle) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    // Check if battle is still active (not completed)
    const isInProgress = currentBattle.status !== 'completed'

    if (!isInProgress) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    // Get opponent details
    const opponentId =
      currentBattle.player1Id === session.user.id
        ? currentBattle.player2Id
        : currentBattle.player1Id

    const [opponent] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        walletAddress: users.walletAddress
      })
      .from(users)
      .where(eq(users.id, opponentId))
      .limit(1)

    // Determine display name
    let displayName = opponent?.name
    if (!displayName || displayName === 'Unknown Player') {
      if (opponent?.email) {
        displayName = opponent.email
      } else if (opponent?.walletAddress) {
        displayName = `${opponent.walletAddress.slice(0, 6)}...${opponent.walletAddress.slice(-4)}`
      } else {
        displayName = 'Anonymous Warrior'
      }
    }

    // Get battle state if the battle is ongoing
    let battleState = null
    if (currentBattle.status === 'ongoing') {
      const [state] = await db
        .select()
        .from(battleStates)
        .where(eq(battleStates.battleId, currentBattle.id))
        .limit(1)
      battleState = state
    }

    return NextResponse.json({
      success: true,
      data: {
        battleId: currentBattle.id,
        status: currentBattle.status,
        isPlayer1: currentBattle.player1Id === session.user.id,
        player1: {
          id: currentBattle.player1Id,
          combatPower: currentBattle.player1CP,
          health: battleState?.player1Health ?? 100
        },
        player2: {
          id: currentBattle.player2Id,
          combatPower: currentBattle.player2CP,
          health: battleState?.player2Health ?? 100
        },
        opponent: {
          id: opponentId,
          name: displayName,
          combatPower:
            currentBattle.player1Id === session.user.id
              ? currentBattle.player2CP
              : currentBattle.player1CP
        },
        currentRound: battleState?.currentRound ?? 0,
        battleLog: battleState?.battleLog ?? []
      }
    })
  } catch (error) {
    console.error('Error in GET /api/battles/current:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
