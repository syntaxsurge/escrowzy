import { NextRequest, NextResponse } from 'next/server'

import { getTutorialsList } from '@/lib/db/queries/tutorials'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')

    const tutorials = await getTutorialsList(
      category || undefined,
      difficulty || undefined
    )

    return NextResponse.json(tutorials)
  } catch (error) {
    console.error('Failed to fetch tutorials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutorials' },
      { status: 500 }
    )
  }
}
