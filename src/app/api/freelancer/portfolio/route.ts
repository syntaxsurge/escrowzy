import { NextRequest } from 'next/server'

import { eq } from 'drizzle-orm'

import { apiResponses } from '@/lib/api/server-utils'
import { getAuth } from '@/lib/auth/auth-utils'
import { db } from '@/lib/db/drizzle'
import { freelancerProfiles, portfolioItems } from '@/lib/db/schema'
import { uploadToStorage } from '@/lib/storage/upload'

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

    // Get portfolio items
    const items = await db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.freelancerId, profile[0].id))
      .orderBy(portfolioItems.createdAt)

    return apiResponses.success({ items })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to fetch portfolio')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const categoryId = formData.get('categoryId') as string
    const projectUrl = formData.get('projectUrl') as string
    const clientName = formData.get('clientName') as string
    const completionDate = formData.get('completionDate') as string
    const skillsUsed = formData.get('skillsUsed') as string
    const images = formData.getAll('images') as File[]

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, auth.userId))
      .limit(1)

    if (!profile || profile.length === 0) {
      return apiResponses.notFound('Freelancer profile not found')
    }

    // Upload images if provided
    const imageUrls: string[] = []
    if (images && images.length > 0) {
      for (const image of images) {
        if (image && image.size > 0) {
          try {
            const url = await uploadToStorage(image, 'portfolio')
            imageUrls.push(url)
          } catch (error) {
            console.error('Failed to upload image:', error)
          }
        }
      }
    }

    // Create portfolio item
    const [newItem] = await db
      .insert(portfolioItems)
      .values({
        freelancerId: profile[0].id,
        title,
        description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        projectUrl,
        images: imageUrls,
        completionDate: completionDate ? new Date(completionDate) : null,
        clientName,
        skillsUsed: skillsUsed ? JSON.parse(skillsUsed) : []
      })
      .returning()

    return apiResponses.success(newItem)
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to add portfolio item')
  }
}
