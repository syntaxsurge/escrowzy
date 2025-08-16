import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  attachments,
  fileVersions,
  jobPostings,
  messages
} from '@/lib/db/schema'
import { requireAuth } from '@/lib/middleware/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const jobId = parseInt(params.id)

    // Verify access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.clientId !== user.id && job.freelancerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const description = formData.get('description') as string

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadedFiles = []

    for (const file of files) {
      // Create upload directory
      const uploadDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        'workspace',
        jobId.toString(),
        new Date().getFullYear().toString(),
        (new Date().getMonth() + 1).toString().padStart(2, '0')
      )

      await mkdir(uploadDir, { recursive: true })

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const ext = path.extname(file.name)
      const filename = `${timestamp}-${randomString}${ext}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      // Create relative path for storage
      const relativePath = `/uploads/workspace/${jobId}/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${filename}`

      // Create attachment record
      const [attachment] = await db
        .insert(attachments)
        .values({
          messageId: 0, // Temporary, we'll update this
          userId: user.id,
          filename: file.name,
          mimeType: file.type,
          path: relativePath,
          size: file.size
        })
        .returning()

      // Check if this is a new version of an existing file
      const existingFile = await db.query.fileVersions.findFirst({
        where: eq(fileVersions.filename, file.name)
      })

      let versionNumber = 1
      let originalFileId = null

      if (existingFile) {
        // This is a new version
        originalFileId = existingFile.originalFileId || existingFile.id

        // Get latest version number
        const latestVersion = await db.query.fileVersions.findFirst({
          where: eq(fileVersions.originalFileId, originalFileId),
          orderBy: (versions, { desc }) => [desc(versions.versionNumber)]
        })

        versionNumber = (latestVersion?.versionNumber || 0) + 1

        // Mark previous versions as not latest
        await db
          .update(fileVersions)
          .set({ isLatest: false })
          .where(eq(fileVersions.originalFileId, originalFileId))
      }

      // Create file version record
      const [fileVersion] = await db
        .insert(fileVersions)
        .values({
          originalFileId,
          attachmentId: attachment.id,
          jobId,
          versionNumber,
          filename: file.name,
          path: relativePath,
          size: file.size,
          mimeType: file.type,
          uploadedBy: user.id,
          changeDescription: description || null,
          isLatest: true
        })
        .returning()

      uploadedFiles.push({
        ...fileVersion,
        uploadedBy: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarPath
        }
      })
    }

    // Create a system message for file upload
    await db.insert(messages).values({
      contextType: 'job_workspace',
      contextId: jobId.toString(),
      senderId: user.id,
      content: `Uploaded ${files.length} file(s)${description ? `: ${description}` : ''}`,
      messageType: 'file',
      jobPostingId: jobId,
      isSystemMessage: true,
      metadata: {
        files: uploadedFiles.map(f => ({
          id: f.id,
          filename: f.filename,
          size: f.size,
          mimeType: f.mimeType
        }))
      }
    })

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: 'Files uploaded successfully'
    })
  } catch (error) {
    console.error('Failed to upload files:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}
