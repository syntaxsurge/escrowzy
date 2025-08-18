import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobCategories } from '@/lib/db/schema'

export async function GET(request: NextRequest) {
  try {
    const categories = await db
      .select()
      .from(jobCategories)
      .where(eq(jobCategories.isActive, true))
      .orderBy(jobCategories.sortOrder)

    return NextResponse.json({
      success: true,
      categories
    })
  } catch (error) {
    console.error('Failed to fetch job categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job categories' },
      { status: 500 }
    )
  }
}
