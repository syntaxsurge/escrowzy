import { NextRequest } from 'next/server'

import { apiResponses } from '@/lib/api/server-utils'
import { getSession } from '@/lib/auth/session'
import { acceptListingSchema } from '@/lib/schemas/p2p-listings'
import { acceptListingAndCreateTrade } from '@/services/p2p-listings'

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
      return apiResponses.badRequest('Invalid input')
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

    // TODO: Add activity logging when user's teamId is available in session
    // Currently skipping activity log as teamId is required but not available

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
