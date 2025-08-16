import { NextRequest } from 'next/server'
import { getAuth } from '@/lib/auth/auth-utils'
import { apiResponses } from '@/lib/api/api-responses'
import { db } from '@/lib/db'
import { freelancerProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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
      .where(eq(freelancerProfiles.userId, auth.userId))
      .limit(1)

    if (!profile || profile.length === 0) {
      return apiResponses.notFound('Freelancer profile not found')
    }

    // Return availability data
    return apiResponses.success({
      availabilityStatus: profile[0].availability,
      timezone: profile[0].timezone,
      languages: profile[0].languages,
      weeklyAvailability: [], // This could be stored in a separate table or in JSONB
      hoursPerWeek: 40, // Default value
      responseTime: '24_hours', // Default value
      vacationMode: false, // Default value
      vacationEndDate: null
    })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to fetch availability')
  }
}

export async function PUT(request: NextRequest) {
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
      .where(eq(freelancerProfiles.userId, auth.userId))
      .limit(1)

    if (!profile || profile.length === 0) {
      return apiResponses.notFound('Freelancer profile not found')
    }

    // Update availability data
    const [updatedProfile] = await db
      .update(freelancerProfiles)
      .set({
        availability: body.availabilityStatus,
        timezone: body.timezone,
        languages: body.languages,
        // Store additional availability data in the profile or create a separate table
        responseTime: body.hoursPerWeek ? Math.floor(body.hoursPerWeek / 8) : profile[0].responseTime
      })
      .where(eq(freelancerProfiles.userId, auth.userId))
      .returning()

    return apiResponses.success({
      message: 'Availability updated successfully',
      profile: updatedProfile
    })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to update availability')
  }
}