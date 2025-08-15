import { NextRequest, NextResponse } from 'next/server'

import { getJobCategoriesWithCounts } from '@/lib/db/queries/jobs'

// GET /api/jobs/categories - Get all job categories with job counts
export async function GET(_request: NextRequest) {
  try {
    const categories = await getJobCategoriesWithCounts()

    // Organize into hierarchy with counts
    const rootCategories = categories.filter(c => !c.parentCategoryId)
    const categoriesWithChildren = rootCategories.map(parent => ({
      ...parent,
      subCategories: categories.filter(c => c.parentCategoryId === parent.id)
    }))

    return NextResponse.json({
      success: true,
      categories: categoriesWithChildren,
      total: categories.reduce((sum, cat) => sum + cat.jobCount, 0)
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
