import 'server-only'

import { and, desc, eq, inArray, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import {
  freelancerProfiles,
  freelancerSkills,
  jobPostings,
  skills,
  users
} from '@/lib/db/schema'

// Types for skill matching
export interface SkillMatchScore {
  freelancerId: number
  jobId: number
  matchScore: number
  matchedSkills: number[]
  totalRequiredSkills: number
  skillCoverage: number // percentage
  experienceBonus: number
  ratingBonus: number
  completionBonus: number
}

export interface JobMatch {
  job: {
    id: number
    title: string
    description: string
    budgetMin: string | null
    budgetMax: string | null
    deadline: Date | null
    createdAt: Date
  }
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  matchPercentage: number
}

export interface FreelancerMatch {
  freelancer: {
    id: number
    name: string
    email: string
    avatarUrl: string | null
  }
  profile: {
    professionalTitle: string | null
    hourlyRate: string | null
    yearsOfExperience: number
    avgRating: number | null
    totalJobs: number
  }
  matchScore: number
  matchedSkills: string[]
  matchPercentage: number
}

/**
 * Calculate skill match score between a freelancer and a job
 */
export async function calculateSkillMatchScore(
  freelancerId: number,
  jobId: number
): Promise<SkillMatchScore | null> {
  try {
    // Get job requirements
    const [job] = await db
      .select({
        id: jobPostings.id,
        skillsRequired: jobPostings.skillsRequired,
        experienceLevel: jobPostings.experienceLevel
      })
      .from(jobPostings)
      .where(eq(jobPostings.id, jobId))
      .limit(1)

    if (!job) return null

    // Get freelancer skills and profile
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, freelancerId))
      .limit(1)

    if (!profile) return null

    const freelancerSkillsData = await db
      .select({
        skillId: freelancerSkills.skillId,
        yearsOfExperience: freelancerSkills.yearsOfExperience,
        skillLevel: freelancerSkills.skillLevel,
        isVerified: freelancerSkills.isVerified
      })
      .from(freelancerSkills)
      .where(eq(freelancerSkills.freelancerId, profile.id))

    // Parse required skills
    const requiredSkills = (job.skillsRequired as any[]) || []
    const requiredSkillIds = requiredSkills
      .map(s => (typeof s === 'object' ? s.id : s))
      .filter(Boolean)

    // Calculate matched skills
    const freelancerSkillIds = freelancerSkillsData.map(s => s.skillId)
    const matchedSkillIds = requiredSkillIds.filter(id =>
      freelancerSkillIds.includes(id)
    )

    // Base match score (0-100)
    const skillCoverage =
      requiredSkillIds.length > 0
        ? (matchedSkillIds.length / requiredSkillIds.length) * 100
        : 100

    // Experience bonus (0-20)
    let experienceBonus = 0
    if (job.experienceLevel) {
      const requiredExp =
        {
          entry: 0,
          intermediate: 2,
          expert: 5,
          senior: 8
        }[job.experienceLevel] || 0

      if (profile.yearsOfExperience >= requiredExp) {
        experienceBonus = Math.min(
          20,
          (profile.yearsOfExperience - requiredExp) * 2
        )
      }
    }

    // Rating bonus (0-10)
    const ratingBonus = profile.avgRating ? (profile.avgRating / 100) * 10 : 0

    // Completion bonus (0-10) based on completed jobs
    const completionBonus = Math.min(10, profile.totalJobs * 0.5)

    // Skill level bonus (0-10) for matched skills
    let skillLevelBonus = 0
    if (matchedSkillIds.length > 0) {
      const matchedSkillsData = freelancerSkillsData.filter(s =>
        matchedSkillIds.includes(s.skillId)
      )

      const avgSkillLevel =
        matchedSkillsData.reduce((sum, s) => {
          const levelScore =
            {
              beginner: 1,
              intermediate: 2,
              expert: 3
            }[s.skillLevel] || 1
          return sum + levelScore
        }, 0) / matchedSkillsData.length

      skillLevelBonus = (avgSkillLevel / 3) * 10
    }

    // Verification bonus (0-10)
    const verifiedSkills = freelancerSkillsData.filter(
      s => matchedSkillIds.includes(s.skillId) && s.isVerified
    ).length
    const verificationBonus =
      matchedSkillIds.length > 0
        ? (verifiedSkills / matchedSkillIds.length) * 10
        : 0

    // Calculate total match score
    const matchScore = Math.round(
      skillCoverage * 0.5 + // 50% weight on skill coverage
        experienceBonus * 0.15 + // 15% weight on experience
        ratingBonus * 0.15 + // 15% weight on rating
        completionBonus * 0.1 + // 10% weight on completed jobs
        skillLevelBonus * 0.05 + // 5% weight on skill level
        verificationBonus * 0.05 // 5% weight on verified skills
    )

    return {
      freelancerId,
      jobId,
      matchScore,
      matchedSkills: matchedSkillIds,
      totalRequiredSkills: requiredSkillIds.length,
      skillCoverage,
      experienceBonus,
      ratingBonus,
      completionBonus
    }
  } catch (error) {
    console.error('Error calculating skill match score:', error)
    return null
  }
}

/**
 * Find matching jobs for a freelancer
 */
export async function findMatchingJobs(
  freelancerId: number,
  options: {
    limit?: number
    minMatchScore?: number
    includeExpired?: boolean
  } = {}
): Promise<JobMatch[]> {
  const { limit = 10, minMatchScore = 50, includeExpired = false } = options

  try {
    // Get freelancer profile and skills
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, freelancerId))
      .limit(1)

    if (!profile) return []

    const freelancerSkillsData = await db
      .select({
        skillId: freelancerSkills.skillId,
        skillName: skills.name
      })
      .from(freelancerSkills)
      .leftJoin(skills, eq(freelancerSkills.skillId, skills.id))
      .where(eq(freelancerSkills.freelancerId, profile.id))

    const freelancerSkillIds = freelancerSkillsData.map(s => s.skillId)
    const freelancerSkillMap = new Map(
      freelancerSkillsData.map(s => [s.skillId, s.skillName])
    )

    // Get open jobs
    const conditions = [eq(jobPostings.status, 'open')]
    if (!includeExpired) {
      conditions.push(
        sql`${jobPostings.deadline} IS NULL OR ${jobPostings.deadline} > CURRENT_DATE`
      )
    }

    const jobs = await db
      .select()
      .from(jobPostings)
      .where(and(...conditions))
      .orderBy(desc(jobPostings.createdAt))
      .limit(limit * 3) // Get more to filter by match score

    // Calculate match scores for each job
    const jobMatches: JobMatch[] = []

    for (const job of jobs) {
      const requiredSkills = (job.skillsRequired as any[]) || []
      const requiredSkillIds = requiredSkills
        .map(s => (typeof s === 'object' ? s.id : s))
        .filter(Boolean)

      // Skip if no skills required
      if (requiredSkillIds.length === 0) continue

      // Calculate matched skills
      const matchedSkillIds = requiredSkillIds.filter(id =>
        freelancerSkillIds.includes(id)
      )

      const matchPercentage =
        (matchedSkillIds.length / requiredSkillIds.length) * 100

      // Skip if below minimum match score
      if (matchPercentage < minMatchScore) continue

      // Get skill names
      const allSkillsData = await db
        .select()
        .from(skills)
        .where(inArray(skills.id, requiredSkillIds))

      const requiredSkillMap = new Map(allSkillsData.map(s => [s.id, s.name]))

      const matchedSkillNames = matchedSkillIds
        .map(id => freelancerSkillMap.get(id))
        .filter(Boolean) as string[]

      const missingSkillIds = requiredSkillIds.filter(
        id => !freelancerSkillIds.includes(id)
      )
      const missingSkillNames = missingSkillIds
        .map(id => requiredSkillMap.get(id))
        .filter(Boolean) as string[]

      // Calculate overall match score with additional factors
      let matchScore = matchPercentage

      // Bonus for experience level match
      if (job.experienceLevel) {
        const requiredExp =
          {
            entry: 0,
            intermediate: 2,
            expert: 5,
            senior: 8
          }[job.experienceLevel] || 0

        if (profile.yearsOfExperience >= requiredExp) {
          matchScore += 10
        }
      }

      // Bonus for budget range match
      if (job.budgetType === 'hourly' && profile.hourlyRate && job.budgetMax) {
        const freelancerRate = parseFloat(profile.hourlyRate)
        const maxBudget = parseFloat(job.budgetMax)
        if (freelancerRate <= maxBudget) {
          matchScore += 5
        }
      }

      jobMatches.push({
        job: {
          id: job.id,
          title: job.title,
          description: job.description || '',
          budgetMin: job.budgetMin,
          budgetMax: job.budgetMax,
          deadline: job.deadline,
          createdAt: job.createdAt
        },
        matchScore: Math.min(100, matchScore),
        matchedSkills: matchedSkillNames,
        missingSkills: missingSkillNames,
        matchPercentage
      })
    }

    // Sort by match score and return top matches
    return jobMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
  } catch (error) {
    console.error('Error finding matching jobs:', error)
    return []
  }
}

/**
 * Find matching freelancers for a job
 */
export async function findMatchingFreelancers(
  jobId: number,
  options: {
    limit?: number
    minMatchScore?: number
    excludeApplied?: boolean
  } = {}
): Promise<FreelancerMatch[]> {
  const { limit = 10, minMatchScore = 50, excludeApplied = true } = options

  try {
    // Get job requirements
    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, jobId))
      .limit(1)

    if (!job) return []

    const requiredSkills = (job.skillsRequired as any[]) || []
    const requiredSkillIds = requiredSkills
      .map(s => (typeof s === 'object' ? s.id : s))
      .filter(Boolean)

    // Skip if no skills required
    if (requiredSkillIds.length === 0) return []

    // Get freelancers with matching skills
    const freelancersWithSkills = await db
      .select({
        freelancerId: freelancerProfiles.userId,
        profileId: freelancerProfiles.id,
        skillId: freelancerSkills.skillId
      })
      .from(freelancerProfiles)
      .innerJoin(
        freelancerSkills,
        eq(freelancerProfiles.id, freelancerSkills.freelancerId)
      )
      .where(inArray(freelancerSkills.skillId, requiredSkillIds))

    // Group by freelancer
    const freelancerSkillsMap = new Map<number, number[]>()
    for (const row of freelancersWithSkills) {
      if (!freelancerSkillsMap.has(row.freelancerId)) {
        freelancerSkillsMap.set(row.freelancerId, [])
      }
      freelancerSkillsMap.get(row.freelancerId)!.push(row.skillId)
    }

    // Calculate match scores
    const freelancerMatches: FreelancerMatch[] = []

    for (const [freelancerId, matchedSkillIds] of freelancerSkillsMap) {
      const matchPercentage =
        (matchedSkillIds.length / requiredSkillIds.length) * 100

      // Skip if below minimum match score
      if (matchPercentage < minMatchScore) continue

      // Get freelancer details
      const [freelancerData] = await db
        .select({
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarPath
          },
          profile: {
            professionalTitle: freelancerProfiles.professionalTitle,
            hourlyRate: freelancerProfiles.hourlyRate,
            yearsOfExperience: freelancerProfiles.yearsOfExperience,
            avgRating: freelancerProfiles.avgRating,
            totalJobs: freelancerProfiles.totalJobs
          }
        })
        .from(users)
        .leftJoin(freelancerProfiles, eq(users.id, freelancerProfiles.userId))
        .where(eq(users.id, freelancerId))
        .limit(1)

      if (!freelancerData) continue

      // Get skill names
      const matchedSkillsData = await db
        .select()
        .from(skills)
        .where(inArray(skills.id, matchedSkillIds))

      const matchedSkillNames = matchedSkillsData.map(s => s.name)

      // Calculate overall match score
      let matchScore = matchPercentage

      // Experience bonus
      if (job.experienceLevel && freelancerData.profile?.yearsOfExperience) {
        const requiredExp =
          {
            entry: 0,
            intermediate: 2,
            expert: 5,
            senior: 8
          }[job.experienceLevel] || 0

        if (freelancerData.profile.yearsOfExperience >= requiredExp) {
          matchScore += 10
        }
      }

      // Rating bonus
      if (freelancerData.profile?.avgRating) {
        matchScore += (freelancerData.profile.avgRating / 100) * 10
      }

      // Completed jobs bonus
      if (freelancerData.profile?.totalJobs) {
        matchScore += Math.min(5, freelancerData.profile.totalJobs * 0.5)
      }

      if (
        freelancerData.profile &&
        freelancerData.user.name &&
        freelancerData.user.email
      ) {
        freelancerMatches.push({
          freelancer: {
            ...freelancerData.user,
            name: freelancerData.user.name,
            email: freelancerData.user.email
          },
          profile: {
            ...freelancerData.profile,
            avgRating: freelancerData.profile.avgRating || 0
          },
          matchScore: Math.min(100, matchScore),
          matchedSkills: matchedSkillNames,
          matchPercentage
        })
      }
    }

    // Sort by match score and return top matches
    return freelancerMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
  } catch (error) {
    console.error('Error finding matching freelancers:', error)
    return []
  }
}
