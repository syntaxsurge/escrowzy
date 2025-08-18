import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { skills } from '@/lib/db/schema'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')

    let query = db.select().from(skills)

    if (categoryId) {
      query = query.where(eq(skills.categoryId, parseInt(categoryId)))
    }

    const skillsList = await query.orderBy(skills.name)

    return NextResponse.json({
      success: true,
      skills: skillsList
    })
  } catch (error) {
    console.error('Failed to fetch skills:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}
