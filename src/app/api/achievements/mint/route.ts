import { NextRequest, NextResponse } from 'next/server'

import { recordAchievementMint } from '@/lib/db/queries/achievements'
import { findUserByWalletAddress } from '@/lib/db/queries/users'

export async function POST(request: NextRequest) {
  try {
    const { to, achievementId, progress = 100 } = await request.json()

    if (!to || !achievementId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Find user by wallet address
    const user = await findUserByWalletAddress(to)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found for wallet address' },
        { status: 404 }
      )
    }

    // Generate a unique token ID based on timestamp and user ID
    const tokenId = Math.floor(Date.now() / 1000) + user.id

    // Generate a deterministic transaction hash for database tracking
    const txHash = `0x${Buffer.from(`${achievementId}-${user.id}-${Date.now()}`).toString('hex').padEnd(64, '0').slice(0, 64)}`

    // Record the achievement mint in database
    await recordAchievementMint(user.id, String(achievementId), tokenId, txHash)

    console.log(
      `Achievement ${achievementId} minted for user ${user.id} with progress ${progress}`
    )

    return NextResponse.json({
      tokenId,
      txHash
    })
  } catch (error) {
    console.error('Error minting achievement:', error)
    return NextResponse.json(
      { error: 'Failed to mint achievement' },
      { status: 500 }
    )
  }
}
