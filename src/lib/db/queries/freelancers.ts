import 'server-only'

import { and, desc, eq, sql, ilike, gte, or, inArray, asc } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  freelancerProfiles,
  freelancerSkills,
  skills,
  portfolioItems,
  users,
  jobCategories,
  freelancerReviews,
  jobPostings,
  jobBids,
  type FreelancerProfile,
  type NewFreelancerProfile,
  type FreelancerSkill,
  type PortfolioItem,
  type NewPortfolioItem
} from '../schema'

// Types
export interface FreelancerProfileWithRelations extends FreelancerProfile {
  user: {
    id: number
    name: string | null
    email: string | null
    avatarUrl: string | null
    walletAddress: string | null
  }
  skills: (FreelancerSkill & {
    skill: {
      id: number
      name: string
      categoryId: number | null
      icon: string | null
    }
  })[]
  portfolioItems: PortfolioItem[]
  reviewCount: number
  avgRating: number
}

export interface FreelancerFilters {
  search?: string
  skills?: number[]
  minRate?: number
  maxRate?: number
  experienceLevel?: 'entry' | 'intermediate' | 'expert'
  availability?: 'available' | 'busy' | 'away'
  languages?: string[]
  minRating?: number
  verified?: boolean
  sortBy?: 'newest' | 'rating' | 'price_low' | 'price_high' | 'experience'
  limit?: number
  offset?: number
}

export interface ProfileStats {
  profileViews: number
  activeBids: number
  completedJobs: number
  totalEarnings: string
  avgResponseTime: number | null
  completionRate: number
}

// Get freelancer profile by user ID
export async function getFreelancerProfileByUserId(
  userId: number
): Promise<FreelancerProfileWithRelations | null> {
  const [profile] = await db
    .select({
      id: freelancerProfiles.id,
      userId: freelancerProfiles.userId,
      professionalTitle: freelancerProfiles.professionalTitle,
      bio: freelancerProfiles.bio,
      hourlyRate: freelancerProfiles.hourlyRate,
      availability: freelancerProfiles.availability,
      yearsOfExperience: freelancerProfiles.yearsOfExperience,
      languages: freelancerProfiles.languages,
      timezone: freelancerProfiles.timezone,
      portfolioUrl: freelancerProfiles.portfolioUrl,
      linkedinUrl: freelancerProfiles.linkedinUrl,
      githubUrl: freelancerProfiles.githubUrl,
      verificationStatus: freelancerProfiles.verificationStatus,
      totalJobs: freelancerProfiles.totalJobs,
      totalEarnings: freelancerProfiles.totalEarnings,
      avgRating: freelancerProfiles.avgRating,
      completionRate: freelancerProfiles.completionRate,
      responseTime: freelancerProfiles.responseTime,
      lastActiveAt: freelancerProfiles.lastActiveAt,
      metadata: freelancerProfiles.metadata,
      profileViews: freelancerProfiles.profileViews,
      createdAt: freelancerProfiles.createdAt,
      updatedAt: freelancerProfiles.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarPath,
        walletAddress: users.walletAddress
      }
    })
    .from(freelancerProfiles)
    .leftJoin(users, eq(freelancerProfiles.userId, users.id))
    .where(eq(freelancerProfiles.userId, userId))
    .limit(1)

  if (!profile) return null

  // Get skills
  const skillsDataRaw = await db
    .select({
      id: freelancerSkills.id,
      freelancerId: freelancerSkills.freelancerId,
      skillId: freelancerSkills.skillId,
      yearsOfExperience: freelancerSkills.yearsOfExperience,
      skillLevel: freelancerSkills.skillLevel,
      isVerified: freelancerSkills.isVerified,
      verifiedAt: freelancerSkills.verifiedAt,
      endorsements: freelancerSkills.endorsements,
      createdAt: freelancerSkills.createdAt,
      skill: {
        id: skills.id,
        name: skills.name,
        categoryId: skills.categoryId,
        icon: skills.icon
      }
    })
    .from(freelancerSkills)
    .leftJoin(skills, eq(freelancerSkills.skillId, skills.id))
    .where(eq(freelancerSkills.freelancerId, profile.id))

  // Filter out null skills
  const skillsData = skillsDataRaw.filter(s => s.skill !== null) as any[]

  // Get portfolio items
  const portfolio = await db
    .select()
    .from(portfolioItems)
    .where(eq(portfolioItems.freelancerId, profile.id))
    .orderBy(desc(portfolioItems.sortOrder), desc(portfolioItems.createdAt))

  // Get review count
  const [reviewStats] = await db
    .select({
      count: sql<number>`count(*)::int`,
      avgRating: sql<number>`COALESCE(AVG(${freelancerReviews.rating}), 0)`
    })
    .from(freelancerReviews)
    .where(eq(freelancerReviews.freelancerId, userId))

  return {
    ...profile,
    user: profile.user!,
    skills: skillsData,
    portfolioItems: portfolio,
    reviewCount: reviewStats?.count || 0,
    avgRating: reviewStats?.avgRating || 0
  } as FreelancerProfileWithRelations
}

// Get freelancer profile by ID (public view)
export async function getFreelancerProfileById(
  profileId: number
): Promise<FreelancerProfileWithRelations | null> {
  const [profile] = await db
    .select({
      userId: freelancerProfiles.userId
    })
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.id, profileId))
    .limit(1)

  if (!profile) return null

  return getFreelancerProfileByUserId(profile.userId)
}

// Create or update freelancer profile
export async function upsertFreelancerProfile(
  userId: number,
  data: Partial<NewFreelancerProfile>
): Promise<FreelancerProfile> {
  const existingProfile = await db
    .select()
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.userId, userId))
    .limit(1)

  if (existingProfile.length > 0) {
    // Update existing profile
    const [updated] = await db
      .update(freelancerProfiles)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.userId, userId))
      .returning()

    return updated
  } else {
    // Create new profile
    const [created] = await db
      .insert(freelancerProfiles)
      .values({
        ...data,
        userId
      })
      .returning()

    return created
  }
}

// Update freelancer skills
export async function updateFreelancerSkills(
  freelancerId: number,
  skillsData: {
    skillId: number
    yearsOfExperience?: number
    skillLevel?: 'beginner' | 'intermediate' | 'expert'
  }[]
): Promise<void> {
  // Delete existing skills
  await db
    .delete(freelancerSkills)
    .where(eq(freelancerSkills.freelancerId, freelancerId))

  // Insert new skills
  if (skillsData.length > 0) {
    await db.insert(freelancerSkills).values(
      skillsData.map(skill => ({
        freelancerId,
        skillId: skill.skillId,
        yearsOfExperience: skill.yearsOfExperience || 0,
        skillLevel: skill.skillLevel || 'intermediate'
      }))
    )
  }
}

// Get all skills
export async function getAllSkills() {
  return db
    .select({
      id: skills.id,
      name: skills.name,
      categoryId: skills.categoryId,
      description: skills.description,
      icon: skills.icon,
      category: {
        id: jobCategories.id,
        name: jobCategories.name,
        icon: jobCategories.icon
      }
    })
    .from(skills)
    .leftJoin(jobCategories, eq(skills.categoryId, jobCategories.id))
    .orderBy(skills.name)
}

// Create portfolio item
export async function createPortfolioItem(
  data: NewPortfolioItem
): Promise<PortfolioItem> {
  const [item] = await db.insert(portfolioItems).values(data).returning()
  return item
}

// Update portfolio item
export async function updatePortfolioItem(
  id: number,
  freelancerId: number,
  data: Partial<NewPortfolioItem>
): Promise<PortfolioItem | null> {
  const [updated] = await db
    .update(portfolioItems)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(portfolioItems.id, id),
        eq(portfolioItems.freelancerId, freelancerId)
      )
    )
    .returning()

  return updated || null
}

// Delete portfolio item
export async function deletePortfolioItem(
  id: number,
  freelancerId: number
): Promise<boolean> {
  const result = await db
    .delete(portfolioItems)
    .where(
      and(
        eq(portfolioItems.id, id),
        eq(portfolioItems.freelancerId, freelancerId)
      )
    )

  return true // Successfully deleted if no error thrown
}

// Search freelancers with filters
export async function searchFreelancers(
  filters: FreelancerFilters
): Promise<{ freelancers: FreelancerProfileWithRelations[]; total: number }> {
  const conditions = []

  // Search by name, title, or bio
  if (filters.search) {
    conditions.push(
      or(
        ilike(users.name, `%${filters.search}%`),
        ilike(freelancerProfiles.professionalTitle, `%${filters.search}%`),
        ilike(freelancerProfiles.bio, `%${filters.search}%`)
      )
    )
  }

  // Filter by hourly rate
  if (filters.minRate) {
    conditions.push(
      sql`CAST(${freelancerProfiles.hourlyRate} AS DECIMAL) >= ${filters.minRate}`
    )
  }
  if (filters.maxRate) {
    conditions.push(
      sql`CAST(${freelancerProfiles.hourlyRate} AS DECIMAL) <= ${filters.maxRate}`
    )
  }

  // Filter by availability
  if (filters.availability) {
    conditions.push(eq(freelancerProfiles.availability, filters.availability))
  }

  // Filter by verification status
  if (filters.verified) {
    conditions.push(eq(freelancerProfiles.verificationStatus, 'verified'))
  }

  // Filter by minimum rating
  if (filters.minRating) {
    conditions.push(gte(freelancerProfiles.avgRating, filters.minRating * 10)) // Rating stored as int (1-50)
  }

  // Build where clause
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(freelancerProfiles)
    .leftJoin(users, eq(freelancerProfiles.userId, users.id))
    .where(whereClause)

  // Determine order by
  let orderByClause
  switch (filters.sortBy) {
    case 'rating':
      orderByClause = desc(freelancerProfiles.avgRating)
      break
    case 'price_low':
      orderByClause = asc(
        sql`CAST(${freelancerProfiles.hourlyRate} AS DECIMAL)`
      )
      break
    case 'price_high':
      orderByClause = desc(
        sql`CAST(${freelancerProfiles.hourlyRate} AS DECIMAL)`
      )
      break
    case 'experience':
      orderByClause = desc(freelancerProfiles.yearsOfExperience)
      break
    case 'newest':
    default:
      orderByClause = desc(freelancerProfiles.createdAt)
  }

  // Get freelancers
  const profiles = await db
    .select({
      id: freelancerProfiles.id,
      userId: freelancerProfiles.userId,
      professionalTitle: freelancerProfiles.professionalTitle,
      bio: freelancerProfiles.bio,
      hourlyRate: freelancerProfiles.hourlyRate,
      availability: freelancerProfiles.availability,
      yearsOfExperience: freelancerProfiles.yearsOfExperience,
      languages: freelancerProfiles.languages,
      timezone: freelancerProfiles.timezone,
      portfolioUrl: freelancerProfiles.portfolioUrl,
      linkedinUrl: freelancerProfiles.linkedinUrl,
      githubUrl: freelancerProfiles.githubUrl,
      verificationStatus: freelancerProfiles.verificationStatus,
      totalJobs: freelancerProfiles.totalJobs,
      totalEarnings: freelancerProfiles.totalEarnings,
      avgRating: freelancerProfiles.avgRating,
      completionRate: freelancerProfiles.completionRate,
      responseTime: freelancerProfiles.responseTime,
      lastActiveAt: freelancerProfiles.lastActiveAt,
      metadata: freelancerProfiles.metadata,
      profileViews: freelancerProfiles.profileViews,
      createdAt: freelancerProfiles.createdAt,
      updatedAt: freelancerProfiles.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarPath,
        walletAddress: users.walletAddress
      }
    })
    .from(freelancerProfiles)
    .leftJoin(users, eq(freelancerProfiles.userId, users.id))
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(filters.limit || 20)
    .offset(filters.offset || 0)

  // Get skills for each freelancer
  const freelancerIds = profiles.map(p => p.id)
  let skillsMap: Record<number, any[]> = {}

  if (freelancerIds.length > 0) {
    const allSkills = await db
      .select({
        freelancerId: freelancerSkills.freelancerId,
        id: freelancerSkills.id,
        skillId: freelancerSkills.skillId,
        yearsOfExperience: freelancerSkills.yearsOfExperience,
        skillLevel: freelancerSkills.skillLevel,
        isVerified: freelancerSkills.isVerified,
        verifiedAt: freelancerSkills.verifiedAt,
        endorsements: freelancerSkills.endorsements,
        createdAt: freelancerSkills.createdAt,
        skill: {
          id: skills.id,
          name: skills.name,
          categoryId: skills.categoryId,
          icon: skills.icon
        }
      })
      .from(freelancerSkills)
      .leftJoin(skills, eq(freelancerSkills.skillId, skills.id))
      .where(inArray(freelancerSkills.freelancerId, freelancerIds))

    skillsMap = allSkills.reduce(
      (acc, skill) => {
        if (!acc[skill.freelancerId]) {
          acc[skill.freelancerId] = []
        }
        acc[skill.freelancerId].push(skill)
        return acc
      },
      {} as Record<number, any[]>
    )
  }

  // Filter by skills if specified
  let filteredProfiles = profiles
  if (filters.skills && filters.skills.length > 0) {
    filteredProfiles = profiles.filter(profile => {
      const profileSkills = skillsMap[profile.id] || []
      const profileSkillIds = profileSkills.map(s => s.skillId)
      return filters.skills!.some(skillId => profileSkillIds.includes(skillId))
    })
  }

  // Map profiles with their relations
  const freelancersWithRelations: FreelancerProfileWithRelations[] =
    filteredProfiles
      .filter(p => p.user !== null)
      .map(profile => ({
        ...profile,
        user: profile.user!,
        skills: skillsMap[profile.id] || [],
        portfolioItems: [], // Will be loaded separately if needed
        reviewCount: 0, // Will be loaded separately if needed
        avgRating: profile.avgRating / 10, // Convert from int to decimal
        metadata: profile.metadata || {},
        profileViews: profile.profileViews || 0
      }))

  return {
    freelancers: freelancersWithRelations,
    total: countResult?.count || 0
  }
}

// Get freelancer stats
export async function getFreelancerStats(
  userId: number
): Promise<ProfileStats> {
  const profile = await db
    .select()
    .from(freelancerProfiles)
    .where(eq(freelancerProfiles.userId, userId))
    .limit(1)

  if (!profile[0]) {
    return {
      profileViews: 0,
      activeBids: 0,
      completedJobs: 0,
      totalEarnings: '0',
      avgResponseTime: null,
      completionRate: 100
    }
  }

  // Get active bids count
  const [activeBidsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobBids)
    .where(and(eq(jobBids.freelancerId, userId), eq(jobBids.status, 'pending')))
  const activeBids = activeBidsResult?.count || 0

  // Get completed jobs
  const [completedJobs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobPostings)
    .where(
      and(
        eq(jobPostings.freelancerId, userId),
        eq(jobPostings.status, 'completed')
      )
    )

  return {
    profileViews: profile[0].profileViews || 0, // Now tracked in profileViews field
    activeBids,
    completedJobs: completedJobs?.count || 0,
    totalEarnings: profile[0].totalEarnings,
    avgResponseTime: profile[0].responseTime,
    completionRate: profile[0].completionRate
  }
}

// Update last active timestamp
export async function updateLastActive(userId: number): Promise<void> {
  await db
    .update(freelancerProfiles)
    .set({ lastActiveAt: new Date() })
    .where(eq(freelancerProfiles.userId, userId))
}

// Increment profile view count
export async function incrementProfileViews(userId: number): Promise<void> {
  await db
    .update(freelancerProfiles)
    .set({
      profileViews: sql`${freelancerProfiles.profileViews} + 1`,
      updatedAt: new Date()
    })
    .where(eq(freelancerProfiles.userId, userId))
}

// Alias for getFreelancerProfileByUserId (used in profile pages)
export const getFreelancerProfile = getFreelancerProfileByUserId

// Aliases for compatibility with route handlers
export const createFreelancerProfile = upsertFreelancerProfile
export const updateFreelancerProfile = upsertFreelancerProfile

// Get platform statistics for freelancers page
export async function getFreelancerPlatformStats(): Promise<{
  activeFreelancers: number
  avgRating: number
  successRate: number
}> {
  try {
    // Get count of active freelancers (those who were active in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [activeCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(freelancerProfiles)
      .where(
        and(
          eq(freelancerProfiles.availability, 'available'),
          gte(freelancerProfiles.lastActiveAt, thirtyDaysAgo)
        )
      )

    // Get average rating across all freelancers (convert from int 1-50 to decimal 1-5)
    const [ratingResult] = await db
      .select({
        avgRating: sql<number>`COALESCE(AVG(CASE WHEN ${freelancerProfiles.avgRating} > 0 THEN ${freelancerProfiles.avgRating} / 10.0 ELSE NULL END), 0)`
      })
      .from(freelancerProfiles)
      .where(sql`${freelancerProfiles.avgRating} > 0`)

    // Get average completion rate (success rate)
    const [successResult] = await db
      .select({
        avgCompletionRate: sql<number>`COALESCE(AVG(${freelancerProfiles.completionRate}), 0)`
      })
      .from(freelancerProfiles)
      .where(sql`${freelancerProfiles.totalJobs} > 0`)

    return {
      activeFreelancers: activeCount?.count || 0,
      avgRating: Math.round((ratingResult?.avgRating || 0) * 10) / 10, // Round to 1 decimal
      successRate: Math.round(successResult?.avgCompletionRate || 0)
    }
  } catch (error) {
    console.error('Error fetching platform stats:', error)
    // Return default values if error
    return {
      activeFreelancers: 0,
      avgRating: 0,
      successRate: 0
    }
  }
}

// Placeholder for reviews function - needs to be implemented based on schema
export async function getFreelancerReviews(
  userId: number,
  options?: { limit?: number; offset?: number }
): Promise<any[]> {
  try {
    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, userId))
      .limit(1)

    if (!profile || profile.length === 0) {
      return []
    }

    // Get reviews for this freelancer
    const reviews = await db
      .select({
        id: freelancerReviews.id,
        jobId: freelancerReviews.jobId,
        rating: freelancerReviews.rating,
        reviewText: freelancerReviews.reviewText,
        skillsRating: freelancerReviews.skillsRating,
        communicationRating: freelancerReviews.communicationRating,
        qualityRating: freelancerReviews.qualityRating,
        deadlineRating: freelancerReviews.deadlineRating,
        wouldHireAgain: freelancerReviews.wouldHireAgain,
        createdAt: freelancerReviews.createdAt,
        client: {
          id: users.id,
          username: users.walletAddress,
          name: users.name,
          image: users.avatarPath
        }
      })
      .from(freelancerReviews)
      .innerJoin(users, eq(freelancerReviews.reviewerId, users.id))
      .where(eq(freelancerReviews.freelancerId, profile[0].id))
      .orderBy(desc(freelancerReviews.createdAt))
      .limit(options?.limit || 10)
      .offset(options?.offset || 0)

    return reviews
  } catch (error) {
    console.error('Error fetching freelancer reviews:', error)
    return []
  }
}
