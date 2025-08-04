import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { p2pListings, trades, users } from '@/lib/db/schema'
import type {
  CreateListingInput,
  UpdateListingInput,
  AcceptListingInput,
  GetListingsQuery
} from '@/lib/schemas/p2p-listings'
import type {
  P2PListing,
  P2PListingWithUser,
  Trade
} from '@/types/p2p-listings'
import { TRADE_STATUS } from '@/types/p2p-listings'

// Create a new P2P listing
export async function createP2PListing(
  userId: number,
  input: CreateListingInput
): Promise<P2PListing> {
  const [listing] = await db
    .insert(p2pListings)
    .values({
      userId,
      listingType: input.listingType,
      tokenOffered: input.tokenOffered,
      amount: input.amount,
      pricePerUnit: input.pricePerUnit,
      minAmount: input.minAmount || null,
      maxAmount: input.maxAmount || null,
      paymentMethods: input.paymentMethods,
      paymentWindow: input.paymentWindow || 15,
      isActive: true
    })
    .returning()

  return listing
}

// Get active listings with filters and pagination
export async function getActiveListings(
  query: GetListingsQuery
): Promise<{ listings: P2PListingWithUser[]; total: number }> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query

  // Build filter conditions
  const conditions = []

  // Always filter for active listings unless explicitly requested
  if (query.isActive !== false) {
    conditions.push(eq(p2pListings.isActive, true))
  }

  if (query.listingType) {
    conditions.push(eq(p2pListings.listingType, query.listingType))
  }

  if (query.tokenOffered) {
    conditions.push(eq(p2pListings.tokenOffered, query.tokenOffered))
  }

  if (query.userId) {
    conditions.push(eq(p2pListings.userId, query.userId))
  }

  if (query.minAmount) {
    conditions.push(gte(p2pListings.amount, query.minAmount))
  }

  if (query.maxAmount) {
    conditions.push(lte(p2pListings.amount, query.maxAmount))
  }

  if (query.paymentMethod) {
    conditions.push(
      sql`${p2pListings.paymentMethods}::jsonb @> ${JSON.stringify([query.paymentMethod])}::jsonb`
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(p2pListings)
    .where(whereClause)

  // Get paginated listings with user info
  const offset = (page - 1) * limit

  // Build order by clause
  let orderByClause
  if (sortBy === 'pricePerUnit') {
    orderByClause =
      sortOrder === 'desc'
        ? desc(p2pListings.pricePerUnit)
        : p2pListings.pricePerUnit
  } else if (sortBy === 'amount') {
    orderByClause =
      sortOrder === 'desc' ? desc(p2pListings.amount) : p2pListings.amount
  } else {
    orderByClause =
      sortOrder === 'desc' ? desc(p2pListings.createdAt) : p2pListings.createdAt
  }

  const listings = await db
    .select({
      listing: p2pListings,
      user: users
    })
    .from(p2pListings)
    .innerJoin(users, eq(p2pListings.userId, users.id))
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset)

  // Format the results
  const formattedListings: P2PListingWithUser[] = listings.map(row => ({
    ...row.listing,
    user: row.user
  }))

  return {
    listings: formattedListings,
    total: count
  }
}

// Get a single listing by ID
export async function getListingById(
  listingId: number
): Promise<P2PListingWithUser | null> {
  const result = await db
    .select({
      listing: p2pListings,
      user: users
    })
    .from(p2pListings)
    .innerJoin(users, eq(p2pListings.userId, users.id))
    .where(eq(p2pListings.id, listingId))
    .limit(1)

  if (result.length === 0) {
    return null
  }

  return {
    ...result[0].listing,
    user: result[0].user
  }
}

// Update a listing
export async function updateP2PListing(
  listingId: number,
  userId: number,
  input: UpdateListingInput
): Promise<P2PListing | null> {
  // First check if the listing belongs to the user
  const existingListing = await db
    .select()
    .from(p2pListings)
    .where(and(eq(p2pListings.id, listingId), eq(p2pListings.userId, userId)))
    .limit(1)

  if (existingListing.length === 0) {
    return null
  }

  // Update the listing
  const updateData: Partial<P2PListing> = {}

  if (input.amount !== undefined) {
    updateData.amount = input.amount
  }

  if (input.pricePerUnit !== undefined) {
    updateData.pricePerUnit = input.pricePerUnit
  }

  if (input.minAmount !== undefined) {
    updateData.minAmount = input.minAmount
  }

  if (input.maxAmount !== undefined) {
    updateData.maxAmount = input.maxAmount
  }

  if (input.paymentMethods !== undefined) {
    updateData.paymentMethods = input.paymentMethods
  }

  if (input.paymentWindow !== undefined) {
    updateData.paymentWindow = input.paymentWindow
  }

  if (input.isActive !== undefined) {
    updateData.isActive = input.isActive
  }

  const [updatedListing] = await db
    .update(p2pListings)
    .set(updateData)
    .where(eq(p2pListings.id, listingId))
    .returning()

  return updatedListing
}

// Deactivate a listing
export async function deactivateListing(
  listingId: number,
  userId: number
): Promise<boolean> {
  // Check if the listing belongs to the user
  const result = await db
    .update(p2pListings)
    .set({ isActive: false })
    .where(and(eq(p2pListings.id, listingId), eq(p2pListings.userId, userId)))
    .returning()

  return result.length > 0
}

// Accept a listing and create a trade
export async function acceptListingAndCreateTrade(
  listingId: number,
  buyerId: number,
  input: AcceptListingInput
): Promise<Trade | null> {
  // Get the listing
  const listing = await getListingById(listingId)

  if (!listing || !listing.isActive) {
    throw new Error('Listing not found or inactive')
  }

  // Prevent users from accepting their own listings
  if (listing.userId === buyerId) {
    throw new Error('Cannot accept your own listing')
  }

  // Validate amount is within listing limits
  const requestedAmount = parseFloat(input.amount)
  const listingAmount = parseFloat(listing.amount)

  if (requestedAmount > listingAmount) {
    throw new Error('Requested amount exceeds available amount')
  }

  if (listing.minAmount && requestedAmount < parseFloat(listing.minAmount)) {
    throw new Error('Amount is below minimum')
  }

  if (listing.maxAmount && requestedAmount > parseFloat(listing.maxAmount)) {
    throw new Error('Amount exceeds maximum')
  }

  // Validate payment method
  const paymentMethods = listing.paymentMethods as string[]
  if (!paymentMethods.includes(input.paymentMethod)) {
    throw new Error('Payment method not accepted')
  }

  // Determine buyer and seller based on listing type
  const isBuyListing = listing.listingType === 'buy'
  const actualBuyerId = isBuyListing ? listing.userId : buyerId
  const actualSellerId = isBuyListing ? buyerId : listing.userId

  // All P2P trades need seller deposit after acceptance

  // Calculate deposit deadline using listing's payment window
  const depositDeadline = new Date()
  depositDeadline.setMinutes(
    depositDeadline.getMinutes() + (listing.paymentWindow || 15)
  )

  // Create the trade without escrowId (will be set when seller deposits)
  const [trade] = await db
    .insert(trades)
    .values({
      escrowId: null, // Will be set when seller deposits to escrow
      chainId: input.chainId,
      buyerId: actualBuyerId,
      sellerId: actualSellerId,
      amount: input.amount,
      currency: listing.tokenOffered,
      tradeType: 'p2p',
      status: TRADE_STATUS.AWAITING_DEPOSIT,
      depositDeadline: depositDeadline,
      metadata: {
        listingId,
        paymentMethod: input.paymentMethod,
        pricePerUnit: listing.pricePerUnit,
        listingType: listing.listingType
      }
    })
    .returning()

  // Update listing amount or deactivate if fully consumed
  const remainingAmount = listingAmount - requestedAmount
  if (remainingAmount <= 0) {
    await db
      .update(p2pListings)
      .set({ isActive: false })
      .where(eq(p2pListings.id, listingId))
  } else {
    await db
      .update(p2pListings)
      .set({ amount: remainingAmount.toString() })
      .where(eq(p2pListings.id, listingId))
  }

  return trade
}

// Get user's listings
export async function getUserListings(
  userId: number,
  includeInactive = false
): Promise<{ listings: P2PListingWithUser[] }> {
  const conditions = [eq(p2pListings.userId, userId)]

  if (!includeInactive) {
    conditions.push(eq(p2pListings.isActive, true))
  }

  const listings = await db
    .select({
      listing: p2pListings,
      user: users
    })
    .from(p2pListings)
    .innerJoin(users, eq(p2pListings.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(p2pListings.createdAt))

  // Format the results
  const formattedListings: P2PListingWithUser[] = listings.map(row => ({
    ...row.listing,
    user: row.user
  }))

  return {
    listings: formattedListings
  }
}

// Check if user can create more listings based on subscription
export async function canUserCreateListing(
  userId: number,
  subscriptionTier: 'free' | 'pro' | 'enterprise' = 'free'
): Promise<{ canCreate: boolean; reason?: string }> {
  // Get active listings count
  const activeListings = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(p2pListings)
    .where(and(eq(p2pListings.userId, userId), eq(p2pListings.isActive, true)))

  const count = activeListings[0].count

  // Check limits based on subscription tier
  const limits = {
    free: 3,
    pro: 25,
    enterprise: 999999 // Effectively unlimited
  }

  const limit = limits[subscriptionTier]

  if (count >= limit) {
    return {
      canCreate: false,
      reason: `You have reached the maximum number of active listings (${limit}) for your subscription tier`
    }
  }

  return { canCreate: true }
}

// Get market statistics
export async function getMarketStats(): Promise<{
  totalActiveListings: number
  totalBuyOrders: number
  totalSellOrders: number
  activeTraders: number
}> {
  // Get total active listings
  const [{ totalActiveListings }] = await db
    .select({ totalActiveListings: sql<number>`count(*)::int` })
    .from(p2pListings)
    .where(eq(p2pListings.isActive, true))

  // Get buy orders count
  const [{ totalBuyOrders }] = await db
    .select({ totalBuyOrders: sql<number>`count(*)::int` })
    .from(p2pListings)
    .where(
      and(eq(p2pListings.isActive, true), eq(p2pListings.listingType, 'buy'))
    )

  // Get sell orders count
  const [{ totalSellOrders }] = await db
    .select({ totalSellOrders: sql<number>`count(*)::int` })
    .from(p2pListings)
    .where(
      and(eq(p2pListings.isActive, true), eq(p2pListings.listingType, 'sell'))
    )

  // Get unique active traders (users with active listings)
  const [{ activeTraders }] = await db
    .select({
      activeTraders: sql<number>`count(distinct ${p2pListings.userId})::int`
    })
    .from(p2pListings)
    .where(eq(p2pListings.isActive, true))

  return {
    totalActiveListings,
    totalBuyOrders,
    totalSellOrders,
    activeTraders
  }
}
