import { NextRequest, NextResponse } from 'next/server'

import { getUserOnboardingProgress } from '@/lib/db/queries/onboarding'
import { getUser } from '@/services/user'

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get('category') || 'new_user'

    const progress = await getUserOnboardingProgress(user.id)

    // Filter by category if specified
    const filteredProgress = category
      ? {
          ...progress,
          steps: progress.steps.filter((s: any) => s.step.category === category)
        }
      : progress

    return NextResponse.json(filteredProgress)
  } catch (error) {
    console.error('Failed to fetch onboarding progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding progress' },
      { status: 500 }
    )
  }
}
