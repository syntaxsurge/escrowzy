import { and, count, desc, eq, gte, sql, sum } from 'drizzle-orm'

import { db } from '../drizzle'
import { partnerCommissions, partners } from '../schema'

export async function getPartnershipByEmail(email: string) {
  const partnership = await db
    .select({
      id: partners.id,
      organizationName: partners.organizationName,
      website: partners.website,
      email: partners.email,
      phone: partners.phone,
      partnerType: partners.partnerType,
      commissionRate: partners.commissionRate,
      customTerms: partners.customTerms,
      totalRevenue: partners.totalRevenue,
      totalReferrals: partners.totalReferrals,
      status: partners.status,
      startDate: partners.approvedAt,
      createdAt: partners.createdAt
    })
    .from(partners)
    .where(eq(partners.email, email))
    .limit(1)

  return partnership[0] || null
}

export async function getPartnershipStats(partnerId: number) {
  // Get total transactions and volume
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const commissionStats = await db
    .select({
      totalTransactions: sql<number>`count(*)::int`,
      totalVolume: sum(partnerCommissions.amount),
      totalCommissions: sum(partnerCommissions.commissionAmount),
      pendingCommissions: sum(
        sql`CASE WHEN ${partnerCommissions.status} = 'pending' THEN ${partnerCommissions.commissionAmount} ELSE 0 END`
      )
    })
    .from(partnerCommissions)
    .where(eq(partnerCommissions.partnerId, partnerId))

  const recentCommissions = await db
    .select({
      avgTransactionSize: sql<string>`AVG(${partnerCommissions.amount})::decimal(10,2)`
    })
    .from(partnerCommissions)
    .where(
      and(
        eq(partnerCommissions.partnerId, partnerId),
        gte(partnerCommissions.createdAt, thirtyDaysAgo)
      )
    )

  // Get active transactions count (number of commissions in last 30 days)
  const activeTransactionsResult = await db
    .select({ count: count() })
    .from(partnerCommissions)
    .where(
      and(
        eq(partnerCommissions.partnerId, partnerId),
        gte(partnerCommissions.createdAt, thirtyDaysAgo)
      )
    )

  const stats = commissionStats[0]

  return {
    totalTransactions: stats?.totalTransactions || 0,
    totalVolume: stats?.totalVolume || '0',
    totalCommissions: stats?.totalCommissions || '0',
    pendingCommissions: stats?.pendingCommissions || '0',
    avgTransactionSize: recentCommissions[0]?.avgTransactionSize || '0',
    activeTransactions: activeTransactionsResult[0]?.count || 0
  }
}

export async function getPartnerCommissions(
  partnerId: number,
  status?: 'pending' | 'paid' | 'cancelled',
  limit = 50
) {
  const conditions = [eq(partnerCommissions.partnerId, partnerId)]

  if (status) {
    conditions.push(eq(partnerCommissions.status, status))
  }

  const commissions = await db
    .select({
      id: partnerCommissions.id,
      referenceType: partnerCommissions.referenceType,
      referenceId: partnerCommissions.referenceId,
      amount: partnerCommissions.amount,
      commissionRate: partnerCommissions.commissionRate,
      commissionAmount: partnerCommissions.commissionAmount,
      status: partnerCommissions.status,
      paidAt: partnerCommissions.paidAt,
      createdAt: partnerCommissions.createdAt
    })
    .from(partnerCommissions)
    .where(and(...conditions))
    .orderBy(desc(partnerCommissions.createdAt))
    .limit(limit)

  return commissions
}

export async function createPartnership(data: {
  userId: number
  companyName: string
  websiteUrl: string
  contactEmail: string
  contactPhone?: string
  partnershipType: string
  proposedTerms: string
  estimatedVolume?: string
  userBase?: string
  additionalInfo?: string
}) {
  const [partnership] = await db
    .insert(partners)
    .values({
      organizationName: data.companyName,
      contactName: data.companyName, // Using company name as contact name for now
      email: data.contactEmail,
      phone: data.contactPhone,
      website: data.websiteUrl,
      partnerType: data.partnershipType,
      tier: 'bronze', // Default tier
      commissionRate: '10', // Default rate, admin can adjust
      customTerms: {
        proposedTerms: data.proposedTerms,
        estimatedVolume: data.estimatedVolume,
        userBase: data.userBase,
        additionalInfo: data.additionalInfo
      },
      status: 'pending'
    })
    .returning()

  return partnership
}

export async function updatePartnershipStatus(
  partnerId: number,
  status: 'active' | 'suspended' | 'terminated',
  approvedBy?: number
) {
  const updates: any = {
    status,
    updatedAt: new Date()
  }

  if (status === 'active' && approvedBy) {
    updates.approvedAt = new Date()
    updates.approvedBy = approvedBy
  }

  const [updated] = await db
    .update(partners)
    .set(updates)
    .where(eq(partners.id, partnerId))
    .returning()

  return updated
}

export async function recordPartnerCommission(data: {
  partnerId: number
  referenceType: 'trade' | 'subscription' | 'job'
  referenceId: number
  amount: string
  commissionRate: string
}) {
  const commissionAmount = (
    parseFloat(data.amount) *
    (parseFloat(data.commissionRate) / 100)
  ).toFixed(2)

  const [commission] = await db
    .insert(partnerCommissions)
    .values({
      partnerId: data.partnerId,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      amount: data.amount,
      commissionRate: data.commissionRate,
      commissionAmount,
      status: 'pending'
    })
    .returning()

  return commission
}

export async function applyForPartnership(data: {
  userId: number
  companyName: string
  websiteUrl: string
  contactEmail: string
  contactPhone?: string
  partnershipType: string
  proposedTerms: string
  estimatedVolume?: string
  userBase?: string
  additionalInfo?: string
}) {
  // Check if user already has a partnership
  const existing = await getPartnershipByEmail(data.contactEmail)
  if (existing) {
    return null // User already has a partnership
  }

  return createPartnership(data)
}

export async function processPartnerPayout(
  partnerId: number,
  commissionIds: number[]
) {
  // Mark commissions as paid
  const paidCommissions = await db
    .update(partnerCommissions)
    .set({
      status: 'paid',
      paidAt: new Date(),
      updatedAt: new Date()
    })
    .where(
      and(
        eq(partnerCommissions.partnerId, partnerId),
        sql`${partnerCommissions.id} IN (${sql.join(commissionIds, sql`, `)})`
      )
    )
    .returning()

  // Calculate total paid amount
  const totalPaid = paidCommissions.reduce(
    (sum, c) => sum + parseFloat(c.commissionAmount),
    0
  )

  // Update partner's total revenue
  await db
    .update(partners)
    .set({
      totalRevenue: sql`${partners.totalRevenue} + ${totalPaid}::decimal`
    })
    .where(eq(partners.id, partnerId))

  return {
    paidCommissions,
    totalPaid: totalPaid.toFixed(2)
  }
}
