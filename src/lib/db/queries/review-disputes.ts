import 'server-only'

import { eq, and, desc } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  freelancerReviews,
  clientReviews,
  reviewDisputes,
  users
} from '../schema'
import type { ReviewDispute as ReviewDisputeType } from '../schema'

export async function createReviewDispute(
  disputedBy: number,
  data: {
    reviewId: number
    reviewType: 'freelancer' | 'client'
    reason: string
    description: string
    evidence?: string[]
  }
): Promise<{ success: boolean; disputeId?: number; message: string }> {
  try {
    // Verify the review exists
    const table =
      data.reviewType === 'freelancer' ? freelancerReviews : clientReviews
    const [review] = await db
      .select()
      .from(table)
      .where(eq(table.id, data.reviewId))
      .limit(1)

    if (!review) {
      return { success: false, message: 'Review not found' }
    }

    // Check if user is involved in the review
    const isInvolved =
      data.reviewType === 'freelancer'
        ? (review as any).freelancerId === disputedBy ||
          (review as any).reviewerId === disputedBy
        : (review as any).clientId === disputedBy ||
          (review as any).reviewerId === disputedBy

    if (!isInvolved) {
      return {
        success: false,
        message: 'You are not authorized to dispute this review'
      }
    }

    // Check if a dispute already exists for this review
    const existingDispute = await checkDisputeExists(
      data.reviewId,
      data.reviewType
    )
    if (existingDispute) {
      return {
        success: false,
        message: 'A dispute already exists for this review'
      }
    }

    // Create the dispute
    const [dispute] = await db
      .insert(reviewDisputes)
      .values({
        reviewId: data.reviewId,
        reviewType: data.reviewType,
        disputedBy,
        reason: data.reason,
        description: data.description,
        evidence: data.evidence || [],
        status: 'pending'
      })
      .returning()

    // Hide the review temporarily while under dispute
    await db
      .update(table)
      .set({ isPublic: false })
      .where(eq(table.id, data.reviewId))

    return {
      success: true,
      disputeId: dispute.id,
      message:
        'Dispute submitted successfully. The review has been hidden pending investigation.'
    }
  } catch (error) {
    console.error('Error creating review dispute:', error)
    return { success: false, message: 'Failed to submit dispute' }
  }
}

export async function getDisputesByUser(
  userId: number
): Promise<ReviewDisputeType[]> {
  try {
    const disputes = await db
      .select({
        dispute: reviewDisputes,
        disputedByUser: users
      })
      .from(reviewDisputes)
      .leftJoin(users, eq(reviewDisputes.disputedBy, users.id))
      .where(eq(reviewDisputes.disputedBy, userId))
      .orderBy(desc(reviewDisputes.createdAt))

    return disputes.map(d => ({
      ...d.dispute,
      disputedByName: d.disputedByUser?.name || null,
      disputedByEmail: d.disputedByUser?.email || null
    })) as ReviewDisputeType[]
  } catch (error) {
    console.error('Error fetching user disputes:', error)
    return []
  }
}

export async function getPendingDisputes(): Promise<ReviewDisputeType[]> {
  try {
    const disputes = await db
      .select({
        dispute: reviewDisputes,
        disputedByUser: users
      })
      .from(reviewDisputes)
      .leftJoin(users, eq(reviewDisputes.disputedBy, users.id))
      .where(eq(reviewDisputes.status, 'pending'))
      .orderBy(desc(reviewDisputes.createdAt))

    return disputes.map(d => ({
      ...d.dispute,
      disputedByName: d.disputedByUser?.name || null,
      disputedByEmail: d.disputedByUser?.email || null
    })) as ReviewDisputeType[]
  } catch (error) {
    console.error('Error fetching pending disputes:', error)
    return []
  }
}

export async function getDisputeById(
  disputeId: number
): Promise<ReviewDisputeType | null> {
  try {
    const [dispute] = await db
      .select()
      .from(reviewDisputes)
      .where(eq(reviewDisputes.id, disputeId))
      .limit(1)

    return dispute || null
  } catch (error) {
    console.error('Error fetching dispute:', error)
    return null
  }
}

export async function resolveDispute(
  disputeId: number,
  resolvedBy: number,
  resolution: {
    resolution: 'upheld' | 'dismissed' | 'modified'
    adminNote: string
    actionTaken: string
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const dispute = await getDisputeById(disputeId)
    if (!dispute) {
      return { success: false, message: 'Dispute not found' }
    }

    // Update the dispute record
    await db
      .update(reviewDisputes)
      .set({
        status: 'resolved',
        resolution: resolution.resolution,
        adminNote: resolution.adminNote,
        actionTaken: resolution.actionTaken,
        resolvedBy,
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reviewDisputes.id, disputeId))

    // Handle the review based on the resolution
    const table =
      dispute.reviewType === 'freelancer' ? freelancerReviews : clientReviews

    if (resolution.resolution === 'upheld') {
      // If dispute is upheld, take the specified action
      if (resolution.actionTaken === 'review_removed') {
        await db.delete(table).where(eq(table.id, dispute.reviewId))
      } else if (resolution.actionTaken === 'review_hidden') {
        await db
          .update(table)
          .set({ isPublic: false })
          .where(eq(table.id, dispute.reviewId))
      }
    } else if (resolution.resolution === 'dismissed') {
      // If dispute is dismissed, make the review public again
      await db
        .update(table)
        .set({ isPublic: true })
        .where(eq(table.id, dispute.reviewId))
    }

    return {
      success: true,
      message: 'Dispute resolved successfully'
    }
  } catch (error) {
    console.error('Error resolving dispute:', error)
    return { success: false, message: 'Failed to resolve dispute' }
  }
}

export async function checkDisputeExists(
  reviewId: number,
  reviewType: 'freelancer' | 'client'
): Promise<boolean> {
  try {
    const [dispute] = await db
      .select()
      .from(reviewDisputes)
      .where(
        and(
          eq(reviewDisputes.reviewId, reviewId),
          eq(reviewDisputes.reviewType, reviewType)
        )
      )
      .limit(1)

    return !!dispute
  } catch (error) {
    console.error('Error checking dispute existence:', error)
    return false
  }
}

export async function getDisputeStats(): Promise<{
  total: number
  pending: number
  resolved: number
  avgResolutionTime: number
}> {
  try {
    const allDisputes = await db.select().from(reviewDisputes)

    const pending = allDisputes.filter(d => d.status === 'pending').length
    const resolved = allDisputes.filter(d => d.status === 'resolved').length

    // Calculate average resolution time for resolved disputes
    const resolvedWithTime = allDisputes.filter(
      d => d.status === 'resolved' && d.resolvedAt
    )

    let avgResolutionTime = 0
    if (resolvedWithTime.length > 0) {
      const totalTime = resolvedWithTime.reduce((sum, d) => {
        const timeDiff = d.resolvedAt!.getTime() - d.createdAt.getTime()
        return sum + timeDiff
      }, 0)
      avgResolutionTime =
        totalTime / resolvedWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
    }

    return {
      total: allDisputes.length,
      pending,
      resolved,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10 // Round to 1 decimal
    }
  } catch (error) {
    console.error('Error getting dispute stats:', error)
    return {
      total: 0,
      pending: 0,
      resolved: 0,
      avgResolutionTime: 0
    }
  }
}

export async function updateDisputeStatus(
  disputeId: number,
  status: 'under_review' | 'resolved' | 'dismissed'
): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(reviewDisputes)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(reviewDisputes.id, disputeId))

    return {
      success: true,
      message: `Dispute status updated to ${status}`
    }
  } catch (error) {
    console.error('Error updating dispute status:', error)
    return { success: false, message: 'Failed to update dispute status' }
  }
}
