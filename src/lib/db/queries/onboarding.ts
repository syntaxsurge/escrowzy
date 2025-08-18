import 'server-only'

import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  onboardingSteps,
  onboardingProgress,
  type OnboardingStep,
  type OnboardingProgress,
  type NewOnboardingStep
} from '../schema'

// Re-export for use in other modules
export { onboardingSteps } from '../schema'

// Get all onboarding steps for a category
export async function getOnboardingSteps(category: string) {
  return await db
    .select()
    .from(onboardingSteps)
    .where(
      and(
        eq(onboardingSteps.category, category),
        eq(onboardingSteps.isActive, true)
      )
    )
    .orderBy(asc(onboardingSteps.stepOrder))
}

// Get user's onboarding progress
export async function getUserOnboardingProgress(userId: number) {
  const progress = await db
    .select({
      step: onboardingSteps,
      progress: onboardingProgress
    })
    .from(onboardingSteps)
    .leftJoin(
      onboardingProgress,
      and(
        eq(onboardingProgress.stepId, onboardingSteps.id),
        eq(onboardingProgress.userId, userId)
      )
    )
    .where(eq(onboardingSteps.isActive, true))
    .orderBy(asc(onboardingSteps.stepOrder))

  const totalSteps = progress.length
  const completedSteps = progress.filter(p => p.progress?.completedAt).length
  const skippedSteps = progress.filter(p => p.progress?.skippedAt).length
  const progressPercentage =
    totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return {
    steps: progress,
    totalSteps,
    completedSteps,
    skippedSteps,
    progressPercentage,
    isComplete: completedSteps === totalSteps
  }
}

// Mark onboarding step as completed
export async function completeOnboardingStep(
  userId: number,
  stepId: number
): Promise<OnboardingProgress> {
  const existing = await db
    .select()
    .from(onboardingProgress)
    .where(
      and(
        eq(onboardingProgress.userId, userId),
        eq(onboardingProgress.stepId, stepId)
      )
    )
    .limit(1)

  if (existing[0]) {
    // Update existing progress
    const [updated] = await db
      .update(onboardingProgress)
      .set({ completedAt: new Date() })
      .where(eq(onboardingProgress.id, existing[0].id))
      .returning()
    return updated
  } else {
    // Create new progress entry
    const [created] = await db
      .insert(onboardingProgress)
      .values({
        userId,
        stepId,
        completedAt: new Date()
      })
      .returning()
    return created
  }
}

// Skip onboarding step
export async function skipOnboardingStep(
  userId: number,
  stepId: number
): Promise<OnboardingProgress> {
  const existing = await db
    .select()
    .from(onboardingProgress)
    .where(
      and(
        eq(onboardingProgress.userId, userId),
        eq(onboardingProgress.stepId, stepId)
      )
    )
    .limit(1)

  if (existing[0]) {
    const [updated] = await db
      .update(onboardingProgress)
      .set({ skippedAt: new Date() })
      .where(eq(onboardingProgress.id, existing[0].id))
      .returning()
    return updated
  } else {
    const [created] = await db
      .insert(onboardingProgress)
      .values({
        userId,
        stepId,
        skippedAt: new Date()
      })
      .returning()
    return created
  }
}

// Get next uncompleted onboarding step
export async function getNextOnboardingStep(userId: number, category: string) {
  const progress = await getUserOnboardingProgress(userId)

  const nextStep = progress.steps.find(
    p =>
      p.step.category === category &&
      !p.progress?.completedAt &&
      !p.progress?.skippedAt
  )

  return nextStep?.step || null
}

// Reset user's onboarding progress
export async function resetOnboardingProgress(userId: number) {
  return await db
    .delete(onboardingProgress)
    .where(eq(onboardingProgress.userId, userId))
}

// Check if user has completed onboarding
export async function hasCompletedOnboarding(userId: number): Promise<boolean> {
  const progress = await getUserOnboardingProgress(userId)
  return progress.isComplete
}

// Create or update onboarding step
export async function upsertOnboardingStep(
  step: NewOnboardingStep
): Promise<OnboardingStep> {
  const existing = await db
    .select()
    .from(onboardingSteps)
    .where(eq(onboardingSteps.key, step.key))
    .limit(1)

  if (existing[0]) {
    const [updated] = await db
      .update(onboardingSteps)
      .set({ ...step, updatedAt: new Date() })
      .where(eq(onboardingSteps.id, existing[0].id))
      .returning()
    return updated
  } else {
    const [created] = await db.insert(onboardingSteps).values(step).returning()
    return created
  }
}

// Get onboarding completion stats
export async function getOnboardingStats() {
  const stats = await db
    .select({
      totalUsers: sql<number>`count(distinct ${onboardingProgress.userId})`,
      completedSteps: sql<number>`count(case when ${onboardingProgress.completedAt} is not null then 1 end)`,
      skippedSteps: sql<number>`count(case when ${onboardingProgress.skippedAt} is not null then 1 end)`,
      averageCompletion: sql<number>`
        avg(
          case when ${onboardingProgress.completedAt} is not null then 1 else 0 end
        ) * 100
      `
    })
    .from(onboardingProgress)

  return (
    stats[0] || {
      totalUsers: 0,
      completedSteps: 0,
      skippedSteps: 0,
      averageCompletion: 0
    }
  )
}

// Get most skipped steps
export async function getMostSkippedSteps(limit = 10) {
  return await db
    .select({
      step: onboardingSteps,
      skipCount: sql<number>`count(${onboardingProgress.skippedAt})`
    })
    .from(onboardingSteps)
    .leftJoin(
      onboardingProgress,
      eq(onboardingProgress.stepId, onboardingSteps.id)
    )
    .where(isNotNull(onboardingProgress.skippedAt))
    .groupBy(onboardingSteps.id)
    .orderBy(desc(sql`count(${onboardingProgress.skippedAt})`))
    .limit(limit)
}

// Note: Use getOnboardingSteps function instead of direct table access
