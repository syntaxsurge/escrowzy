import { NextRequest } from 'next/server'

import { eq, and } from 'drizzle-orm'

import { apiResponses } from '@/lib/api/server-utils'
import { getAuth } from '@/lib/auth/auth-utils'
import { db } from '@/lib/db/drizzle'
import { freelancerProfiles, portfolioItems } from '@/lib/db/schema'
import { uploadToStorage } from '@/lib/storage/upload'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const { id } = await params
    const itemId = parseInt(id)
    const formData = await request.formData()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const categoryId = formData.get('categoryId') as string
    const projectUrl = formData.get('projectUrl') as string
    const clientName = formData.get('clientName') as string
    const completionDate = formData.get('completionDate') as string
    const skillsUsed = formData.get('skillsUsed') as string
    const existingImages = formData.get('existingImages') as string
    const newImages = formData.getAll('images') as File[]

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, auth.userId))
      .limit(1)

    if (!profile || profile.length === 0) {
      return apiResponses.notFound('Freelancer profile not found')
    }

    // Parse existing images
    let imageUrls: string[] = existingImages ? JSON.parse(existingImages) : []

    // Upload new images if provided
    if (newImages && newImages.length > 0) {
      for (const image of newImages) {
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

    // Update portfolio item
    const [updatedItem] = await db
      .update(portfolioItems)
      .set({
        title,
        description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        projectUrl,
        images: imageUrls,
        completionDate: completionDate ? new Date(completionDate) : null,
        clientName,
        skillsUsed: skillsUsed ? JSON.parse(skillsUsed) : []
      })
      .where(
        and(
          eq(portfolioItems.id, itemId),
          eq(portfolioItems.freelancerId, profile[0].id)
        )
      )
      .returning()

    if (!updatedItem) {
      return apiResponses.notFound('Portfolio item not found')
    }

    return apiResponses.success(updatedItem)
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to update portfolio item')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const itemId = parseInt(params.id)

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, auth.userId))
      .limit(1)

    if (!profile || profile.length === 0) {
      return apiResponses.notFound('Freelancer profile not found')
    }

    // Delete portfolio item
    await db
      .delete(portfolioItems)
      .where(
        and(
          eq(portfolioItems.id, itemId),
          eq(portfolioItems.freelancerId, profile[0].id)
        )
      )

    return apiResponses.success({
      message: 'Portfolio item deleted successfully'
    })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to delete portfolio item')
  }
}
