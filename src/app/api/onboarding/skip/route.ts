import { NextRequest, NextResponse } from 'next/server'

import { skipOnboardingStep } from '@/lib/db/queries/onboarding'
import { getUser } from '@/services/user'

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stepId } = await req.json()

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      )
    }

    const progress = await skipOnboardingStep(user.id, stepId)

    return NextResponse.json({
      progress,
      message: 'Step skipped'
    })
  } catch (error) {
    console.error('Failed to skip onboarding step:', error)
    return NextResponse.json(
      { error: 'Failed to skip onboarding step' },
      { status: 500 }
    )
  }
}
