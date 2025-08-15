import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobCategories } from '@/lib/db/schema'

// GET /api/jobs/categories - Get all job categories
export async function GET(_request: NextRequest) {
  try {
    // Get all active categories
    const categories = await db
      .select()
      .from(jobCategories)
      .where(eq(jobCategories.isActive, true))
      .orderBy(jobCategories.sortOrder)

    // Organize into hierarchy
    const rootCategories = categories.filter((c: any) => !c.parentCategoryId)
    const categoriesWithChildren = rootCategories.map((parent: any) => ({
      ...parent,
      subCategories: categories.filter(
        (c: any) => c.parentCategoryId === parent.id
      )
    }))

    return NextResponse.json({
      success: true,
      categories: categoriesWithChildren
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
