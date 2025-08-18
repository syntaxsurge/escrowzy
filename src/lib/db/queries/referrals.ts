import { desc, eq, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import { referralConversions, referralLinks, users } from '../schema'

export async function getReferralStats(userId: number) {
  // Get all referral links for user
  const links = await db
    .select()
    .from(referralLinks)
    .where(eq(referralLinks.userId, userId))

  // Get all conversions
  const conversions = await db
    .select({
      totalConversions: sql<number>`count(*)::int`,
      activeConversions: sql<number>`count(case when ${referralConversions.referrerRewardStatus} = 'paid' then 1 end)::int`,
      totalEarnings: sql<string>`'0'`,
      pendingEarnings: sql<string>`'0'`,
      totalValue: sql<string>`'0'`
    })
    .from(referralConversions)
    .where(eq(referralConversions.referrerId, userId))

  // Calculate total clicks
  const totalClicks = links.reduce(
    (sum, link) => sum + (link.clickCount || 0),
    0
  )
  const totalConversions = links.reduce(
    (sum, link) => sum + (link.conversionCount || 0),
    0
  )

  const stats = conversions[0]
  const conversionRate =
    totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

  // Determine referral tier based on total referrals
  let currentTier = 'Bronze'
  let nextTierProgress = 0

  if (totalConversions >= 31) {
    currentTier = 'Platinum'
    nextTierProgress = 100
  } else if (totalConversions >= 16) {
    currentTier = 'Gold'
    nextTierProgress = ((totalConversions - 16) / 15) * 100
  } else if (totalConversions >= 6) {
    currentTier = 'Silver'
    nextTierProgress = ((totalConversions - 6) / 10) * 100
  } else {
    currentTier = 'Bronze'
    nextTierProgress = (totalConversions / 6) * 100
  }

  // Calculate lifetime value
  const lifetimeValue = stats?.totalValue || '0'

  return {
    totalReferrals: totalConversions,
    activeReferrals: stats?.activeConversions || 0,
    totalEarnings: stats?.totalEarnings || '0',
    pendingEarnings: stats?.pendingEarnings || '0',
    conversionRate,
    totalClicks,
    lifetimeValue,
    currentTier,
    nextTierProgress
  }
}

export async function getReferralLinks(userId: number) {
  const links = await db
    .select()
    .from(referralLinks)
    .where(eq(referralLinks.userId, userId))
    .orderBy(desc(referralLinks.createdAt))

  return links
}

export async function getReferredUsers(userId: number) {
  const referrals = await db
    .select({
      id: referralConversions.id,
      referredUser: users.walletAddress,
      status: referralConversions.referrerRewardStatus,
      joinedAt: referralConversions.createdAt,
      earnings: sql<string>`'0'`,
      trades: sql<number>`0` // This would need to be calculated from actual trades
    })
    .from(referralConversions)
    .innerJoin(users, eq(users.id, referralConversions.refereeId))
    .where(eq(referralConversions.referrerId, userId))
    .orderBy(desc(referralConversions.createdAt))

  return referrals
}

export async function generateReferralLink(
  userId: number,
  campaignSource?: string,
  customSlug?: string
) {
  // Generate unique code
  const randomCode = Math.random().toString(36).substring(2, 12).toUpperCase()
  const code = customSlug || `REF${randomCode}`

  // Check if code already exists
  const existing = await db
    .select()
    .from(referralLinks)
    .where(eq(referralLinks.code, code))
    .limit(1)

  if (existing.length > 0) {
    // Recursively generate a new code
    return generateReferralLink(userId, campaignSource)
  }

  const [link] = await db
    .insert(referralLinks)
    .values({
      userId,
      code,
      customAlias: customSlug,
      clickCount: 0,
      conversionCount: 0,
      metadata: { source: campaignSource },
      isActive: true
    })
    .returning()

  return link
}

export async function trackReferralClick(code: string) {
  await db
    .update(referralLinks)
    .set({
      clickCount: sql`${referralLinks.clickCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(referralLinks.code, code))
}

export async function createReferralConversion(
  code: string,
  refereeId: number
) {
  // Get referral link
  const link = await db
    .select()
    .from(referralLinks)
    .where(eq(referralLinks.code, code))
    .limit(1)

  if (!link.length || !link[0].isActive) {
    return null
  }

  const referralLink = link[0]

  // Check if user was already referred
  const existing = await db
    .select()
    .from(referralConversions)
    .where(eq(referralConversions.refereeId, refereeId))
    .limit(1)

  if (existing.length > 0) {
    return null // User was already referred
  }

  // Create conversion
  const [conversion] = await db
    .insert(referralConversions)
    .values({
      referralLinkId: referralLink.id,
      referrerId: referralLink.userId,
      refereeId,
      conversionType: 'signup',
      referrerRewardStatus: 'pending',
      refereeRewardStatus: 'pending'
    })
    .returning()

  // Update link conversions count
  await db
    .update(referralLinks)
    .set({
      conversionCount: sql`${referralLinks.conversionCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(referralLinks.id, referralLink.id))

  return conversion
}

// Function removed - columns don't exist in schema
// export async function updateReferralCommission(

export async function getReferralLeaderboard(limit = 10) {
  const leaderboard = await db
    .select({
      userId: referralConversions.referrerId,
      username: users.name,
      referralCount: sql<number>`count(*)::int`,
      totalEarnings: sql<string>`'0'`
    })
    .from(referralConversions)
    .innerJoin(users, eq(users.id, referralConversions.referrerId))
    .where(eq(referralConversions.referrerRewardStatus, 'completed'))
    .groupBy(referralConversions.referrerId, users.name)
    .orderBy(desc(sql`count(*)`))
    .limit(limit)

  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    username: entry.username || `User ${entry.userId}`,
    referralCount: entry.referralCount,
    totalEarnings: entry.totalEarnings || '0'
  }))
}
