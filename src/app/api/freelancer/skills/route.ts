import { NextRequest } from 'next/server'

import { eq, and } from 'drizzle-orm'

import { apiResponses } from '@/lib/api/server-utils'
import { getAuth } from '@/lib/auth/auth-utils'
import { db } from '@/lib/db/drizzle'
import { freelancerProfiles, freelancerSkills, skills } from '@/lib/db/schema'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, auth.id))
      .limit(1)

    if (!profile || profile.length === 0) {
      return apiResponses.notFound('Freelancer profile not found')
    }

    // Get freelancer skills with skill details
    const userSkills = await db
      .select()
      .from(freelancerSkills)
      .innerJoin(skills, eq(freelancerSkills.skillId, skills.id))
      .where(eq(freelancerSkills.freelancerId, profile[0].id))

    return apiResponses.success({
      skills: userSkills.map(s => ({
        id: s.freelancer_skills.id,
        skillId: s.skills.id,
        name: s.skills.name,
        categoryId: s.skills.categoryId,
        yearsOfExperience: s.freelancer_skills.yearsOfExperience,
        skillLevel: s.freelancer_skills.skillLevel,
        verified: s.freelancer_skills.isVerified
      }))
    })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to fetch skills')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const body = await request.json()

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, auth.id))
      .limit(1)

    if (!profile || profile.length === 0) {
      return apiResponses.notFound('Freelancer profile not found')
    }

    // Check if skill already exists
    const existingSkill = await db
      .select()
      .from(freelancerSkills)
      .where(
        and(
          eq(freelancerSkills.freelancerId, profile[0].id),
          eq(freelancerSkills.skillId, body.skillId || body.id)
        )
      )
      .limit(1)

    if (existingSkill.length > 0) {
      return apiResponses.badRequest('Skill already added')
    }

    // Add skill
    const [newSkill] = await db
      .insert(freelancerSkills)
      .values({
        freelancerId: profile[0].id,
        skillId: body.skillId || body.id,
        yearsOfExperience: body.yearsOfExperience || 0,
        skillLevel: body.skillLevel || 'beginner'
      })
      .returning()

    // Get skill details
    const skillDetails = await db
      .select()
      .from(skills)
      .where(eq(skills.id, newSkill.skillId))
      .limit(1)

    return apiResponses.success({
      id: newSkill.id,
      skillId: skillDetails[0].id,
      name: skillDetails[0].name,
      categoryId: skillDetails[0].categoryId,
      yearsOfExperience: newSkill.yearsOfExperience,
      skillLevel: newSkill.skillLevel,
      verified: newSkill.isVerified
    })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to add skill')
  }
}
