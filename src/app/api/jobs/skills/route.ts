import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { skills } from '@/lib/db/schema'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')

    const skillsList = categoryId
      ? await db
          .select()
          .from(skills)
          .where(eq(skills.categoryId, parseInt(categoryId)))
      : await db.select().from(skills)

    return NextResponse.json(skillsList)
  } catch (error) {
    console.error('Failed to fetch skills:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}
