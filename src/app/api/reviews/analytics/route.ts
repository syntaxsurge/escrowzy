import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { getReviewAnalytics } from '@/lib/db/queries/reviews'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
      ? parseInt(searchParams.get('userId')!)
      : session.userId
    const dateFrom = searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined
    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined

    const analytics = await getReviewAnalytics(userId, dateFrom, dateTo)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching review analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
