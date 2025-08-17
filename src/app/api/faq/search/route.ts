import { NextRequest, NextResponse } from 'next/server'

import { searchFaqItems } from '@/lib/db/queries/faq'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const results = await searchFaqItems(query, limit)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Failed to search FAQs:', error)
    return NextResponse.json(
      { error: 'Failed to search FAQs' },
      { status: 500 }
    )
  }
}
