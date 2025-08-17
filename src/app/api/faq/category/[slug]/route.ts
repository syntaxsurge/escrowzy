import { NextRequest, NextResponse } from 'next/server'

import {
  getFaqCategoryBySlug,
  getFaqItemsByCategory
} from '@/lib/db/queries/faq'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const category = await getFaqCategoryBySlug(params.slug)

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const faqs = await getFaqItemsByCategory(category.id)

    return NextResponse.json(faqs)
  } catch (error) {
    console.error('Failed to fetch FAQs by category:', error)
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 })
  }
}
