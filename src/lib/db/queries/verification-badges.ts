import 'server-only'

import { eq, and, desc, or, gte, sql, lte, isNull } from 'drizzle-orm'

import { db } from '../drizzle'
import { verificationBadges, users } from '../schema'
import type { VerificationBadge } from '../schema'

export type BadgeType = 'identity' | 'email' | 'phone' | 'kyc' | 'professional'
export type VerificationLevel = 'basic' | 'standard' | 'advanced'

export interface VerificationBadgeWithUser extends VerificationBadge {
  user?: {
    id: number
    name: string | null
    walletAddress: string
    email: string | null
  }
}

export async function createVerificationBadge(data: {
  userId: number
  badgeType: BadgeType
  verificationLevel: VerificationLevel
  verificationMethod: string
  expiresAt?: Date
  metadata?: Record<string, any>
}): Promise<VerificationBadge> {
  // Check if badge already exists
  const existing = await db
    .select()
    .from(verificationBadges)
    .where(
      and(
        eq(verificationBadges.userId, data.userId),
        eq(verificationBadges.badgeType, data.badgeType)
      )
    )
    .limit(1)

  if (existing.length > 0) {
    // Update existing badge
    const [updated] = await db
      .update(verificationBadges)
      .set({
        verificationLevel: data.verificationLevel,
        verificationMethod: data.verificationMethod,
        expiresAt: data.expiresAt,
        metadata: data.metadata || {},
        verifiedAt: new Date(),
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(verificationBadges.id, existing[0].id))
      .returning()

    return updated
  }

  // Create new badge
  const [badge] = await db
    .insert(verificationBadges)
    .values({
      userId: data.userId,
      badgeType: data.badgeType,
      verificationLevel: data.verificationLevel,
      verificationMethod: data.verificationMethod,
      expiresAt: data.expiresAt,
      metadata: data.metadata || {},
      isActive: true
    })
    .returning()

  return badge
}

export async function getUserVerificationBadges(
  userId: number,
  activeOnly: boolean = true
): Promise<VerificationBadge[]> {
  const conditions = [eq(verificationBadges.userId, userId)]

  if (activeOnly) {
    conditions.push(eq(verificationBadges.isActive, true))
    conditions.push(
      or(
        isNull(verificationBadges.expiresAt),
        gte(verificationBadges.expiresAt, new Date())
      )!
    )
  }

  return db
    .select()
    .from(verificationBadges)
    .where(and(...conditions))
    .orderBy(desc(verificationBadges.verifiedAt))
}

export async function getVerificationBadge(
  userId: number,
  badgeType: BadgeType
): Promise<VerificationBadge | null> {
  const [badge] = await db
    .select()
    .from(verificationBadges)
    .where(
      and(
        eq(verificationBadges.userId, userId),
        eq(verificationBadges.badgeType, badgeType),
        eq(verificationBadges.isActive, true)
      )
    )
    .limit(1)

  return badge || null
}

export async function revokeVerificationBadge(
  userId: number,
  badgeType: BadgeType,
  reason?: string
): Promise<boolean> {
  const result = await db
    .update(verificationBadges)
    .set({
      isActive: false,
      metadata: {
        revokedAt: new Date().toISOString(),
        revokedReason: reason
      },
      updatedAt: new Date()
    })
    .where(
      and(
        eq(verificationBadges.userId, userId),
        eq(verificationBadges.badgeType, badgeType)
      )
    )
    .returning()

  return result.length > 0
}

export async function isUserVerified(
  userId: number,
  requiredBadges: BadgeType[] = ['email']
): Promise<boolean> {
  const badges = await getUserVerificationBadges(userId)
  const userBadgeTypes = badges.map(b => b.badgeType)

  return requiredBadges.every(required => userBadgeTypes.includes(required))
}

export async function getVerificationStatus(userId: number): Promise<{
  isVerified: boolean
  verificationLevel: VerificationLevel | null
  badges: {
    identity: boolean
    email: boolean
    phone: boolean
    kyc: boolean
    professional: boolean
  }
  overallScore: number
}> {
  const badges = await getUserVerificationBadges(userId)

  const badgeStatus = {
    identity: false,
    email: false,
    phone: false,
    kyc: false,
    professional: false
  }

  let highestLevel: VerificationLevel | null = null
  const levelPriority: Record<VerificationLevel, number> = {
    basic: 1,
    standard: 2,
    advanced: 3
  }

  badges.forEach(badge => {
    badgeStatus[badge.badgeType as BadgeType] = true

    if (
      !highestLevel ||
      levelPriority[badge.verificationLevel as VerificationLevel] >
        levelPriority[highestLevel]
    ) {
      highestLevel = badge.verificationLevel as VerificationLevel
    }
  })

  // Calculate overall verification score (0-100)
  const weights = {
    identity: 20,
    email: 15,
    phone: 15,
    kyc: 30,
    professional: 20
  }

  const overallScore = Object.entries(badgeStatus).reduce(
    (score, [type, verified]) => {
      return score + (verified ? weights[type as BadgeType] : 0)
    },
    0
  )

  return {
    isVerified: badgeStatus.email, // Minimum requirement
    verificationLevel: highestLevel,
    badges: badgeStatus,
    overallScore
  }
}

export async function extendVerificationBadge(
  userId: number,
  badgeType: BadgeType,
  newExpiryDate: Date
): Promise<boolean> {
  const result = await db
    .update(verificationBadges)
    .set({
      expiresAt: newExpiryDate,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(verificationBadges.userId, userId),
        eq(verificationBadges.badgeType, badgeType),
        eq(verificationBadges.isActive, true)
      )
    )
    .returning()

  return result.length > 0
}

export async function getExpiringBadges(
  daysBeforeExpiry: number = 30
): Promise<VerificationBadgeWithUser[]> {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry)

  const badges = await db
    .select({
      badge: verificationBadges,
      user: users
    })
    .from(verificationBadges)
    .innerJoin(users, eq(verificationBadges.userId, users.id))
    .where(
      and(
        eq(verificationBadges.isActive, true),
        gte(verificationBadges.expiresAt, sql`NOW()`),
        lte(
          verificationBadges.expiresAt,
          sql`NOW() + INTERVAL '${daysBeforeExpiry} days'`
        )
      )
    )
    .orderBy(verificationBadges.expiresAt)

  return badges.map(row => ({
    ...row.badge,
    user: {
      id: row.user.id,
      name: row.user.name,
      walletAddress: row.user.walletAddress,
      email: row.user.email
    }
  }))
}

// Auto-verify email when user confirms email
export async function verifyEmailBadge(
  userId: number
): Promise<VerificationBadge> {
  return createVerificationBadge({
    userId,
    badgeType: 'email',
    verificationLevel: 'basic',
    verificationMethod: 'email_confirmation',
    metadata: {
      verifiedAt: new Date().toISOString()
    }
  })
}

// Verify identity through wallet signature
export async function verifyIdentityBadge(
  userId: number,
  walletAddress: string,
  signature: string
): Promise<VerificationBadge> {
  return createVerificationBadge({
    userId,
    badgeType: 'identity',
    verificationLevel: 'basic',
    verificationMethod: 'wallet_signature',
    metadata: {
      walletAddress,
      signature,
      verifiedAt: new Date().toISOString()
    }
  })
}

// Professional verification through portfolio/work history
export async function verifyProfessionalBadge(
  userId: number,
  verificationData: {
    portfolioCount: number
    completedJobs: number
    averageRating: number
  }
): Promise<VerificationBadge | null> {
  // Require minimum standards
  if (
    verificationData.portfolioCount < 3 ||
    verificationData.completedJobs < 5 ||
    verificationData.averageRating < 4.0
  ) {
    return null
  }

  let level: VerificationLevel = 'basic'
  if (
    verificationData.completedJobs >= 20 &&
    verificationData.averageRating >= 4.5
  ) {
    level = 'advanced'
  } else if (
    verificationData.completedJobs >= 10 &&
    verificationData.averageRating >= 4.2
  ) {
    level = 'standard'
  }

  return createVerificationBadge({
    userId,
    badgeType: 'professional',
    verificationLevel: level,
    verificationMethod: 'work_history',
    metadata: verificationData
  })
}
