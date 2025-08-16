import { NextRequest } from 'next/server'
import { apiResponses } from '@/lib/api/api-responses'
import { db } from '@/lib/db'
import { jobCategories } from '@/lib/db/schema'
import { isNull } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Get all job categories
    const categories = await db
      .select()
      .from(jobCategories)
      .orderBy(jobCategories.name)

    // Organize into parent/child structure
    const parentCategories = categories.filter(c => c.parentCategoryId === null)
    const categoriesWithChildren = parentCategories.map(parent => ({
      ...parent,
      children: categories.filter(c => c.parentCategoryId === parent.id)
    }))

    return apiResponses.success({ categories: categoriesWithChildren })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to fetch job categories')
  }
}