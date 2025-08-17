import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/session'
import { getTutorialsList } from '@/lib/db/queries/tutorials'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type') as 'interactive' | 'video' | null
    const category = searchParams.get('category')

    const session = await getServerSession(req)
    const userId = session?.user?.id

    const tutorials = await getTutorialsList(
      userId,
      type || undefined,
      category || undefined
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
