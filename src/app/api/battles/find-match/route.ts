import { NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'
import { ZodError } from 'zod'

import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'
import { findMatchSchema } from '@/lib/schemas/battle'
import {
  canBattleToday,
  findMatch,
  getDailyBattleLimit
} from '@/services/battle'
import { rewardsService } from '@/services/rewards'
import type { FindMatchRequest } from '@/types/battle'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user can battle today
    const canBattle = await canBattleToday(session.user.id)
    if (!canBattle) {
      const limit = await getDailyBattleLimit(session.user.id)
      return NextResponse.json(
        {
          success: false,
          error: 'Daily battle limit reached',
          data: {
            battlesUsed: limit.battlesUsed,
            maxBattles: limit.maxBattles,
            resetsAt: limit.resetsAt
          }
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = (await request.json()) as FindMatchRequest
    const validatedData = findMatchSchema.parse(body)

    // Get user's combat power
    const gameData = await rewardsService.getOrCreateGameData(session.user.id)
    if (!gameData) {
      return NextResponse.json(
        { success: false, error: 'User game data not found' },
        { status: 404 }
      )
    }

    // Find a match
    const match = await findMatch({
      userId: session.user.id,
      combatPower: gameData.combatPower,
      matchRange: validatedData.matchRange
    })

    if (!match) {
      return NextResponse.json({
        opponent: null
      })
    }

    // Get opponent's username
    const [opponent] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, match.userId))
      .limit(1)

    return NextResponse.json({
      opponent: {
        userId: match.userId,
        combatPower: match.combatPower,
        username: opponent?.name || 'Unknown Player'
      }
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/battles/find-match:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
