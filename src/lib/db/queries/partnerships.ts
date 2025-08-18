import { and, desc, eq, gte, sql, sum } from 'drizzle-orm'

import { db } from '../drizzle'
import { escrowListings, partnerCommissions, partners, users } from '../schema'

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

  // Get active users (unique users who made transactions through partner)
  const activeUsers = await db
    .selectDistinct({ userId: users.id })
    .from(users)
    .innerJoin(escrowListings, eq(escrowListings.userId, users.id))
    .where(
      and(
        eq(escrowListings.partnerId, partnerId),
        gte(escrowListings.createdAt, thirtyDaysAgo)
      )
    )

  const stats = commissionStats[0]

  return {
    totalTransactions: stats?.totalTransactions || 0,
    totalVolume: stats?.totalVolume || '0',
    totalCommissions: stats?.totalCommissions || '0',
    pendingCommissions: stats?.pendingCommissions || '0',
    avgTransactionSize: recentCommissions[0]?.avgTransactionSize || '0',
    activeUsers: activeUsers.length
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
      userId: data.userId,
      companyName: data.companyName,
      websiteUrl: data.websiteUrl,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      partnershipType: data.partnershipType,
      commissionRate: '10', // Default rate, admin can adjust
      customTerms: data.proposedTerms,
      status: 'pending',
      notes: JSON.stringify({
        estimatedVolume: data.estimatedVolume,
        userBase: data.userBase,
        additionalInfo: data.additionalInfo
      })
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

  // Update partner's total pending commission
  await db
    .update(partners)
    .set({
      totalPendingCommission: sql`${partners.totalPendingCommission} + ${commissionAmount}::decimal`,
      updatedAt: new Date()
    })
    .where(eq(partners.id, data.partnerId))

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
  const existing = await getPartnershipByUserId(data.userId)
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

  // Update partner totals
  await db
    .update(partners)
    .set({
      totalEarnedCommission: sql`${partners.totalEarnedCommission} + ${totalPaid}::decimal`,
      totalPendingCommission: sql`${partners.totalPendingCommission} - ${totalPaid}::decimal`,
      updatedAt: new Date()
    })
    .where(eq(partners.id, partnerId))

  return {
    paidCommissions,
    totalPaid: totalPaid.toFixed(2)
  }
}
