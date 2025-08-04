import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { getCurrentUserAction } from '@/lib/actions/user'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'
import { IMAGE_MIME_TYPES } from '@/lib/utils/file'
import {
  processUploadedFile,
  getUploadUrl,
  validateImageFile
} from '@/lib/utils/upload'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserAction()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate the file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Process and save the file
    const processedFile = await processUploadedFile(file, {
      uploadType: 'avatars',
      subPath: `user-${user.id}`
    })

    // Additional validation on processed file
    if (!IMAGE_MIME_TYPES.includes(processedFile.mimeType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
    }

    // Update user's avatar path in database
    await db
      .update(users)
      .set({
        avatarPath: processedFile.relativePath,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({
      success: true,
      avatarUrl: getUploadUrl(processedFile.relativePath)
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const user = await getCurrentUserAction()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove avatar path from database
    await db
      .update(users)
      .set({
        avatarPath: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}
