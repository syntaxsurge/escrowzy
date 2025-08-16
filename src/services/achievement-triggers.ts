import 'server-only'

import {
  userHasAchievement,
  recordAchievementMint
} from '@/lib/db/queries/achievements'
import {
  getFreelancerReviews,
  getClientReviews
} from '@/lib/db/queries/reviews'
import { findUserById } from '@/lib/db/queries/users'

import { mintAchievementNFT } from './blockchain/achievement-nft.service'

export type TriggerEvent =
  | 'review_submitted'
  | 'job_completed'
  | 'trade_completed'
  | 'battle_won'
  | 'milestone_completed'
  | 'skill_endorsed'
  | 'rating_milestone'
  | 'reputation_milestone'
  | 'review_milestone'
  | 'perfect_rating'
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
  },
  {
    id: 'TRUSTED_EXPERT',
    name: 'Trusted Expert',
    check: async (userId: number) => {
      const { TrustScoreService } = await import('./trust-score')
      const service = new TrustScoreService()
      const score = await service.calculateTrustScore(userId)
      return score.level === 'diamond'
    }
  }
]

// Milestone achievements
const MILESTONE_ACHIEVEMENTS: AchievementCondition[] = [
  {
    id: 'FIRST_JOB',
    name: 'First Job',
    check: async (userId: number) => {
      const { getFreelancerStats } = await import(
        '@/lib/db/queries/freelancers'
      )
      const stats = await getFreelancerStats(userId)
      return stats.completedJobs >= 1
    }
  },
  {
    id: 'JOB_MILESTONE_10',
    name: 'Rising Freelancer',
    check: async (userId: number) => {
      const { getFreelancerStats } = await import(
        '@/lib/db/queries/freelancers'
      )
      const stats = await getFreelancerStats(userId)
      return stats.completedJobs >= 10
    }
  },
  {
    id: 'JOB_MILESTONE_50',
    name: 'Experienced Professional',
    check: async (userId: number) => {
      const { getFreelancerStats } = await import(
        '@/lib/db/queries/freelancers'
      )
      const stats = await getFreelancerStats(userId)
      return stats.completedJobs >= 50
    }
  },
  {
    id: 'JOB_MILESTONE_100',
    name: 'Century Achiever',
    check: async (userId: number) => {
      const { getFreelancerStats } = await import(
        '@/lib/db/queries/freelancers'
      )
      const stats = await getFreelancerStats(userId)
      return stats.completedJobs >= 100
    }
  },
  {
    id: 'EARNINGS_MILESTONE_1K',
    name: 'First Thousand',
    check: async (userId: number) => {
      const { getFreelancerStats } = await import(
        '@/lib/db/queries/freelancers'
      )
      const stats = await getFreelancerStats(userId)
      return parseFloat(stats.totalEarnings) >= 1000
    }
  },
  {
    id: 'EARNINGS_MILESTONE_10K',
    name: 'Five Figures',
    check: async (userId: number) => {
      const { getFreelancerStats } = await import(
        '@/lib/db/queries/freelancers'
      )
      const stats = await getFreelancerStats(userId)
      return parseFloat(stats.totalEarnings) >= 10000
    }
  },
  {
    id: 'EARNINGS_MILESTONE_100K',
    name: 'Six Figures',
    check: async (userId: number) => {
      const { getFreelancerStats } = await import(
        '@/lib/db/queries/freelancers'
      )
      const stats = await getFreelancerStats(userId)
      return parseFloat(stats.totalEarnings) >= 100000
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
    case 'milestone_completed':
      achievementsToCheck = [...REVIEW_ACHIEVEMENTS, ...MILESTONE_ACHIEVEMENTS]
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
          const user = await findUserById(userId)
          if (!user?.walletAddress) continue

          const { tokenId, txHash } = await mintAchievementNFT(
            user.walletAddress,
            achievement.id
          )

          await recordAchievementMint(
            userId,
            achievement.id,
            tokenId || 0,
            txHash || ''
          )

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
    ...REPUTATION_ACHIEVEMENTS,
    ...MILESTONE_ACHIEVEMENTS
  ]

  const awardedAchievements: string[] = []

  for (const achievement of allAchievements) {
    try {
      const hasAchievement = await userHasAchievement(userId, achievement.id)

      if (!hasAchievement) {
        const meetsCondition = await achievement.check(userId)

        if (meetsCondition) {
          const user = await findUserById(userId)
          if (!user?.walletAddress) continue

          const { tokenId, txHash } = await mintAchievementNFT(
            user.walletAddress,
            achievement.id
          )

          await recordAchievementMint(
            userId,
            achievement.id,
            tokenId || 0,
            txHash || ''
          )

          awardedAchievements.push(achievement.id)
        }
      }
    } catch (error) {
      console.error(`Error checking achievement ${achievement.id}:`, error)
    }
  }

  return awardedAchievements
}
