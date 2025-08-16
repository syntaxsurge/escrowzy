import 'server-only'

import {
  userHasAchievement,
  recordAchievementMint
} from '@/lib/db/queries/achievements'
import {
  getFreelancerReviews,
  getClientReviews
} from '@/lib/db/queries/reviews'

import { mintAchievementNFT } from './blockchain/achievement-nft.service'

export type TriggerEvent =
  | 'review_submitted'
  | 'job_completed'
  | 'trade_completed'
  | 'battle_won'
  | 'milestone_completed'
  | 'skill_endorsed'
  | 'rating_milestone'
  | 'referral_first_job'
  | 'referral_milestone_5'
  | 'referral_milestone_10'
  | 'referral_milestone_25'
  | 'referral_milestone_50'
  | 'review_streak_3'
  | 'review_streak_7'
  | 'review_streak_14'
  | 'review_streak_30'
  | 'review_streak_50'
  | 'review_streak_100'

interface AchievementCondition {
  id: string
  name: string
  check: (userId: number) => Promise<boolean>
}

const REVIEW_ACHIEVEMENTS: AchievementCondition[] = [
  {
    id: 'FIVE_STAR_FREELANCER',
    name: '5-Star Freelancer',
    check: async (userId: number) => {
      const { stats } = await getFreelancerReviews(userId)
      return stats.totalReviews >= 10 && stats.averageRating >= 4.8
    }
  },
  {
    id: 'PERFECT_CLIENT',
    name: 'Perfect Client',
    check: async (userId: number) => {
      const { stats } = await getClientReviews(userId)
      return stats.totalReviews >= 10 && stats.averageRating >= 4.9
    }
  },
  {
    id: 'REVIEW_CHAMPION',
    name: 'Review Champion',
    check: async (userId: number) => {
      const [freelancerStats, clientStats] = await Promise.all([
        getFreelancerReviews(userId),
        getClientReviews(userId)
      ])
      const totalWritten =
        freelancerStats.stats.totalReviews + clientStats.stats.totalReviews
      return totalWritten >= 50
    }
  },
  {
    id: 'TRUSTED_EXPERT',
    name: 'Trusted Expert',
    check: async (userId: number) => {
      const { stats } = await getFreelancerReviews(userId)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      return stats.totalReviews >= 25 && stats.averageRating >= 4.5
    }
  }
]

const SKILL_ACHIEVEMENTS: AchievementCondition[] = [
  {
    id: 'SKILL_MASTER',
    name: 'Skill Master',
    check: async (userId: number) => {
      const { stats } = await getFreelancerReviews(userId)
      const skillRatings = stats.detailedRatings

      if (!skillRatings) return false

      const highRatedSkills = Object.values(skillRatings).filter(
        rating => rating >= 4.5
      )
      return highRatedSkills.length >= 10
    }
  }
]

const REPUTATION_ACHIEVEMENTS: AchievementCondition[] = [
  {
    id: 'REPUTATION_LEGEND',
    name: 'Reputation Legend',
    check: async (userId: number) => {
      const { stats } = await getFreelancerReviews(userId)
      return stats.totalReviews >= 100 && stats.averageRating >= 4.7
    }
  }
]

export async function checkAndAwardAchievements(
  userId: number,
  event: TriggerEvent
): Promise<string[]> {
  const awardedAchievements: string[] = []

  let achievementsToCheck: AchievementCondition[] = []

  switch (event) {
    case 'review_submitted':
    case 'rating_milestone':
      achievementsToCheck = [...REVIEW_ACHIEVEMENTS, ...REPUTATION_ACHIEVEMENTS]
      break
    case 'skill_endorsed':
      achievementsToCheck = SKILL_ACHIEVEMENTS
      break
    case 'job_completed':
      achievementsToCheck = [...REVIEW_ACHIEVEMENTS]
      break
    default:
      return awardedAchievements
  }

  for (const achievement of achievementsToCheck) {
    try {
      const hasAchievement = await userHasAchievement(userId, achievement.id)

      if (!hasAchievement) {
        const meetsCondition = await achievement.check(userId)

        if (meetsCondition) {
          const { tokenId, txHash } = await mintAchievementNFT(
            userId,
            achievement.id
          )

          await recordAchievementMint(userId, achievement.id, tokenId, txHash)

          awardedAchievements.push(achievement.id)
        }
      }
    } catch (error) {
      console.error(`Error checking achievement ${achievement.id}:`, error)
    }
  }

  return awardedAchievements
}

export async function checkAllAchievements(userId: number): Promise<string[]> {
  const allAchievements = [
    ...REVIEW_ACHIEVEMENTS,
    ...SKILL_ACHIEVEMENTS,
    ...REPUTATION_ACHIEVEMENTS
  ]

  const awardedAchievements: string[] = []

  for (const achievement of allAchievements) {
    try {
      const hasAchievement = await userHasAchievement(userId, achievement.id)

      if (!hasAchievement) {
        const meetsCondition = await achievement.check(userId)

        if (meetsCondition) {
          const { tokenId, txHash } = await mintAchievementNFT(
            userId,
            achievement.id
          )

          await recordAchievementMint(userId, achievement.id, tokenId, txHash)

          awardedAchievements.push(achievement.id)
        }
      }
    } catch (error) {
      console.error(`Error checking achievement ${achievement.id}:`, error)
    }
  }

  return awardedAchievements
}
