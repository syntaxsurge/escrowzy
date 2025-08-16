import 'server-only'

import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  helpArticles,
  users,
  type HelpArticle,
  type NewHelpArticle
} from '../schema'

// Get all help articles
export async function getHelpArticles(
  category?: string,
  isPublished = true,
  limit = 50
) {
  const conditions = []
  
  if (isPublished) {
    conditions.push(eq(helpArticles.isPublished, true))
  }
  if (category) {
    conditions.push(eq(helpArticles.category, category))
  }

  return await db
    .select({
      article: helpArticles,
      author: users
    })
    .from(helpArticles)
    .leftJoin(users, eq(helpArticles.authorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(helpArticles.publishedAt), asc(helpArticles.title))
    .limit(limit)
}

// Get help article by slug
export async function getHelpArticleBySlug(slug: string) {
  const [article] = await db
    .select({
      article: helpArticles,
      author: users
    })
    .from(helpArticles)
    .leftJoin(users, eq(helpArticles.authorId, users.id))
    .where(eq(helpArticles.slug, slug))
    .limit(1)

  // Increment view count
  if (article) {
    await db
      .update(helpArticles)
      .set({ 
        viewCount: sql`${helpArticles.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(helpArticles.id, article.article.id))
  }

  return article
}

// Search help articles
export async function searchHelpArticles(
  query: string,
  category?: string,
  limit = 20
) {
  const searchPattern = `%${query}%`
  const conditions = [eq(helpArticles.isPublished, true)]

  if (category) {
    conditions.push(eq(helpArticles.category, category))
  }

  return await db
    .select({
      article: helpArticles,
      author: users
    })
    .from(helpArticles)
    .leftJoin(users, eq(helpArticles.authorId, users.id))
    .where(
      and(
        ...conditions,
        or(
          ilike(helpArticles.title, searchPattern),
          ilike(helpArticles.content, searchPattern),
          ilike(helpArticles.excerpt, searchPattern),
          ilike(helpArticles.searchKeywords, searchPattern),
          sql`${helpArticles.tags}::text ilike ${searchPattern}`
        )
      )
    )
    .orderBy(
      desc(sql`
        case 
          when ${helpArticles.title} ilike ${searchPattern} then 4
          when ${helpArticles.excerpt} ilike ${searchPattern} then 3
          when ${helpArticles.searchKeywords} ilike ${searchPattern} then 2
          else 1
        end
      `),
      desc(helpArticles.viewCount),
      desc(helpArticles.publishedAt)
    )
    .limit(limit)
}

// Get popular help articles
export async function getPopularHelpArticles(limit = 10) {
  return await db
    .select({
      article: helpArticles,
      author: users
    })
    .from(helpArticles)
    .leftJoin(users, eq(helpArticles.authorId, users.id))
    .where(eq(helpArticles.isPublished, true))
    .orderBy(desc(helpArticles.viewCount), desc(helpArticles.helpfulCount))
    .limit(limit)
}

// Get recent help articles
export async function getRecentHelpArticles(limit = 10) {
  return await db
    .select({
      article: helpArticles,
      author: users
    })
    .from(helpArticles)
    .leftJoin(users, eq(helpArticles.authorId, users.id))
    .where(eq(helpArticles.isPublished, true))
    .orderBy(desc(helpArticles.publishedAt))
    .limit(limit)
}

// Get related help articles
export async function getRelatedHelpArticles(articleId: number, limit = 5) {
  const [currentArticle] = await db
    .select()
    .from(helpArticles)
    .where(eq(helpArticles.id, articleId))
    .limit(1)

  if (!currentArticle) return []

  // Get related articles from the relatedArticles field
  const relatedIds = (currentArticle.relatedArticles as number[]) || []
  
  if (relatedIds.length > 0) {
    return await db
      .select({
        article: helpArticles,
        author: users
      })
      .from(helpArticles)
      .leftJoin(users, eq(helpArticles.authorId, users.id))
      .where(
        and(
          sql`${helpArticles.id} in (${sql.join(relatedIds, sql`, `)})`,
          eq(helpArticles.isPublished, true)
        )
      )
  }

  // If no explicit related articles, get articles from same category with similar tags
  const tags = (currentArticle.tags as string[]) || []
  const tagConditions = tags.map(tag => 
    sql`${helpArticles.tags}::text like '%${tag}%'`
  )

  return await db
    .select({
      article: helpArticles,
      author: users
    })
    .from(helpArticles)
    .leftJoin(users, eq(helpArticles.authorId, users.id))
    .where(
      and(
        eq(helpArticles.category, currentArticle.category),
        eq(helpArticles.isPublished, true),
        sql`${helpArticles.id} != ${articleId}`,
        tagConditions.length > 0 ? or(...tagConditions) : sql`true`
      )
    )
    .orderBy(desc(helpArticles.viewCount))
    .limit(limit)
}

// Mark article as helpful
export async function markArticleHelpful(articleId: number) {
  await db
    .update(helpArticles)
    .set({ 
      helpfulCount: sql`${helpArticles.helpfulCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(helpArticles.id, articleId))
}

// Create help article
export async function createHelpArticle(
  data: NewHelpArticle
): Promise<HelpArticle> {
  const [article] = await db
    .insert(helpArticles)
    .values(data)
    .returning()

  return article
}

// Update help article
export async function updateHelpArticle(
  id: number,
  data: Partial<NewHelpArticle>
): Promise<HelpArticle> {
  const [updated] = await db
    .update(helpArticles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(helpArticles.id, id))
    .returning()

  return updated
}

// Publish help article
export async function publishHelpArticle(id: number): Promise<HelpArticle> {
  const [published] = await db
    .update(helpArticles)
    .set({ 
      isPublished: true,
      publishedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(helpArticles.id, id))
    .returning()

  return published
}

// Get help article categories
export async function getHelpArticleCategories() {
  const categories = await db
    .selectDistinct({ category: helpArticles.category })
    .from(helpArticles)
    .where(eq(helpArticles.isPublished, true))
    .orderBy(asc(helpArticles.category))

  const categoryCounts = await db
    .select({
      category: helpArticles.category,
      count: sql<number>`count(*)`
    })
    .from(helpArticles)
    .where(eq(helpArticles.isPublished, true))
    .groupBy(helpArticles.category)

  return categories.map(c => {
    const count = categoryCounts.find(cc => cc.category === c.category)
    return {
      category: c.category,
      count: count?.count || 0
    }
  })
}

// Get help stats
export async function getHelpStats() {
  const stats = await db
    .select({
      totalArticles: sql<number>`count(*)`,
      publishedArticles: sql<number>`count(case when ${helpArticles.isPublished} then 1 end)`,
      totalViews: sql<number>`sum(${helpArticles.viewCount})`,
      totalHelpful: sql<number>`sum(${helpArticles.helpfulCount})`,
      categories: sql<number>`count(distinct ${helpArticles.category})`,
      averageViewsPerArticle: sql<number>`avg(${helpArticles.viewCount})`
    })
    .from(helpArticles)

  return stats[0] || {
    totalArticles: 0,
    publishedArticles: 0,
    totalViews: 0,
    totalHelpful: 0,
    categories: 0,
    averageViewsPerArticle: 0
  }
}

// Review help article
export async function reviewHelpArticle(id: number, reviewerId: number) {
  const [reviewed] = await db
    .update(helpArticles)
    .set({ 
      lastReviewedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(helpArticles.id, id))
    .returning()

  return reviewed
}

// Get articles needing review
export async function getArticlesNeedingReview(daysOld = 90) {
  const reviewDate = new Date()
  reviewDate.setDate(reviewDate.getDate() - daysOld)

  return await db
    .select({
      article: helpArticles,
      author: users
    })
    .from(helpArticles)
    .leftJoin(users, eq(helpArticles.authorId, users.id))
    .where(
      and(
        eq(helpArticles.isPublished, true),
        or(
          sql`${helpArticles.lastReviewedAt} is null`,
          sql`${helpArticles.lastReviewedAt} < ${reviewDate}`
        )
      )
    )
    .orderBy(asc(helpArticles.lastReviewedAt), asc(helpArticles.publishedAt))
}