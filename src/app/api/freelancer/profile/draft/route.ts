import { NextRequest } from 'next/server'
import { getAuth } from '@/lib/auth/auth-utils'
import { apiResponses } from '@/lib/api/api-responses'
import { db } from '@/lib/db'
import { profileDrafts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const draft = await db
      .select()
      .from(profileDrafts)
      .where(eq(profileDrafts.userId, auth.userId))
      .limit(1)

    if (!draft || draft.length === 0) {
      return apiResponses.notFound('No draft found')
    }

    return apiResponses.success({ draft: draft[0].data })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to fetch draft')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    const body = await request.json()

    // Check if draft exists
    const existingDraft = await db
      .select()
      .from(profileDrafts)
      .where(eq(profileDrafts.userId, auth.userId))
      .limit(1)

    if (existingDraft.length > 0) {
      // Update existing draft
      await db
        .update(profileDrafts)
        .set({
          data: body,
          updatedAt: new Date()
        })
        .where(eq(profileDrafts.userId, auth.userId))
    } else {
      // Create new draft
      await db.insert(profileDrafts).values({
        userId: auth.userId,
        data: body
      })
    }

    return apiResponses.success({ message: 'Draft saved successfully' })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to save draft')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuth()
    if (!auth) {
      return apiResponses.unauthorized()
    }

    await db
      .delete(profileDrafts)
      .where(eq(profileDrafts.userId, auth.userId))

    return apiResponses.success({ message: 'Draft deleted successfully' })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to delete draft')
  }
}