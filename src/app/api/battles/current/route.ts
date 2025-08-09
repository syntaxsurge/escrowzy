import { NextResponse } from 'next/server'

import { desc, eq, or } from 'drizzle-orm'

import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { battles, users } from '@/lib/db/schema'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the most recent battle that is in progress
    const [currentBattle] = await db
      .select({
        id: battles.id,
        player1Id: battles.player1Id,
        player2Id: battles.player2Id,
        player1CP: battles.player1CP,
        player2CP: battles.player2CP,
        winnerId: battles.winnerId,
        feeDiscountPercent: battles.feeDiscountPercent,
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

    // Check if battle is recent (within last 30 seconds) and not completed
    const battleAge = Date.now() - currentBattle.createdAt.getTime()
    const isInProgress = battleAge < 30000 && !currentBattle.winnerId

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

    return NextResponse.json({
      success: true,
      data: {
        battleId: currentBattle.id,
        isPlayer1: currentBattle.player1Id === session.user.id,
        player1: {
          id: currentBattle.player1Id,
          combatPower: currentBattle.player1CP
        },
        player2: {
          id: currentBattle.player2Id,
          combatPower: currentBattle.player2CP
        },
        opponent: {
          id: opponentId,
          name: displayName,
          combatPower:
            currentBattle.player1Id === session.user.id
              ? currentBattle.player2CP
              : currentBattle.player1CP
        }
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
