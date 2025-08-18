import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { getReviewPrompts } from '@/services/reviews'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prompts = await getReviewPrompts(session.user.id)

    return NextResponse.json({
      prompts,
      total: prompts.length
    })
  } catch (error) {
    console.error('Error fetching pending reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending reviews' },
      { status: 500 }
    )
  }
}
