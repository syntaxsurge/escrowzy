import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { getUserAchievements } from '@/lib/db/queries/achievements'
import { checkAllAchievements } from '@/services/achievement-triggers'
import {
  getMilestoneProgress,
  getEarningsProgress
} from '@/services/milestone-achievements'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check for any new achievements
    const newAchievements = await checkAllAchievements(userId)

    // Get all user achievements
    const { owned, achievements } = await getUserAchievements(userId)

    // Get progress towards next milestones
    const [jobProgress, earningsProgress] = await Promise.all([
      getMilestoneProgress(userId),
      getEarningsProgress(userId)
    ])

    return NextResponse.json({
      newAchievements,
      ownedAchievements: owned,
      allAchievements: achievements,
      progress: {
        jobs: jobProgress,
        earnings: earningsProgress
      }
    })
  } catch (error) {
    console.error('Error checking achievements:', error)
    return NextResponse.json(
      { error: 'Failed to check achievements' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Force check all achievements
    const newAchievements = await checkAllAchievements(userId)

    if (newAchievements.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Congratulations! You earned ${newAchievements.length} new achievement(s)!`,
        achievements: newAchievements
      })
    }

    return NextResponse.json({
      success: true,
      message: 'No new achievements earned',
      achievements: []
    })
  } catch (error) {
    console.error('Error checking achievements:', error)
    return NextResponse.json(
      { error: 'Failed to check achievements' },
      { status: 500 }
    )
  }
}
