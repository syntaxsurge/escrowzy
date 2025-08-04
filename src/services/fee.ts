import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { userSubscriptions } from '@/lib/db/schema'

import { getActiveDiscount } from './battle'

export interface FeeCalculation {
  baseFeePercent: number
  discountPercent: number
  finalFeePercent: number
  feeAmount: number
  netAmount: number
  discountSource?: 'subscription' | 'battle' | 'both'
}

const FEE_TIERS = {
  free: 2.5,
  pro: 2.0,
  enterprise: 1.5
}

/**
 * Calculate trading fees with all applicable discounts
 */
export async function calculateTradeFee(
  userId: number,
  tradeAmount: number
): Promise<FeeCalculation> {
  try {
    // Get user's subscription for base fee
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.isActive, true)
        )
      )
      .limit(1)

    // Determine base fee based on subscription
    let baseFeePercent = FEE_TIERS.free
    let subscriptionDiscount = 0

    if (subscription) {
      if (subscription.planId === 'pro') {
        baseFeePercent = FEE_TIERS.pro
        subscriptionDiscount =
          ((FEE_TIERS.free - FEE_TIERS.pro) / FEE_TIERS.free) * 100
      } else if (subscription.planId === 'enterprise') {
        baseFeePercent = FEE_TIERS.enterprise
        subscriptionDiscount =
          ((FEE_TIERS.free - FEE_TIERS.enterprise) / FEE_TIERS.free) * 100
      }
    }

    // Check for battle discount
    const battleDiscount = await getActiveDiscount(userId)
    let totalDiscountPercent = subscriptionDiscount
    let discountSource: FeeCalculation['discountSource'] = subscription
      ? 'subscription'
      : undefined

    if (battleDiscount) {
      // Apply battle discount on top of subscription discount
      const battleDiscountAmount =
        baseFeePercent * (battleDiscount.discountPercent / 100)
      const finalFeeWithBattle = baseFeePercent - battleDiscountAmount

      totalDiscountPercent =
        ((FEE_TIERS.free - finalFeeWithBattle) / FEE_TIERS.free) * 100
      baseFeePercent = finalFeeWithBattle

      discountSource = subscription ? 'both' : 'battle'
    }

    // Calculate final amounts
    const finalFeePercent = Math.max(baseFeePercent, 0) // Ensure fee never goes negative
    const feeAmount = (tradeAmount * finalFeePercent) / 100
    const netAmount = tradeAmount - feeAmount

    return {
      baseFeePercent: FEE_TIERS.free,
      discountPercent: totalDiscountPercent,
      finalFeePercent,
      feeAmount,
      netAmount,
      discountSource
    }
  } catch (error) {
    console.error('Error calculating trade fee:', error)
    // Return default fee on error
    const defaultFee = (tradeAmount * FEE_TIERS.free) / 100
    return {
      baseFeePercent: FEE_TIERS.free,
      discountPercent: 0,
      finalFeePercent: FEE_TIERS.free,
      feeAmount: defaultFee,
      netAmount: tradeAmount - defaultFee
    }
  }
}

/**
 * Get fee preview for a potential trade
 */
export async function getFeePreview(
  userId: number,
  tradeAmount: number
): Promise<FeeCalculation & { savings: number }> {
  const feeCalculation = await calculateTradeFee(userId, tradeAmount)

  // Calculate savings compared to free tier
  const standardFee = (tradeAmount * FEE_TIERS.free) / 100
  const savings = standardFee - feeCalculation.feeAmount

  return {
    ...feeCalculation,
    savings
  }
}
