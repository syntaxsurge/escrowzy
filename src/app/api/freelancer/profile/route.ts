import { NextRequest } from 'next/server'
import { getAuth } from '@/lib/auth/auth-utils'
import { apiResponses } from '@/lib/api/api-responses'
import {
  getFreelancerProfileByUserId,
  createFreelancerProfile,
  updateFreelancerProfile
} from '@/lib/db/queries/freelancers'
import { freelancerProfileSchema } from '@/lib/schemas/freelancer'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const profile = await getFreelancerProfileByUserId(auth.userId)
    
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
    const existingProfile = await getFreelancerProfileByUserId(auth.userId)
    if (existingProfile) {
      return apiResponses.badRequest('Profile already exists')
    }

    // Create the profile with skills and portfolio items
    const profile = await createFreelancerProfile({
      userId: auth.userId,
      professionalTitle: validatedData.professionalTitle,
      bio: validatedData.bio,
      hourlyRate: validatedData.hourlyRate.toString(),
      availability: validatedData.availability,
      yearsOfExperience: validatedData.yearsOfExperience,
      timezone: validatedData.timezone,
      portfolioUrl: validatedData.portfolioUrl,
      linkedinUrl: validatedData.linkedinUrl,
      githubUrl: validatedData.githubUrl,
      languages: validatedData.languages,
      skills: validatedData.skills?.map(skill => ({
        skillId: skill.skillId,
        yearsOfExperience: skill.yearsOfExperience || 0,
        skillLevel: skill.skillLevel || 'beginner'
      })) || [],
      portfolioItems: validatedData.portfolioItems || []
    })

    return apiResponses.success({ profile })
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
    const existingProfile = await getFreelancerProfileByUserId(auth.userId)
    if (!existingProfile) {
      return apiResponses.notFound('Profile not found')
    }

    // Update the profile
    const updatedProfile = await updateFreelancerProfile(auth.userId, {
      professionalTitle: body.professionalTitle,
      bio: body.bio,
      hourlyRate: body.hourlyRate?.toString(),
      availability: body.availability || body.availabilityStatus,
      yearsOfExperience: body.yearsOfExperience,
      timezone: body.timezone,
      portfolioUrl: body.portfolioUrl,
      linkedinUrl: body.linkedinUrl,
      githubUrl: body.githubUrl,
      languages: body.languages,
      skills: body.skills,
      portfolioItems: body.portfolioItems
    })

    return apiResponses.success({ profile: updatedProfile })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to update profile')
  }
}