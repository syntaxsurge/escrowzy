import { NextRequest, NextResponse } from 'next/server'

import { desc, eq } from 'drizzle-orm'

import { getUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/db/drizzle'
import { fileAnnotations, fileVersions, users } from '@/lib/db/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUserFromRequest()
    const fileVersionId = parseInt(id)

    // Verify access to file
    const fileVersion = await db.query.fileVersions.findFirst({
      where: eq(fileVersions.id, fileVersionId)
    })

    if (!fileVersion) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get annotations with user info
    const annotations = await db
      .select({
        id: fileAnnotations.id,
        comment: fileAnnotations.comment,
        coordinates: fileAnnotations.coordinates,
        pageNumber: fileAnnotations.pageNumber,
        lineNumber: fileAnnotations.lineNumber,
        status: fileAnnotations.status,
        user: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarPath
        },
        resolvedAt: fileAnnotations.resolvedAt,
        parentAnnotationId: fileAnnotations.parentAnnotationId,
        createdAt: fileAnnotations.createdAt,
        updatedAt: fileAnnotations.updatedAt
      })
      .from(fileAnnotations)
      .innerJoin(users, eq(fileAnnotations.userId, users.id))
      .where(eq(fileAnnotations.fileVersionId, fileVersionId))
      .orderBy(desc(fileAnnotations.createdAt))

    // Group replies under parent annotations
    const annotationsMap = new Map<number, any>()
    const rootAnnotations: any[] = []

    annotations.forEach((annotation: any) => {
      annotationsMap.set(annotation.id, { ...annotation, replies: [] })
    })

    annotations.forEach((annotation: any) => {
      if (annotation.parentAnnotationId) {
        const parent = annotationsMap.get(annotation.parentAnnotationId)
        if (parent) {
          parent.replies.push(annotationsMap.get(annotation.id))
        }
      } else {
        rootAnnotations.push(annotationsMap.get(annotation.id))
      }
    })

    return NextResponse.json({ annotations: rootAnnotations })
  } catch (error) {
    console.error('Failed to fetch annotations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUserFromRequest()
    const fileVersionId = parseInt(id)
    const body = await request.json()

    // Verify access to file
    const fileVersion = await db.query.fileVersions.findFirst({
      where: eq(fileVersions.id, fileVersionId)
    })

    if (!fileVersion) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create annotation
    const [annotation] = await db
      .insert(fileAnnotations)
      .values({
        fileVersionId,
        userId: user.id,
        comment: body.comment,
        coordinates: body.coordinates || null,
        pageNumber: body.pageNumber || null,
        lineNumber: body.lineNumber || null,
        status: body.status || 'open',
        parentAnnotationId: body.parentAnnotationId || null
      })
      .returning()

    return NextResponse.json({
      annotation: {
        ...annotation,
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarPath
        }
      }
    })
  } catch (error) {
    console.error('Failed to create annotation:', error)
    return NextResponse.json(
      { error: 'Failed to create annotation' },
      { status: 500 }
    )
  }
}
