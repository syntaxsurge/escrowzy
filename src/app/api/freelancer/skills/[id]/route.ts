import { NextRequest } from 'next/server'

import { eq, and } from 'drizzle-orm'

import { apiResponses } from '@/lib/api/server-utils'
import { getAuth } from '@/lib/auth/auth-utils'
import { db } from '@/lib/db/drizzle'
import { freelancerProfiles, freelancerSkills, skills } from '@/lib/db/schema'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const body = await request.json()
    const { id } = await params
    const skillId = parseInt(id)

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, auth.id))
      .limit(1)

    if (!profile || profile.length === 0) {
      return apiResponses.notFound('Freelancer profile not found')
    }

    // Update skill
    const [updatedSkill] = await db
      .update(freelancerSkills)
      .set({
        yearsOfExperience: body.yearsOfExperience,
        skillLevel: body.skillLevel
      })
      .where(
        and(
          eq(freelancerSkills.id, skillId),
          eq(freelancerSkills.freelancerId, profile[0].id)
        )
      )
      .returning()

    if (!updatedSkill) {
      return apiResponses.notFound('Skill not found')
    }

    // Get skill details
    const skillDetails = await db
      .select()
      .from(skills)
      .where(eq(skills.id, updatedSkill.skillId))
      .limit(1)

    return apiResponses.success({
      id: updatedSkill.id,
      skillId: skillDetails[0].id,
      name: skillDetails[0].name,
      category: skillDetails[0].categoryId,
      yearsOfExperience: updatedSkill.yearsOfExperience,
      skillLevel: updatedSkill.skillLevel,
      verified: updatedSkill.isVerified
    })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to update skill')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const { id } = await params
    const skillId = parseInt(id)

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, auth.id))
      .limit(1)

    if (!profile || profile.length === 0) {
      return apiResponses.notFound('Freelancer profile not found')
    }

    // Delete skill
    await db
      .delete(freelancerSkills)
      .where(
        and(
          eq(freelancerSkills.id, skillId),
          eq(freelancerSkills.freelancerId, profile[0].id)
        )
      )

    return apiResponses.success({ message: 'Skill removed successfully' })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to remove skill')
  }
}
