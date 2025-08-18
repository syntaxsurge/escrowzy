import { NextRequest } from 'next/server'

import { apiResponses } from '@/lib/api/server-utils'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { ActivityType, teamMembers } from '@/lib/db/schema'
import { acceptListingSchema } from '@/lib/schemas/listings'
import { acceptListingAndCreateTrade } from '@/services/listings'
import { createNotification } from '@/services/notification'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return apiResponses.unauthorized('Please sign in to accept a listing')
    }

    // Parse listing ID
    const { id } = await context.params
    const listingId = parseInt(id)
    if (isNaN(listingId)) {
      return apiResponses.badRequest('Invalid listing ID')
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = acceptListingSchema.safeParse(body)

    if (!validationResult.success) {
      console.error('Validation failed for accept listing:', {
        errors: validationResult.error.errors,
        body
      })
      const firstError = validationResult.error.errors[0]
      return apiResponses.badRequest(
        `Invalid input: ${firstError.path.join('.')} - ${firstError.message}`
      )
    }

    const input = validationResult.data

    // Accept the listing and create a trade
    const trade = await acceptListingAndCreateTrade(
      listingId,
      session.user.id,
      input
    )

    if (!trade) {
      return apiResponses.badRequest('Failed to accept listing')
    }

    // Add activity logging - get user's team ID if available
    const { eq } = await import('drizzle-orm')
    const userTeam = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.user.id))
      .limit(1)

    if (userTeam.length > 0) {
      await createNotification({
        userId: session.user.id,
        teamId: userTeam[0].teamId,
        action: ActivityType.LISTING_ACCEPTED,
        title: 'Listing Accepted',
        message: `Trade #${trade.id} created from listing`,
        actionUrl: `/trades/${trade.id}`,
        notificationType: 'listing_accepted',
        metadata: { listingId, tradeId: trade.id },
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          undefined
      })
    }

    return apiResponses.success({
      trade,
      message: 'Listing accepted and trade created successfully'
    })
  } catch (error) {
    console.error('Error accepting listing:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (
        error.message.includes('not found') ||
        error.message.includes('inactive')
      ) {
        return apiResponses.notFound(error.message)
      }
      if (error.message.includes('Cannot accept your own listing')) {
        return apiResponses.forbidden(error.message)
      }
      if (
        error.message.includes('amount') ||
        error.message.includes('Payment method')
      ) {
        return apiResponses.badRequest(error.message)
      }
    }

    return apiResponses.error('Failed to accept listing')
  }
}
