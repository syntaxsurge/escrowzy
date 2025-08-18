import { NextRequest, NextResponse } from 'next/server'

import { put } from '@vercel/blob'

import { uploadToStorage } from '@/lib/storage/upload'
import { getUser } from '@/services/user'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    let url: string

    // Use Vercel Blob storage in production
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`${folder}/${file.name}`, file, {
        access: 'public',
        addRandomSuffix: true
      })
      url = blob.url
    } else {
      // Use local storage in development
      url = await uploadToStorage(file, folder)
    }

    return NextResponse.json({
      success: true,
      url,
      filename: file.name,
      size: file.size,
      type: file.type
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
