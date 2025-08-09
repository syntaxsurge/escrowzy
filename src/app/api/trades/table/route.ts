import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/session'
import { getTradesForTable } from '@/services/trade'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)

    // Extract table parameters
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!)
      : 1
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 10
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder =
      (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    const globalFilter = searchParams.get('globalFilter') || ''

    // Extract filter parameters
    const status = searchParams.get('status') || 'all'
    const period = searchParams.get('period') || 'all'
    const listingCategory = searchParams.get('listingCategory') || 'all'

    // Get trades with server-side pagination and filtering
    const result = await getTradesForTable(session.user.id, {
      page,
      limit,
      sortBy,
      sortOrder,
      globalFilter,
      status: status !== 'all' ? status : undefined,
      period: period !== 'all' ? period : undefined,
      listingCategory: listingCategory !== 'all' ? listingCategory : undefined
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/trades/table:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
