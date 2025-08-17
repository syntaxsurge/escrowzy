import 'server-only'

import { eq, and, desc, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import { reputationRegistry, reputationNFTs, users } from '../schema'

export interface ReputationData {
  id: number
  userId: number
  walletAddress: string
  totalReviews: number
  averageRating: number
  reputationScore: number
  isFreelancer: boolean
  lastUpdated: Date
  metadata: Record<string, any>
}

export interface ReputationNFT {
  id: number
  userId: number
  nftType: string
  tokenId: number
  metadataUri: string | null
  reputationLevel: string | null
  mintedAt: Date
  txHash: string
  chainId: number
  contractAddress: string | null
}

/**
 * Update or create reputation registry entry
 */
export async function updateReputationRegistry(
  userId: number,
  data: {
    walletAddress: string
    totalReviews: number
    averageRating: number
    reputationScore: number
    isFreelancer: boolean
    metadata?: Record<string, any>
  }
): Promise<ReputationData> {
  const [existing] = await db
    .select()
    .from(reputationRegistry)
    .where(
      and(
        eq(reputationRegistry.userId, userId),
        eq(reputationRegistry.isFreelancer, data.isFreelancer)
      )
    )
    .limit(1)

  if (existing) {
    // Update existing record
    const [updated] = await db
      .update(reputationRegistry)
      .set({
        walletAddress: data.walletAddress,
        totalReviews: data.totalReviews,
        averageRating: data.averageRating.toFixed(2),
        reputationScore: data.reputationScore,
        metadata: data.metadata || existing.metadata,
        lastUpdated: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reputationRegistry.id, existing.id))
      .returning()

    return {
      ...updated,
      averageRating: parseFloat(updated.averageRating),
      metadata: (updated.metadata || {}) as Record<string, any>
    }
  } else {
    // Create new record
    const [created] = await db
      .insert(reputationRegistry)
      .values({
        userId,
        walletAddress: data.walletAddress,
        totalReviews: data.totalReviews,
        averageRating: data.averageRating.toFixed(2),
        reputationScore: data.reputationScore,
        isFreelancer: data.isFreelancer,
        metadata: data.metadata || {},
        lastUpdated: new Date()
      })
      .returning()

    return {
      ...created,
      averageRating: parseFloat(created.averageRating),
      metadata: (created.metadata || {}) as Record<string, any>
    }
  }
}

/**
 * Get user reputation data
 */
export async function getUserReputation(
  userId: number,
  isFreelancer: boolean = true
): Promise<ReputationData | null> {
  const [reputation] = await db
    .select()
    .from(reputationRegistry)
    .where(
      and(
        eq(reputationRegistry.userId, userId),
        eq(reputationRegistry.isFreelancer, isFreelancer)
      )
    )
    .limit(1)

  if (!reputation) return null

  return {
    ...reputation,
    averageRating: parseFloat(reputation.averageRating),
    metadata: (reputation.metadata || {}) as Record<string, any>
  }
}

/**
 * Mint reputation NFT (database-backed)
 */
export async function mintReputationNFT(
  userId: number,
  reputationLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
): Promise<ReputationNFT> {
  // Check if already minted
  const [existing] = await db
    .select()
    .from(reputationNFTs)
    .where(
      and(
        eq(reputationNFTs.userId, userId),
        eq(reputationNFTs.nftType, 'reputation'),
        eq(reputationNFTs.reputationLevel, reputationLevel)
      )
    )
    .limit(1)

  if (existing) {
    return existing
  }

  // Get user wallet address
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    throw new Error('User not found')
  }

  // Generate unique token ID
  const tokenId = Date.now() * 1000 + userId

  // Generate deterministic tx hash
  const txHash = `0x${Buffer.from(`reputation-${reputationLevel}-${userId}-${Date.now()}`).toString('hex').padEnd(64, '0').slice(0, 64)}`

  // Create metadata URI
  const metadataUri = `ipfs://reputation/${reputationLevel}/${userId}.json`

  // Mint the NFT (database record)
  const [minted] = await db
    .insert(reputationNFTs)
    .values({
      userId,
      nftType: 'reputation',
      tokenId,
      metadataUri,
      reputationLevel,
      txHash,
      chainId: 1,
      contractAddress: '0x' + '0'.repeat(40) // Placeholder address
    })
    .returning()

  return minted
}

/**
 * Get user's reputation NFTs
 */
export async function getUserReputationNFTs(
  userId: number
): Promise<ReputationNFT[]> {
  return db
    .select()
    .from(reputationNFTs)
    .where(eq(reputationNFTs.userId, userId))
    .orderBy(desc(reputationNFTs.mintedAt))
}

/**
 * Check if user has reputation NFT of specific level
 */
export async function hasReputationNFT(
  userId: number,
  reputationLevel: string
): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reputationNFTs)
    .where(
      and(
        eq(reputationNFTs.userId, userId),
        eq(reputationNFTs.nftType, 'reputation'),
        eq(reputationNFTs.reputationLevel, reputationLevel)
      )
    )

  return (result?.count || 0) > 0
}

/**
 * Get top reputation users
 */
export async function getTopReputationUsers(
  limit: number = 10,
  isFreelancer: boolean = true
): Promise<Array<ReputationData & { userName: string | null }>> {
  const results = await db
    .select({
      reputation: reputationRegistry,
      userName: users.name
    })
    .from(reputationRegistry)
    .innerJoin(users, eq(reputationRegistry.userId, users.id))
    .where(eq(reputationRegistry.isFreelancer, isFreelancer))
    .orderBy(desc(reputationRegistry.reputationScore))
    .limit(limit)

  return results.map(r => ({
    ...r.reputation,
    averageRating: parseFloat(r.reputation.averageRating),
    metadata: (r.reputation.metadata || {}) as Record<string, any>,
    userName: r.userName
  }))
}

/**
 * Calculate reputation score based on reviews and other factors
 */
export function calculateReputationScore(
  totalReviews: number,
  averageRating: number,
  trustScore: number = 50
): number {
  // Weight factors
  const reviewWeight = 0.4
  const ratingWeight = 0.4
  const trustWeight = 0.2

  // Normalize values
  const reviewScore = Math.min(totalReviews * 2, 100) // Cap at 50 reviews = 100 points
  const ratingScore = (averageRating / 5) * 100
  const trustNormalized = trustScore

  // Calculate weighted score
  const score = Math.round(
    reviewScore * reviewWeight +
      ratingScore * ratingWeight +
      trustNormalized * trustWeight
  )

  return Math.min(100, Math.max(0, score))
}

/**
 * Get reputation level from score
 */
export function getReputationLevel(
  score: number
): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
  if (score >= 90) return 'diamond'
  if (score >= 75) return 'platinum'
  if (score >= 60) return 'gold'
  if (score >= 40) return 'silver'
  return 'bronze'
}

/**
 * Sync reputation from reviews to registry
 */
export async function syncReputationFromReviews(userId: number): Promise<{
  freelancerReputation?: ReputationData
  clientReputation?: ReputationData
}> {
  const result: {
    freelancerReputation?: ReputationData
    clientReputation?: ReputationData
  } = {}

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    throw new Error('User not found')
  }

  // Import review functions
  const { getFreelancerReviews, getClientReviews } = await import('./reviews')

  // Sync freelancer reputation
  const freelancerReviews = await getFreelancerReviews(userId)
  if (freelancerReviews.stats.totalReviews > 0) {
    // Import trust score service
    const { TrustScoreService } = await import('@/services/trust-score')
    const trustService = new TrustScoreService()
    const trustScore = await trustService.calculateTrustScore(userId)

    const reputationScore = calculateReputationScore(
      freelancerReviews.stats.totalReviews,
      freelancerReviews.stats.averageRating,
      trustScore.totalScore
    )

    result.freelancerReputation = await updateReputationRegistry(userId, {
      walletAddress: user.walletAddress,
      totalReviews: freelancerReviews.stats.totalReviews,
      averageRating: freelancerReviews.stats.averageRating,
      reputationScore,
      isFreelancer: true,
      metadata: {
        trustScore: trustScore.totalScore,
        trustLevel: trustScore.level,
        lastSynced: new Date().toISOString()
      }
    })

    // Check if eligible for reputation NFT
    const level = getReputationLevel(reputationScore)
    const hasNFT = await hasReputationNFT(userId, level)
    if (!hasNFT && reputationScore >= 40) {
      // Only mint silver and above
      await mintReputationNFT(userId, level)
    }
  }

  // Sync client reputation
  const clientReviews = await getClientReviews(userId)
  if (clientReviews.stats.totalReviews > 0) {
    const reputationScore = calculateReputationScore(
      clientReviews.stats.totalReviews,
      clientReviews.stats.averageRating,
      50 // Default trust score for clients
    )

    result.clientReputation = await updateReputationRegistry(userId, {
      walletAddress: user.walletAddress,
      totalReviews: clientReviews.stats.totalReviews,
      averageRating: clientReviews.stats.averageRating,
      reputationScore,
      isFreelancer: false,
      metadata: {
        lastSynced: new Date().toISOString()
      }
    })
  }

  return result
}
