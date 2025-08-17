import 'server-only'

import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  partners,
  partnerCommissions,
  users,
  type Partner,
  type PartnerCommission,
  type NewPartner,
  type NewPartnerCommission
} from '../schema'

// Create partner
export async function createPartner(data: NewPartner): Promise<Partner> {
  // Generate API key
  const apiKey = generateApiKey()

  const [partner] = await db
    .insert(partners)
    .values({
      ...data,
      apiKey
    })
    .returning()

  return partner
}

// Generate unique API key
function generateApiKey(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `pk_${timestamp}_${randomPart}`
}

// Get partner by ID
export async function getPartner(id: number) {
  const [partner] = await db
    .select()
    .from(partners)
    .where(eq(partners.id, id))
    .limit(1)

  return partner
}

// Get partner by API key
export async function getPartnerByApiKey(apiKey: string) {
  const [partner] = await db
    .select()
    .from(partners)
    .where(and(eq(partners.apiKey, apiKey), eq(partners.status, 'active')))
    .limit(1)

  return partner
}

// Get all partners
export async function getPartners(status?: string) {
  const conditions = status ? [eq(partners.status, status)] : []

  return await db
    .select({
      partner: partners,
      approvedByUser: users
    })
    .from(partners)
    .leftJoin(users, eq(partners.approvedBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(partners.createdAt))
}

// Update partner
export async function updatePartner(
  id: number,
  data: Partial<NewPartner>
): Promise<Partner> {
  const [updated] = await db
    .update(partners)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(partners.id, id))
    .returning()

  return updated
}

// Approve partner
export async function approvePartner(
  id: number,
  approvedBy: number
): Promise<Partner> {
  const [approved] = await db
    .update(partners)
    .set({
      status: 'active',
      approvedAt: new Date(),
      approvedBy,
      updatedAt: new Date()
    })
    .where(eq(partners.id, id))
    .returning()

  return approved
}

// Suspend partner
export async function suspendPartner(
  id: number,
  reason: string
): Promise<Partner> {
  const [suspended] = await db
    .update(partners)
    .set({
      status: 'suspended',
      notes: sql`${partners.notes} || E'\n\nSuspended: ' || ${reason}`,
      updatedAt: new Date()
    })
    .where(eq(partners.id, id))
    .returning()

  return suspended
}

// Regenerate partner API key
export async function regeneratePartnerApiKey(id: number): Promise<string> {
  const newApiKey = generateApiKey()

  await db
    .update(partners)
    .set({
      apiKey: newApiKey,
      updatedAt: new Date()
    })
    .where(eq(partners.id, id))

  return newApiKey
}

// Track partner commission
export async function trackPartnerCommission(
  data: NewPartnerCommission
): Promise<PartnerCommission> {
  const [commission] = await db
    .insert(partnerCommissions)
    .values(data)
    .returning()

  // Update partner's total revenue and referrals
  const partner = await getPartner(data.partnerId)
  if (partner) {
    const totalRevenue =
      parseFloat(partner.totalRevenue) + parseFloat(data.amount)

    await db
      .update(partners)
      .set({
        totalRevenue: totalRevenue.toString(),
        totalReferrals: sql`${partners.totalReferrals} + 1`,
        updatedAt: new Date()
      })
      .where(eq(partners.id, data.partnerId))
  }

  return commission
}

// Get partner commissions
export async function getPartnerCommissions(
  partnerId: number,
  status?: string,
  limit = 100
) {
  const conditions = [eq(partnerCommissions.partnerId, partnerId)]
  if (status) {
    conditions.push(eq(partnerCommissions.status, status))
  }

  return await db
    .select()
    .from(partnerCommissions)
    .where(and(...conditions))
    .orderBy(desc(partnerCommissions.createdAt))
    .limit(limit)
}

// Process partner commission payment
export async function processCommissionPayment(
  commissionId: number,
  paymentMethod: string,
  paymentReference: string
): Promise<PartnerCommission> {
  const [paid] = await db
    .update(partnerCommissions)
    .set({
      status: 'paid',
      paidAt: new Date(),
      paymentMethod,
      paymentReference,
      updatedAt: new Date()
    })
    .where(eq(partnerCommissions.id, commissionId))
    .returning()

  return paid
}

// Get partner stats
export async function getPartnerStats(partnerId: number) {
  const partner = await getPartner(partnerId)
  if (!partner) {
    throw new Error('Partner not found')
  }

  const commissions = await db
    .select({
      totalCommissions: sql<number>`count(*)`,
      pendingCommissions: sql<number>`count(case when ${partnerCommissions.status} = 'pending' then 1 end)`,
      paidCommissions: sql<number>`count(case when ${partnerCommissions.status} = 'paid' then 1 end)`,
      totalPending: sql<number>`sum(case when ${partnerCommissions.status} = 'pending' then ${partnerCommissions.commissionAmount} else 0 end)`,
      totalPaid: sql<number>`sum(case when ${partnerCommissions.status} = 'paid' then ${partnerCommissions.commissionAmount} else 0 end)`,
      totalRevenue: sql<number>`sum(${partnerCommissions.amount})`
    })
    .from(partnerCommissions)
    .where(eq(partnerCommissions.partnerId, partnerId))

  // Get monthly revenue
  const monthlyRevenue = await db
    .select({
      month: sql<string>`to_char(${partnerCommissions.createdAt}, 'YYYY-MM')`,
      revenue: sql<number>`sum(${partnerCommissions.amount})`,
      commissions: sql<number>`sum(${partnerCommissions.commissionAmount})`
    })
    .from(partnerCommissions)
    .where(
      and(
        eq(partnerCommissions.partnerId, partnerId),
        gte(partnerCommissions.createdAt, sql`now() - interval '12 months'`)
      )
    )
    .groupBy(sql`to_char(${partnerCommissions.createdAt}, 'YYYY-MM')`)
    .orderBy(desc(sql`to_char(${partnerCommissions.createdAt}, 'YYYY-MM')`))

  return {
    partner,
    summary: commissions[0] || {
      totalCommissions: 0,
      pendingCommissions: 0,
      paidCommissions: 0,
      totalPending: 0,
      totalPaid: 0,
      totalRevenue: 0
    },
    monthlyRevenue
  }
}

// Get pending commissions for all partners
export async function getPendingCommissions() {
  return await db
    .select({
      commission: partnerCommissions,
      partner: partners
    })
    .from(partnerCommissions)
    .innerJoin(partners, eq(partnerCommissions.partnerId, partners.id))
    .where(
      and(
        eq(partnerCommissions.status, 'pending'),
        eq(partners.status, 'active')
      )
    )
    .orderBy(asc(partnerCommissions.createdAt))
}

// Get partner leaderboard
export async function getPartnerLeaderboard(
  period: 'all' | 'month' | 'year' = 'month',
  limit = 10
) {
  let dateCondition = sql`true`

  if (period === 'month') {
    dateCondition = gte(
      partnerCommissions.createdAt,
      sql`now() - interval '1 month'`
    )
  } else if (period === 'year') {
    dateCondition = gte(
      partnerCommissions.createdAt,
      sql`now() - interval '1 year'`
    )
  }

  const leaderboard = await db
    .select({
      partner: partners,
      totalRevenue: sql<number>`sum(${partnerCommissions.amount})`,
      totalCommissions: sql<number>`sum(${partnerCommissions.commissionAmount})`,
      referralCount: sql<number>`count(${partnerCommissions.id})`
    })
    .from(partners)
    .leftJoin(
      partnerCommissions,
      and(eq(partnerCommissions.partnerId, partners.id), dateCondition)
    )
    .where(eq(partners.status, 'active'))
    .groupBy(partners.id)
    .orderBy(desc(sql`sum(${partnerCommissions.amount})`))
    .limit(limit)

  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    ...entry
  }))
}

// Calculate partner tier
export function calculatePartnerTier(
  totalRevenue: number,
  totalReferrals: number
): string {
  if (totalRevenue >= 100000 || totalReferrals >= 1000) {
    return 'platinum'
  } else if (totalRevenue >= 50000 || totalReferrals >= 500) {
    return 'gold'
  } else if (totalRevenue >= 10000 || totalReferrals >= 100) {
    return 'silver'
  } else {
    return 'bronze'
  }
}

// Update partner tier
export async function updatePartnerTier(partnerId: number): Promise<Partner> {
  const partner = await getPartner(partnerId)
  if (!partner) {
    throw new Error('Partner not found')
  }

  const newTier = calculatePartnerTier(
    parseFloat(partner.totalRevenue),
    partner.totalReferrals
  )

  if (newTier !== partner.tier) {
    const [updated] = await db
      .update(partners)
      .set({
        tier: newTier,
        updatedAt: new Date()
      })
      .where(eq(partners.id, partnerId))
      .returning()

    return updated
  }

  return partner
}

// Get partner performance metrics
export async function getPartnerPerformanceMetrics(
  partnerId: number,
  startDate: Date,
  endDate: Date
) {
  return await db
    .select({
      date: sql<string>`date(${partnerCommissions.createdAt})`,
      revenue: sql<number>`sum(${partnerCommissions.amount})`,
      commissions: sql<number>`sum(${partnerCommissions.commissionAmount})`,
      referrals: sql<number>`count(*)`,
      avgTicketSize: sql<number>`avg(${partnerCommissions.amount})`
    })
    .from(partnerCommissions)
    .where(
      and(
        eq(partnerCommissions.partnerId, partnerId),
        gte(partnerCommissions.createdAt, startDate),
        lte(partnerCommissions.createdAt, endDate)
      )
    )
    .groupBy(sql`date(${partnerCommissions.createdAt})`)
    .orderBy(asc(sql`date(${partnerCommissions.createdAt})`))
}
