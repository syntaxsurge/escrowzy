import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { requireAuth } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import {
  completeOnboardingStep,
  onboardingSteps
} from '@/lib/db/queries/onboarding'
import { addXp } from '@/lib/db/queries/rewards'

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth(req)
    const { stepId } = await req.json()

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      )
    }

    // Get step details
    const [step] = await db
      .select()
      .from(onboardingSteps)
      .where(eq(onboardingSteps.id, stepId))
      .limit(1)

    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    // Complete the step
    const progress = await completeOnboardingStep(user.id, stepId)

    // Award XP if applicable
    let xpAwarded = 0
    if (step.xpReward && step.xpReward > 0) {
      await addXp(
        user.id,
        step.xpReward,
        `Completed onboarding step: ${step.title}`
      )
      xpAwarded = step.xpReward
    }

    return NextResponse.json({
      progress,
      xpReward: xpAwarded,
      message: 'Step completed successfully'
    })
  } catch (error) {
    console.error('Failed to complete onboarding step:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding step' },
      { status: 500 }
    )
  }
}
