import { NextRequest, NextResponse } from 'next/server'

import { getBidsByFreelancerId } from '@/lib/db/queries/bids'
import { getUser } from '@/services/user'

// GET /api/freelancers/[id]/bids - Get all bids for a freelancer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const freelancerId = parseInt(id)
    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { error: 'Invalid freelancer ID' },
        { status: 400 }
      )
    }

    // Check if user is authorized to view these bids
    const user = await getUser()
    if (!user || user.id !== freelancerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sort') as any
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Build filters
    const filters = {
      status: status && status !== 'all' ? status : undefined,
      sortBy: sortBy || 'newest',
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0
    }

    // Get bids
    const { bids, total } = await getBidsByFreelancerId(freelancerId, filters)

    // Filter by search query if provided
    let filteredBids = bids
    if (search) {
      const searchLower = search.toLowerCase()
      filteredBids = bids.filter(
        bid =>
          bid.job?.title?.toLowerCase().includes(searchLower) ||
          bid.proposalText?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      bids: filteredBids,
      total: search ? filteredBids.length : total,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching freelancer bids:', error)
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
  }
}
