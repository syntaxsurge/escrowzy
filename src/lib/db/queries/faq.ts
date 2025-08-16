import 'server-only'

import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  faqCategories,
  faqItems,
  faqVotes,
  type FaqCategory,
  type FaqItem,
  type FaqVote,
  type NewFaqCategory,
  type NewFaqItem,
  type NewFaqVote
} from '../schema'

// Get all FAQ categories
export async function getFaqCategories(includeInactive = false) {
  const conditions = includeInactive ? [] : [eq(faqCategories.isActive, true)]

  return await db
    .select()
    .from(faqCategories)
    .where(and(...conditions))
    .orderBy(asc(faqCategories.orderIndex), asc(faqCategories.name))
}

// Get FAQ category by slug
export async function getFaqCategoryBySlug(slug: string) {
  const [category] = await db
    .select()
    .from(faqCategories)
    .where(eq(faqCategories.slug, slug))
    .limit(1)

  return category
}

// Get FAQ items by category
export async function getFaqItemsByCategory(
  categoryId: number,
  includeUnpublished = false
) {
  const conditions = [eq(faqItems.categoryId, categoryId)]
  if (!includeUnpublished) {
    conditions.push(eq(faqItems.isPublished, true))
  }

  return await db
    .select()
    .from(faqItems)
    .where(and(...conditions))
    .orderBy(
      desc(faqItems.isHighlighted),
      asc(faqItems.orderIndex),
      desc(faqItems.helpfulCount)
    )
}

// Get single FAQ item
export async function getFaqItem(id: number) {
  const [item] = await db
    .select({
      faq: faqItems,
      category: faqCategories
    })
    .from(faqItems)
    .leftJoin(faqCategories, eq(faqItems.categoryId, faqCategories.id))
    .where(eq(faqItems.id, id))
    .limit(1)

  // Increment view count
  if (item) {
    await db
      .update(faqItems)
      .set({ viewCount: sql`${faqItems.viewCount} + 1` })
      .where(eq(faqItems.id, id))
  }

  return item
}

// Get FAQ item by slug
export async function getFaqItemBySlug(slug: string) {
  const [item] = await db
    .select({
      faq: faqItems,
      category: faqCategories
    })
    .from(faqItems)
    .leftJoin(faqCategories, eq(faqItems.categoryId, faqCategories.id))
    .where(eq(faqItems.slug, slug))
    .limit(1)

  // Increment view count
  if (item) {
    await db
      .update(faqItems)
      .set({ viewCount: sql`${faqItems.viewCount} + 1` })
      .where(eq(faqItems.id, item.faq.id))
  }

  return item
}

// Search FAQ items
export async function searchFaqItems(query: string, limit = 20) {
  const searchPattern = `%${query}%`

  return await db
    .select({
      faq: faqItems,
      category: faqCategories
    })
    .from(faqItems)
    .leftJoin(faqCategories, eq(faqItems.categoryId, faqCategories.id))
    .where(
      and(
        eq(faqItems.isPublished, true),
        or(
          ilike(faqItems.question, searchPattern),
          ilike(faqItems.answer, searchPattern),
          sql`${faqItems.tags}::text ilike ${searchPattern}`
        )
      )
    )
    .orderBy(
      desc(sql`
        case 
          when ${faqItems.question} ilike ${searchPattern} then 3
          when ${faqItems.answer} ilike ${searchPattern} then 2
          else 1
        end
      `),
      desc(faqItems.helpfulCount),
      desc(faqItems.viewCount)
    )
    .limit(limit)
}

// Get popular FAQ items
export async function getPopularFaqItems(limit = 10) {
  return await db
    .select({
      faq: faqItems,
      category: faqCategories
    })
    .from(faqItems)
    .leftJoin(faqCategories, eq(faqItems.categoryId, faqCategories.id))
    .where(eq(faqItems.isPublished, true))
    .orderBy(desc(faqItems.viewCount), desc(faqItems.helpfulCount))
    .limit(limit)
}

// Get highlighted FAQ items
export async function getHighlightedFaqItems() {
  return await db
    .select({
      faq: faqItems,
      category: faqCategories
    })
    .from(faqItems)
    .leftJoin(faqCategories, eq(faqItems.categoryId, faqCategories.id))
    .where(
      and(
        eq(faqItems.isPublished, true),
        eq(faqItems.isHighlighted, true)
      )
    )
    .orderBy(asc(faqItems.orderIndex))
}

// Get related FAQ items
export async function getRelatedFaqItems(faqId: number) {
  const [currentFaq] = await db
    .select()
    .from(faqItems)
    .where(eq(faqItems.id, faqId))
    .limit(1)

  if (!currentFaq) return []

  // Get related FAQs from the relatedFaqs field
  const relatedIds = (currentFaq.relatedFaqs as number[]) || []
  
  if (relatedIds.length > 0) {
    return await db
      .select()
      .from(faqItems)
      .where(
        and(
          inArray(faqItems.id, relatedIds),
          eq(faqItems.isPublished, true)
        )
      )
  }

  // If no explicit related FAQs, get items from same category
  return await db
    .select()
    .from(faqItems)
    .where(
      and(
        eq(faqItems.categoryId, currentFaq.categoryId),
        eq(faqItems.isPublished, true),
        sql`${faqItems.id} != ${faqId}`
      )
    )
    .orderBy(desc(faqItems.helpfulCount))
    .limit(5)
}

// Vote on FAQ helpfulness
export async function voteFaqHelpfulness(
  faqId: number,
  isHelpful: boolean,
  userId?: number,
  sessionId?: string,
  feedback?: string
): Promise<FaqVote> {
  // Check for existing vote
  const existingVote = await db
    .select()
    .from(faqVotes)
    .where(
      and(
        eq(faqVotes.faqId, faqId),
        userId ? eq(faqVotes.userId, userId) : eq(faqVotes.sessionId, sessionId!)
      )
    )
    .limit(1)

  if (existingVote[0]) {
    // Update existing vote
    const [updated] = await db
      .update(faqVotes)
      .set({ isHelpful, feedback })
      .where(eq(faqVotes.id, existingVote[0].id))
      .returning()

    // Update FAQ counts
    if (existingVote[0].isHelpful !== isHelpful) {
      if (isHelpful) {
        await db
          .update(faqItems)
          .set({
            helpfulCount: sql`${faqItems.helpfulCount} + 1`,
            notHelpfulCount: sql`${faqItems.notHelpfulCount} - 1`
          })
          .where(eq(faqItems.id, faqId))
      } else {
        await db
          .update(faqItems)
          .set({
            helpfulCount: sql`${faqItems.helpfulCount} - 1`,
            notHelpfulCount: sql`${faqItems.notHelpfulCount} + 1`
          })
          .where(eq(faqItems.id, faqId))
      }
    }

    return updated
  } else {
    // Create new vote
    const [created] = await db
      .insert(faqVotes)
      .values({
        faqId,
        userId,
        sessionId,
        isHelpful,
        feedback
      })
      .returning()

    // Update FAQ counts
    if (isHelpful) {
      await db
        .update(faqItems)
        .set({ helpfulCount: sql`${faqItems.helpfulCount} + 1` })
        .where(eq(faqItems.id, faqId))
    } else {
      await db
        .update(faqItems)
        .set({ notHelpfulCount: sql`${faqItems.notHelpfulCount} + 1` })
        .where(eq(faqItems.id, faqId))
    }

    return created
  }
}

// Create FAQ category
export async function createFaqCategory(
  data: NewFaqCategory
): Promise<FaqCategory> {
  const [category] = await db
    .insert(faqCategories)
    .values(data)
    .returning()

  return category
}

// Create FAQ item
export async function createFaqItem(data: NewFaqItem): Promise<FaqItem> {
  const [item] = await db
    .insert(faqItems)
    .values(data)
    .returning()

  return item
}

// Update FAQ item
export async function updateFaqItem(
  id: number,
  data: Partial<NewFaqItem>
): Promise<FaqItem> {
  const [updated] = await db
    .update(faqItems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(faqItems.id, id))
    .returning()

  return updated
}

// Get FAQ stats
export async function getFaqStats() {
  const stats = await db
    .select({
      totalFaqs: sql<number>`count(*)`,
      totalViews: sql<number>`sum(${faqItems.viewCount})`,
      totalHelpful: sql<number>`sum(${faqItems.helpfulCount})`,
      totalNotHelpful: sql<number>`sum(${faqItems.notHelpfulCount})`,
      averageHelpfulness: sql<number>`
        avg(
          case 
            when ${faqItems.helpfulCount} + ${faqItems.notHelpfulCount} > 0
            then ${faqItems.helpfulCount}::float / (${faqItems.helpfulCount} + ${faqItems.notHelpfulCount})
            else 0
          end
        ) * 100
      `
    })
    .from(faqItems)
    .where(eq(faqItems.isPublished, true))

  return stats[0] || {
    totalFaqs: 0,
    totalViews: 0,
    totalHelpful: 0,
    totalNotHelpful: 0,
    averageHelpfulness: 0
  }
}

// Get FAQ feedback
export async function getFaqFeedback(faqId?: number, limit = 50) {
  const conditions = faqId ? [eq(faqVotes.faqId, faqId)] : []

  return await db
    .select({
      vote: faqVotes,
      faq: faqItems
    })
    .from(faqVotes)
    .leftJoin(faqItems, eq(faqVotes.faqId, faqItems.id))
    .where(and(...conditions, isNull(faqVotes.feedback).not()))
    .orderBy(desc(faqVotes.createdAt))
    .limit(limit)
}