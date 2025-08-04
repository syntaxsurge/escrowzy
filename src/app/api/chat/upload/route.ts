import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUserAction } from '@/lib/actions/user'
import { db } from '@/lib/db/drizzle'
import { attachments } from '@/lib/db/schema'
import { processUploadedFile, getUploadUrl } from '@/lib/utils/upload'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserAction()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const messageId = formData.get('messageId') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID required' },
        { status: 400 }
      )
    }

    const uploadedFiles: Array<{
      id: number
      filename: string
      mimeType: string
      size: number
      url: string
    }> = []

    for (const file of files) {
      const processedFile = await processUploadedFile(file, {
        uploadType: 'attachments'
      })

      const [attachment] = await db
        .insert(attachments)
        .values({
          messageId: parseInt(messageId),
          userId: user.id,
          filename: processedFile.originalName,
          mimeType: processedFile.mimeType,
          path: processedFile.relativePath,
          size: processedFile.size
        })
        .returning()

      uploadedFiles.push({
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: getUploadUrl(processedFile.relativePath)
      })
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}
