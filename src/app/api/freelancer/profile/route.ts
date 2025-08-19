import { NextRequest } from 'next/server'

import { apiResponses } from '@/lib/api/server-utils'
import { getAuth } from '@/lib/auth/auth-utils'
import {
  getFreelancerProfileByUserId,
  createFreelancerProfile,
  updateFreelancerProfile,
  updateFreelancerSkills,
  updatePortfolioItems
} from '@/lib/db/queries/freelancers'
import { freelancerProfileSchema } from '@/lib/schemas/freelancer'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const profile = await getFreelancerProfileByUserId(auth.id)

    if (!profile) {
      return apiResponses.notFound('Freelancer profile not found')
    }

    return apiResponses.success({ profile })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to fetch profile')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const body = await request.json()

    // Validate the profile data
    const validatedData = freelancerProfileSchema.parse(body)

    // Check if profile already exists
    const existingProfile = await getFreelancerProfileByUserId(auth.id)
    if (existingProfile) {
      return apiResponses.badRequest('Profile already exists')
    }

    // Create the profile (clean empty strings)
    const profile = await createFreelancerProfile(auth.id, {
      professionalTitle: validatedData.professionalTitle,
      bio: validatedData.bio,
      hourlyRate: validatedData.hourlyRate?.toString(),
      availability: validatedData.availability,
      yearsOfExperience: validatedData.yearsOfExperience,
      timezone: validatedData.timezone,
      portfolioUrl:
        validatedData.portfolioUrl === ''
          ? undefined
          : validatedData.portfolioUrl,
      linkedinUrl:
        validatedData.linkedinUrl === ''
          ? undefined
          : validatedData.linkedinUrl,
      githubUrl:
        validatedData.githubUrl === '' ? undefined : validatedData.githubUrl,
      languages: validatedData.languages
    })

    // Save skills if provided
    if (body.skills && Array.isArray(body.skills) && body.skills.length > 0) {
      await updateFreelancerSkills(
        profile.id,
        body.skills.map((skill: any) => ({
          skillId: skill.id || skill.skillId,
          yearsOfExperience: skill.yearsOfExperience,
          skillLevel: skill.skillLevel
        }))
      )
    }

    // Save portfolio items if provided
    if (
      body.portfolioItems &&
      Array.isArray(body.portfolioItems) &&
      body.portfolioItems.length > 0
    ) {
      await updatePortfolioItems(
        profile.id,
        body.portfolioItems.map((item: any) => ({
          title: item.title,
          description: item.description,
          projectUrl: item.projectUrl,
          images: item.images || [],
          categoryId: item.categoryId,
          skillsUsed: item.skillsUsed || [],
          completionDate: item.completionDate,
          clientName: item.clientName
        }))
      )
    }

    // Get the complete profile with relations
    const completeProfile = await getFreelancerProfileByUserId(auth.id)

    return apiResponses.success({ profile: completeProfile })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to create profile')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const body = await request.json()

    // Get existing profile
    const existingProfile = await getFreelancerProfileByUserId(auth.id)
    if (!existingProfile) {
      return apiResponses.notFound('Profile not found')
    }

    // Update the profile (clean empty strings)
    await updateFreelancerProfile(auth.id, {
      professionalTitle: body.professionalTitle,
      bio: body.bio,
      hourlyRate: body.hourlyRate?.toString(),
      availability: body.availability || body.availabilityStatus,
      yearsOfExperience: body.yearsOfExperience,
      timezone: body.timezone,
      portfolioUrl: body.portfolioUrl === '' ? undefined : body.portfolioUrl,
      linkedinUrl: body.linkedinUrl === '' ? undefined : body.linkedinUrl,
      githubUrl: body.githubUrl === '' ? undefined : body.githubUrl,
      languages: body.languages
    })

    // Update skills if provided
    if (body.skills && Array.isArray(body.skills)) {
      await updateFreelancerSkills(
        existingProfile.id,
        body.skills.map((skill: any) => ({
          skillId: skill.id || skill.skillId,
          yearsOfExperience: skill.yearsOfExperience,
          skillLevel: skill.skillLevel
        }))
      )
    }

    // Update portfolio items if provided
    if (body.portfolioItems && Array.isArray(body.portfolioItems)) {
      await updatePortfolioItems(
        existingProfile.id,
        body.portfolioItems.map((item: any) => ({
          title: item.title,
          description: item.description,
          projectUrl: item.projectUrl,
          images: item.images || [],
          categoryId: item.categoryId,
          skillsUsed: item.skillsUsed || [],
          completionDate: item.completionDate,
          clientName: item.clientName
        }))
      )
    }

    // Get the complete profile with relations
    const completeProfile = await getFreelancerProfileByUserId(auth.id)

    return apiResponses.success({ profile: completeProfile })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to update profile')
  }
}
