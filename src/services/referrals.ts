import {
  generateReferralLink,
  trackReferralClick,
  getReferralStats,
  getReferralLeaderboard
} from '@/lib/db/queries/referrals'
import { findUserById } from '@/lib/db/queries/users'
import { sendEmail } from '@/lib/email'

import {
  checkAndAwardAchievements,
  type TriggerEvent
} from './achievement-triggers'
import { RewardsService } from './rewards'

export class ReferralService {
  private rewardsService: RewardsService

  constructor() {
    this.rewardsService = new RewardsService()
  }

  async createReferralLink(userId: number): Promise<string> {
    const result = await generateReferralLink(userId, 'signup')
    if (!result || !result.code) {
      throw new Error('Failed to generate referral code')
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return `${baseUrl}/signup?ref=${result.code}`
  }

  async processReferralSignup(
    referralCode: string,
    newUserId: number
  ): Promise<{ success: boolean; message: string }> {
    // Track the referral click
    await trackReferralClick(referralCode)

    // Create conversion (this needs to be implemented based on your needs)
    const result = {
      success: true,
      referrerId: null as number | null,
      message: 'Referral tracked successfully'
    }

    if (result.success && result.referrerId) {
      // Award signup bonus to referrer
      await this.rewardsService.addXP(
        result.referrerId,
        100,
        'Referral signup bonus'
      )

      // Send notification to referrer
      const referrer = await findUserById(result.referrerId)
      if (referrer?.email) {
        await sendEmail({
          to: referrer.email,
          subject: 'Your referral just joined!',
          html: `
            <h2>Congratulations!</h2>
            <p>Someone just signed up using your referral link!</p>
            <p>You've earned 100 XP as a signup bonus.</p>
            <p>You'll earn more rewards when they:</p>
            <ul>
              <li>Verify their email (50 XP)</li>
              <li>Complete their first job (200 XP)</li>
              <li>Submit their first review (150 XP)</li>
            </ul>
            <p>Keep sharing your referral link to earn more rewards!</p>
          `
        })
      }

      // Check for referral milestones
      await this.checkReferralMilestones(result.referrerId)
    }

    return result
  }

  async onUserEmailVerified(userId: number): Promise<void> {
    // Check if user was referred
    const referrerId = await this.getReferrerId(userId)
    if (!referrerId) return

    // Award email verification bonus
    const claimResult = await this.addReferralReward(
      referrerId,
      userId,
      'emailVerified',
      50
    )

    if (claimResult.success) {
      // Update referral status to active - this would need to be implemented
      // based on your actual referral tracking needs
    }
  }

  async onUserFirstJob(userId: number): Promise<void> {
    const referrerId = await this.getReferrerId(userId)
    if (!referrerId) return

    await this.addReferralReward(referrerId, userId, 'firstJob', 200)

    // Award achievement
    await checkAndAwardAchievements(referrerId, 'referral_first_job')
  }

  async onUserFirstReview(userId: number): Promise<void> {
    const referrerId = await this.getReferrerId(userId)
    if (!referrerId) return

    await this.addReferralReward(referrerId, userId, 'firstReview', 150)
  }

  private async getReferrerId(userId: number): Promise<number | null> {
    try {
      const { db } = await import('@/lib/db/drizzle')
      const { userGameData } = await import('@/lib/db/schema')
      const { eq } = await import('drizzle-orm')

      const [userData] = await db
        .select()
        .from(userGameData)
        .where(eq(userGameData.userId, userId))
        .limit(1)

      const stats = (userData?.stats || {}) as any
      return stats.referredBy?.userId || null
    } catch (error) {
      console.error('Error getting referrer ID:', error)
      return null
    }
  }

  private async addReferralReward(
    referrerId: number,
    referredUserId: number,
    rewardType: string,
    xpAmount: number
  ): Promise<{ success: boolean }> {
    try {
      // First store the reward as pending
      const { db } = await import('@/lib/db/drizzle')
      const { userGameData } = await import('@/lib/db/schema')
      const { eq } = await import('drizzle-orm')

      const [userData] = await db
        .select()
        .from(userGameData)
        .where(eq(userGameData.userId, referrerId))
        .limit(1)

      const currentStats = (userData?.stats || {}) as any
      const referralStats = currentStats.referral || {}
      const referrals = referralStats.referrals || []

      const referralIndex = referrals.findIndex(
        (r: any) => r.userId === referredUserId
      )
      if (referralIndex === -1) {
        return { success: false }
      }

      // Add new reward type if not exists
      if (!referrals[referralIndex].rewards) {
        referrals[referralIndex].rewards = {}
      }

      referrals[referralIndex].rewards[rewardType] = {
        claimed: false,
        amount: xpAmount
      }

      const updatedStats = {
        ...currentStats,
        referral: {
          ...referralStats,
          referrals,
          pendingRewards: this.calculatePendingRewards(referrals)
        }
      }

      await db
        .update(userGameData)
        .set({
          stats: updatedStats,
          updatedAt: new Date()
        })
        .where(eq(userGameData.userId, referrerId))

      // Auto-claim the reward
      const claimResult = { success: true, xpAwarded: xpAmount }

      if (claimResult.success && claimResult.xpAwarded) {
        await this.rewardsService.addXP(
          referrerId,
          claimResult.xpAwarded,
          `Referral reward: ${rewardType}`
        )
      }

      return { success: true }
    } catch (error) {
      console.error('Error adding referral reward:', error)
      return { success: false }
    }
  }

  private calculatePendingRewards(referrals: any[]): number {
    let total = 0

    for (const referral of referrals) {
      if (referral.rewards) {
        for (const reward of Object.values(referral.rewards)) {
          const r = reward as any
          if (!r.claimed) {
            total += r.amount
          }
        }
      }
    }

    return total
  }

  private async checkReferralMilestones(userId: number): Promise<void> {
    const program = await getReferralStats(userId)

    const milestones = [
      { count: 5, xp: 500, achievement: 'referral_milestone_5' },
      { count: 10, xp: 1000, achievement: 'referral_milestone_10' },
      { count: 25, xp: 2500, achievement: 'referral_milestone_25' },
      { count: 50, xp: 5000, achievement: 'referral_milestone_50' }
    ]

    for (const milestone of milestones) {
      if (program.activeReferrals === milestone.count) {
        await this.rewardsService.addXP(
          userId,
          milestone.xp,
          `Referral milestone: ${milestone.count} active referrals!`
        )

        await checkAndAwardAchievements(
          userId,
          milestone.achievement as TriggerEvent
        )

        // Send congratulations email
        const user = await findUserById(userId)
        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: `Milestone reached: ${milestone.count} referrals!`,
            html: `
              <h2>Congratulations!</h2>
              <p>You've reached ${milestone.count} active referrals!</p>
              <p>You've been awarded ${milestone.xp} XP for this achievement.</p>
              <p>Your tier level: ${program.currentTier?.toUpperCase() || 'BRONZE'}</p>
              <p>Keep going to unlock more rewards!</p>
            `
          })
        }
      }
    }
  }

  async getReferralDashboard(userId: number) {
    const program = await getReferralStats(userId)
    const leaderboard = await getReferralLeaderboard(5)
    const referralLink = await this.createReferralLink(userId)

    // Calculate tier benefits
    const tierBenefits: Record<string, { bonus: string; perks: string }> = {
      bronze: { bonus: '0%', perks: 'Base rewards' },
      silver: { bonus: '10%', perks: 'Priority support' },
      gold: { bonus: '20%', perks: 'Premium features' },
      platinum: { bonus: '30%', perks: 'VIP treatment' }
    }

    return {
      program,
      referralLink,
      leaderboard,
      tierBenefits:
        tierBenefits[program.currentTier?.toLowerCase() || 'bronze'],
      nextTier: this.getNextTier(program.currentTier || 'bronze'),
      referralsToNextTier: this.getReferralsToNextTier(
        program.activeReferrals,
        program.currentTier || 'bronze'
      )
    }
  }

  private getNextTier(currentTier: string): string | null {
    const tiers = ['bronze', 'silver', 'gold', 'platinum']
    const currentIndex = tiers.indexOf(currentTier)
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null
  }

  private getReferralsToNextTier(
    activeReferrals: number,
    currentTier: string
  ): number {
    const requirements: Record<string, number> = {
      bronze: 10,
      silver: 25,
      gold: 50,
      platinum: 999999
    }

    return requirements[currentTier] - activeReferrals
  }
}
