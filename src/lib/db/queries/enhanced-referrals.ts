import 'server-only'

import { and, asc, desc, eq, gt, gte, lt, lte, or, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  referralCampaigns,
  referralLinks,
  referralConversions,
  users,
  userGameData,
  type ReferralCampaign,
  type ReferralLink,
  type ReferralConversion,
  type NewReferralCampaign,
  type NewReferralLink,
  type NewReferralConversion
} from '../schema'

// Create referral campaign
export async function createReferralCampaign(
  data: NewReferralCampaign
): Promise<ReferralCampaign> {
  const [campaign] = await db
    .insert(referralCampaigns)
    .values(data)
    .returning()

  return campaign
}

// Get active referral campaigns
export async function getActiveReferralCampaigns() {
  const now = new Date()

  return await db
    .select()
    .from(referralCampaigns)
    .where(
      and(
        eq(referralCampaigns.isActive, true),
        or(
          sql`${referralCampaigns.startDate} is null`,
          lte(referralCampaigns.startDate, now)
        ),
        or(
          sql`${referralCampaigns.endDate} is null`,
          gte(referralCampaigns.endDate, now)
        ),
        or(
          sql`${referralCampaigns.maxUses} is null`,
          gt(sql`${referralCampaigns.maxUses} - ${referralCampaigns.usedCount}`, 0)
        )
      )
    )
    .orderBy(desc(referralCampaigns.createdAt))
}

// Get referral campaign by code
export async function getReferralCampaignByCode(code: string) {
  const [campaign] = await db
    .select()
    .from(referralCampaigns)
    .where(eq(referralCampaigns.code, code))
    .limit(1)

  return campaign
}

// Create or get user's referral link
export async function createOrGetReferralLink(
  userId: number,
  campaignId?: number
): Promise<ReferralLink> {
  // Check for existing link
  const existing = await db
    .select()
    .from(referralLinks)
    .where(
      and(
        eq(referralLinks.userId, userId),
        campaignId
          ? eq(referralLinks.campaignId, campaignId)
          : sql`${referralLinks.campaignId} is null`,
        eq(referralLinks.isActive, true)
      )
    )
    .limit(1)

  if (existing[0]) {
    return existing[0]
  }

  // Generate unique code
  const code = await generateUniqueReferralCode(userId)

  // Create new link
  const [link] = await db
    .insert(referralLinks)
    .values({
      userId,
      campaignId,
      code,
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'manual'
      }
    })
    .returning()

  return link
}

// Generate unique referral code
async function generateUniqueReferralCode(userId: number): Promise<string> {
  let code: string
  let attempts = 0
  const maxAttempts = 10

  do {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    code = `REF${userId}${randomPart}`

    const existing = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.code, code))
      .limit(1)

    if (existing.length === 0) {
      return code
    }

    attempts++
  } while (attempts < maxAttempts)

  throw new Error('Failed to generate unique referral code')
}

// Track referral link click
export async function trackReferralClick(code: string) {
  await db
    .update(referralLinks)
    .set({
      clickCount: sql`${referralLinks.clickCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(referralLinks.code, code))
}

// Track referral conversion
export async function trackReferralConversion(
  code: string,
  refereeId: number,
  conversionType: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
): Promise<ReferralConversion | null> {
  // Get referral link
  const [link] = await db
    .select()
    .from(referralLinks)
    .where(eq(referralLinks.code, code))
    .limit(1)

  if (!link || !link.isActive) {
    return null
  }

  // Check if already converted
  const existingConversion = await db
    .select()
    .from(referralConversions)
    .where(
      and(
        eq(referralConversions.referralLinkId, link.id),
        eq(referralConversions.refereeId, refereeId),
        eq(referralConversions.conversionType, conversionType)
      )
    )
    .limit(1)

  if (existingConversion[0]) {
    return existingConversion[0]
  }

  // Get campaign if exists
  let campaign: ReferralCampaign | null = null
  if (link.campaignId) {
    [campaign] = await db
      .select()
      .from(referralCampaigns)
      .where(eq(referralCampaigns.id, link.campaignId))
      .limit(1)
  }

  // Calculate rewards
  const referrerReward = campaign?.referrerReward || { xp: 100 }
  const refereeReward = campaign?.refereeReward || { xp: 50 }

  // Create conversion
  const [conversion] = await db
    .insert(referralConversions)
    .values({
      referralLinkId: link.id,
      referrerId: link.userId,
      refereeId,
      campaignId: link.campaignId,
      conversionType,
      referrerRewardAmount: referrerReward,
      refereeRewardAmount: refereeReward,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    })
    .returning()

  // Update link conversion count
  await db
    .update(referralLinks)
    .set({
      conversionCount: sql`${referralLinks.conversionCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(referralLinks.id, link.id))

  // Update campaign usage if applicable
  if (campaign) {
    await db
      .update(referralCampaigns)
      .set({
        usedCount: sql`${referralCampaigns.usedCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(referralCampaigns.id, campaign.id))
  }

  return conversion
}

// Get user's referral stats
export async function getUserReferralStats(userId: number) {
  const links = await db
    .select()
    .from(referralLinks)
    .where(eq(referralLinks.userId, userId))

  const linkIds = links.map(l => l.id)

  const conversions = linkIds.length > 0
    ? await db
        .select()
        .from(referralConversions)
        .where(sql`${referralConversions.referralLinkId} in (${sql.join(linkIds, sql`, `)})`)
    : []

  const totalClicks = links.reduce((sum, link) => sum + link.clickCount, 0)
  const totalConversions = conversions.length
  const totalEarnings = links.reduce((sum, link) => {
    const earnings = link.totalEarnings
    return sum + (typeof earnings === 'string' ? parseFloat(earnings) : earnings || 0)
  }, 0)

  const pendingRewards = conversions.filter(
    c => c.referrerRewardStatus === 'pending'
  ).length

  const claimedRewards = conversions.filter(
    c => c.referrerRewardStatus === 'paid'
  ).length

  return {
    totalLinks: links.length,
    activeLinks: links.filter(l => l.isActive).length,
    totalClicks,
    totalConversions,
    conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    totalEarnings,
    pendingRewards,
    claimedRewards,
    links,
    recentConversions: conversions
      .sort((a, b) => b.convertedAt.getTime() - a.convertedAt.getTime())
      .slice(0, 10)
  }
}

// Process referral rewards
export async function processReferralReward(
  conversionId: number,
  rewardType: 'referrer' | 'referee'
): Promise<void> {
  const [conversion] = await db
    .select()
    .from(referralConversions)
    .where(eq(referralConversions.id, conversionId))
    .limit(1)

  if (!conversion) {
    throw new Error('Conversion not found')
  }

  const statusField = rewardType === 'referrer' 
    ? 'referrerRewardStatus' 
    : 'refereeRewardStatus'
  
  const amountField = rewardType === 'referrer'
    ? 'referrerRewardAmount'
    : 'refereeRewardAmount'

  const userId = rewardType === 'referrer' 
    ? conversion.referrerId 
    : conversion.refereeId

  // Get reward amount
  const rewardAmount = conversion[amountField] as any

  // Update user's game data with XP
  if (rewardAmount?.xp) {
    const [userData] = await db
      .select()
      .from(userGameData)
      .where(eq(userGameData.userId, userId))
      .limit(1)

    if (userData) {
      await db
        .update(userGameData)
        .set({
          xp: sql`${userGameData.xp} + ${rewardAmount.xp}`,
          updatedAt: new Date()
        })
        .where(eq(userGameData.userId, userId))
    }
  }

  // Update conversion status
  await db
    .update(referralConversions)
    .set({
      [statusField]: 'paid'
    })
    .where(eq(referralConversions.id, conversionId))

  // Update referral link earnings
  if (rewardType === 'referrer' && rewardAmount?.credit) {
    await db
      .update(referralLinks)
      .set({
        totalEarnings: sql`${referralLinks.totalEarnings} + ${rewardAmount.credit}`,
        updatedAt: new Date()
      })
      .where(eq(referralLinks.id, conversion.referralLinkId))
  }
}

// Get referral leaderboard
export async function getReferralLeaderboard(limit = 10) {
  const stats = await db
    .select({
      user: users,
      linkCount: sql<number>`count(distinct ${referralLinks.id})`,
      totalConversions: sql<number>`sum(${referralLinks.conversionCount})`,
      totalEarnings: sql<number>`sum(${referralLinks.totalEarnings})`,
      totalClicks: sql<number>`sum(${referralLinks.clickCount})`
    })
    .from(referralLinks)
    .innerJoin(users, eq(referralLinks.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(sql`sum(${referralLinks.conversionCount})`))
    .limit(limit)

  return stats.map((stat, index) => ({
    rank: index + 1,
    user: stat.user,
    stats: {
      linkCount: stat.linkCount,
      totalConversions: stat.totalConversions,
      totalEarnings: stat.totalEarnings,
      totalClicks: stat.totalClicks,
      conversionRate: stat.totalClicks > 0 
        ? (stat.totalConversions / stat.totalClicks) * 100 
        : 0
    }
  }))
}

// Create custom referral link alias
export async function createReferralAlias(
  userId: number,
  linkId: number,
  alias: string
): Promise<ReferralLink> {
  // Check if alias is already taken
  const existing = await db
    .select()
    .from(referralLinks)
    .where(eq(referralLinks.customAlias, alias))
    .limit(1)

  if (existing[0]) {
    throw new Error('Alias already taken')
  }

  // Verify ownership
  const [link] = await db
    .select()
    .from(referralLinks)
    .where(
      and(
        eq(referralLinks.id, linkId),
        eq(referralLinks.userId, userId)
      )
    )
    .limit(1)

  if (!link) {
    throw new Error('Link not found or unauthorized')
  }

  // Update alias
  const [updated] = await db
    .update(referralLinks)
    .set({
      customAlias: alias,
      updatedAt: new Date()
    })
    .where(eq(referralLinks.id, linkId))
    .returning()

  return updated
}

// Get referral link by code or alias
export async function getReferralLink(codeOrAlias: string) {
  const [link] = await db
    .select()
    .from(referralLinks)
    .where(
      and(
        or(
          eq(referralLinks.code, codeOrAlias),
          eq(referralLinks.customAlias, codeOrAlias)
        ),
        eq(referralLinks.isActive, true)
      )
    )
    .limit(1)

  return link
}