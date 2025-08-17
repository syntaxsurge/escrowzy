import { NextRequest, NextResponse } from 'next/server'

import { getFaqCategories } from '@/lib/db/queries/faq'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const categories = await getFaqCategories(includeInactive)

    // Add item count for each category
    const categoriesWithCount = categories.map(category => ({
      ...category,
      itemCount: 0 // This would be populated from a count query
    }))

    return NextResponse.json(categoriesWithCount)
  } catch (error) {
    console.error('Failed to fetch FAQ categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FAQ categories' },
      { status: 500 }
    )
  }
}
