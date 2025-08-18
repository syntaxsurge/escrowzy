import 'server-only'

import { and, asc, desc, eq, ilike, isNotNull, or, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  tutorials,
  tutorialProgress,
  videoTutorials,
  videoProgress,
  type Tutorial,
  type TutorialProgress,
  type VideoTutorial,
  type VideoProgress,
  type NewTutorial,
  type NewVideoTutorial
} from '../schema'

// ============================================
// Interactive Tutorials
// ============================================

// Get all tutorials
export async function getTutorials(
  category?: string,
  difficulty?: string,
  isPublished = true
) {
  const conditions = []

  if (isPublished) {
    conditions.push(eq(tutorials.isPublished, true))
  }
  if (category) {
    conditions.push(eq(tutorials.category, category))
  }
  if (difficulty) {
    conditions.push(eq(tutorials.difficulty, difficulty))
  }

  return await db
    .select()
    .from(tutorials)
    .where(and(...conditions))
    .orderBy(asc(tutorials.category), asc(tutorials.difficulty))
}

// Get tutorial by slug
export async function getTutorialBySlug(slug: string) {
  const [tutorial] = await db
    .select()
    .from(tutorials)
    .where(eq(tutorials.slug, slug))
    .limit(1)

  // Increment view count
  if (tutorial) {
    await db
      .update(tutorials)
      .set({
        viewCount: sql`${tutorials.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(tutorials.id, tutorial.id))
  }

  return tutorial
}

// Get user's tutorial progress
export async function getUserTutorialProgress(
  userId: number,
  tutorialId: number
) {
  const [progress] = await db
    .select()
    .from(tutorialProgress)
    .where(
      and(
        eq(tutorialProgress.userId, userId),
        eq(tutorialProgress.tutorialId, tutorialId)
      )
    )
    .limit(1)

  return progress
}

// Get all user tutorial progress
export async function getAllUserTutorialProgress(userId: number) {
  return await db
    .select({
      tutorial: tutorials,
      progress: tutorialProgress
    })
    .from(tutorials)
    .leftJoin(
      tutorialProgress,
      and(
        eq(tutorialProgress.tutorialId, tutorials.id),
        eq(tutorialProgress.userId, userId)
      )
    )
    .where(eq(tutorials.isPublished, true))
    .orderBy(asc(tutorials.category), asc(tutorials.difficulty))
}

// Start or resume tutorial
export async function startTutorial(
  userId: number,
  tutorialId: number
): Promise<TutorialProgress> {
  const existing = await getUserTutorialProgress(userId, tutorialId)

  if (existing) {
    // Update last accessed time
    const [updated] = await db
      .update(tutorialProgress)
      .set({ lastAccessedAt: new Date() })
      .where(eq(tutorialProgress.id, existing.id))
      .returning()
    return updated
  } else {
    // Create new progress entry
    const [created] = await db
      .insert(tutorialProgress)
      .values({
        userId,
        tutorialId,
        currentStep: 0,
        completedSteps: []
      })
      .returning()
    return created
  }
}

// Update tutorial progress
export async function updateTutorialProgress(
  userId: number,
  tutorialId: number,
  stepIndex: number,
  markComplete = false
): Promise<TutorialProgress> {
  const progress = await getUserTutorialProgress(userId, tutorialId)

  if (!progress) {
    // Create new progress
    const [created] = await db
      .insert(tutorialProgress)
      .values({
        userId,
        tutorialId,
        currentStep: stepIndex,
        completedSteps: markComplete ? [stepIndex] : []
      })
      .returning()
    return created
  }

  // Update existing progress
  const completedSteps = (progress.completedSteps as number[]) || []
  if (markComplete && !completedSteps.includes(stepIndex)) {
    completedSteps.push(stepIndex)
  }

  const [tutorial] = await db
    .select()
    .from(tutorials)
    .where(eq(tutorials.id, tutorialId))
    .limit(1)

  const tutorialSteps = (tutorial?.steps as any[]) || []
  const isComplete = completedSteps.length === tutorialSteps.length

  const [updated] = await db
    .update(tutorialProgress)
    .set({
      currentStep: stepIndex,
      completedSteps,
      completedAt: isComplete ? new Date() : null,
      lastAccessedAt: new Date()
    })
    .where(eq(tutorialProgress.id, progress.id))
    .returning()

  return updated
}

// Complete tutorial
export async function completeTutorial(
  userId: number,
  tutorialId: number
): Promise<TutorialProgress> {
  const progress = await getUserTutorialProgress(userId, tutorialId)

  if (!progress) {
    throw new Error('Tutorial progress not found')
  }

  const [updated] = await db
    .update(tutorialProgress)
    .set({
      completedAt: new Date(),
      lastAccessedAt: new Date()
    })
    .where(eq(tutorialProgress.id, progress.id))
    .returning()

  return updated
}

// Get recommended tutorials for user
export async function getRecommendedTutorials(userId: number, limit = 5) {
  // Get user's completed tutorials
  const completedTutorials = await db
    .select({ tutorialId: tutorialProgress.tutorialId })
    .from(tutorialProgress)
    .where(
      and(
        eq(tutorialProgress.userId, userId),
        isNotNull(tutorialProgress.completedAt)
      )
    )

  const completedIds = completedTutorials.map(t => t.tutorialId)

  // Get uncompleted tutorials
  const conditions = [eq(tutorials.isPublished, true)]
  if (completedIds.length > 0) {
    const notInCondition = sql`${tutorials.id} not in (${sql.join(
      completedIds.map(id => sql`${id}`),
      sql`, `
    )})`
    conditions.push(notInCondition)
  }

  return await db
    .select()
    .from(tutorials)
    .where(and(...conditions))
    .orderBy(desc(tutorials.viewCount))
    .limit(limit)
}

// ============================================
// Video Tutorials
// ============================================

// Get all video tutorials
export async function getVideoTutorials(category?: string, isPublished = true) {
  const conditions = []

  if (isPublished) {
    conditions.push(eq(videoTutorials.isPublished, true))
  }
  if (category) {
    conditions.push(eq(videoTutorials.category, category))
  }

  return await db
    .select()
    .from(videoTutorials)
    .where(and(...conditions))
    .orderBy(asc(videoTutorials.orderIndex), desc(videoTutorials.viewCount))
}

// Get video tutorial by ID
export async function getVideoTutorial(id: number) {
  const [video] = await db
    .select()
    .from(videoTutorials)
    .where(eq(videoTutorials.id, id))
    .limit(1)

  // Increment view count
  if (video) {
    await db
      .update(videoTutorials)
      .set({
        viewCount: sql`${videoTutorials.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(videoTutorials.id, id))
  }

  return video
}

// Get user's video progress
export async function getUserVideoProgress(userId: number, videoId: number) {
  const [progress] = await db
    .select()
    .from(videoProgress)
    .where(
      and(eq(videoProgress.userId, userId), eq(videoProgress.videoId, videoId))
    )
    .limit(1)

  return progress
}

// Update video watch progress
export async function updateVideoProgress(
  userId: number,
  videoId: number,
  watchedSeconds: number
): Promise<VideoProgress> {
  const existing = await getUserVideoProgress(userId, videoId)

  // Get video duration to check if completed
  const [video] = await db
    .select({ duration: videoTutorials.duration })
    .from(videoTutorials)
    .where(eq(videoTutorials.id, videoId))
    .limit(1)

  const isComplete = video?.duration && watchedSeconds >= video.duration * 0.9 // 90% watched = complete

  if (existing) {
    const [updated] = await db
      .update(videoProgress)
      .set({
        watchedSeconds,
        completedAt: isComplete ? new Date() : existing.completedAt,
        lastWatchedAt: new Date()
      })
      .where(eq(videoProgress.id, existing.id))
      .returning()
    return updated
  } else {
    const [created] = await db
      .insert(videoProgress)
      .values({
        userId,
        videoId,
        watchedSeconds,
        completedAt: isComplete ? new Date() : null
      })
      .returning()
    return created
  }
}

// Get user's video watch history
export async function getUserVideoHistory(userId: number) {
  return await db
    .select({
      video: videoTutorials,
      progress: videoProgress
    })
    .from(videoProgress)
    .innerJoin(videoTutorials, eq(videoProgress.videoId, videoTutorials.id))
    .where(eq(videoProgress.userId, userId))
    .orderBy(desc(videoProgress.lastWatchedAt))
}

// Get popular videos
export async function getPopularVideos(limit = 10) {
  return await db
    .select()
    .from(videoTutorials)
    .where(eq(videoTutorials.isPublished, true))
    .orderBy(desc(videoTutorials.viewCount), desc(videoTutorials.likeCount))
    .limit(limit)
}

// Like video
export async function likeVideo(videoId: number) {
  await db
    .update(videoTutorials)
    .set({
      likeCount: sql`${videoTutorials.likeCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(videoTutorials.id, videoId))
}

// Search videos
export async function searchVideos(query: string, limit = 20) {
  const searchPattern = `%${query}%`

  return await db
    .select()
    .from(videoTutorials)
    .where(
      and(
        eq(videoTutorials.isPublished, true),
        or(
          ilike(videoTutorials.title, searchPattern),
          ilike(videoTutorials.description, searchPattern),
          sql`${videoTutorials.tags}::text ilike ${searchPattern}`,
          ilike(videoTutorials.transcript, searchPattern)
        )
      )
    )
    .orderBy(
      desc(sql`
        case 
          when ${videoTutorials.title} ilike ${searchPattern} then 3
          when ${videoTutorials.description} ilike ${searchPattern} then 2
          else 1
        end
      `),
      desc(videoTutorials.viewCount)
    )
    .limit(limit)
}

// Get tutorial stats
export async function getTutorialStats() {
  const [interactiveStats] = await db
    .select({
      total: sql<number>`count(*)`,
      published: sql<number>`count(case when ${tutorials.isPublished} then 1 end)`,
      totalViews: sql<number>`sum(${tutorials.viewCount})`,
      completed: sql<number>`(
        select count(distinct ${tutorialProgress.id})
        from ${tutorialProgress}
        where ${tutorialProgress.completedAt} is not null
      )`
    })
    .from(tutorials)

  const [videoStats] = await db
    .select({
      total: sql<number>`count(*)`,
      published: sql<number>`count(case when ${videoTutorials.isPublished} then 1 end)`,
      totalViews: sql<number>`sum(${videoTutorials.viewCount})`,
      totalLikes: sql<number>`sum(${videoTutorials.likeCount})`,
      completed: sql<number>`(
        select count(distinct ${videoProgress.id})
        from ${videoProgress}
        where ${videoProgress.completedAt} is not null
      )`
    })
    .from(videoTutorials)

  return {
    interactive: interactiveStats || {
      total: 0,
      published: 0,
      totalViews: 0,
      completed: 0
    },
    videos: videoStats || {
      total: 0,
      published: 0,
      totalViews: 0,
      totalLikes: 0,
      completed: 0
    }
  }
}

// Create tutorial
export async function createTutorial(data: NewTutorial): Promise<Tutorial> {
  const [tutorial] = await db.insert(tutorials).values(data).returning()

  return tutorial
}

// Update tutorial
export async function updateTutorial(
  id: number,
  data: Partial<NewTutorial>
): Promise<Tutorial> {
  const [updated] = await db
    .update(tutorials)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tutorials.id, id))
    .returning()

  return updated
}

// Create video tutorial
export async function createVideoTutorial(
  data: NewVideoTutorial
): Promise<VideoTutorial> {
  const [video] = await db.insert(videoTutorials).values(data).returning()

  return video
}

// Update video tutorial
export async function updateVideoTutorial(
  id: number,
  data: Partial<NewVideoTutorial>
): Promise<VideoTutorial> {
  const [updated] = await db
    .update(videoTutorials)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(videoTutorials.id, id))
    .returning()

  return updated
}

// Alias for compatibility
export const getTutorialsList = getTutorials
