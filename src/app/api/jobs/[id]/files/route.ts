import { NextRequest, NextResponse } from 'next/server'

import { desc, eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { fileVersions, jobPostings, users } from '@/lib/db/schema'
import { getUser } from '@/services/user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const jobId = parseInt(id)

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

    // Get all file versions for this job
    const versions = await db
      .select({
        id: fileVersions.id,
        originalFileId: fileVersions.originalFileId,
        versionNumber: fileVersions.versionNumber,
        filename: fileVersions.filename,
        path: fileVersions.path,
        size: fileVersions.size,
        mimeType: fileVersions.mimeType,
        uploadedBy: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarPath
        },
        changeDescription: fileVersions.changeDescription,
        isLatest: fileVersions.isLatest,
        createdAt: fileVersions.createdAt
      })
      .from(fileVersions)
      .innerJoin(users, eq(fileVersions.uploadedBy, users.id))
      .where(eq(fileVersions.jobId, jobId))
      .orderBy(desc(fileVersions.createdAt))

    // Group versions by original file
    const filesMap = new Map()

    versions.forEach(version => {
      const fileId = version.originalFileId || version.id

      if (!filesMap.has(fileId)) {
        filesMap.set(fileId, {
          id: fileId,
          filename: version.filename,
          path: version.path,
          size: version.size,
          mimeType: version.mimeType,
          uploadedBy: version.uploadedBy,
          createdAt: version.createdAt,
          versions: [],
          latestVersion: null
        })
      }

      const file = filesMap.get(fileId)
      file.versions.push(version)

      if (version.isLatest) {
        file.latestVersion = version
        file.filename = version.filename
        file.path = version.path
        file.size = version.size
      }
    })

    const files = Array.from(filesMap.values())

    return NextResponse.json({ success: true, files })
  } catch (error) {
    console.error('Failed to fetch files:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}
