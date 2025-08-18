import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/session'
import { voteFaqHelpfulness } from '@/lib/db/queries/faq'

export async function POST(req: NextRequest) {
  try {
    const { faqId, isHelpful, feedback } = await req.json()

    if (!faqId || typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Get user session if exists (voting can be anonymous)
    const session = await getServerSession()
    const userId = session?.user?.id

    // Get session ID for anonymous users
    const sessionId = !userId
      ? req.headers.get('x-session-id') || generateSessionId()
      : undefined

    const vote = await voteFaqHelpfulness(
      faqId,
      isHelpful,
      userId,
      sessionId,
      feedback
    )

    return NextResponse.json({
      vote,
      message: 'Vote recorded successfully'
    })
  } catch (error) {
    console.error('Failed to record FAQ vote:', error)
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    )
  }
}

function generateSessionId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}
