import { NextRequest, NextResponse } from 'next/server'

import { desc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { deliveryPackages, jobPostings, users } from '@/lib/db/schema'
import { requireAuth } from '@/lib/middleware/auth'

export async function GET(
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

    // Get delivery packages
    const packages = await db
      .select({
        id: deliveryPackages.id,
        packageName: deliveryPackages.packageName,
        description: deliveryPackages.description,
        files: deliveryPackages.files,
        status: deliveryPackages.status,
        deliveryNote: deliveryPackages.deliveryNote,
        acceptanceNote: deliveryPackages.acceptanceNote,
        deliveredAt: deliveryPackages.deliveredAt,
        acceptedAt: deliveryPackages.acceptedAt,
        deliveredBy: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarPath
        }
      })
      .from(deliveryPackages)
      .innerJoin(users, eq(deliveryPackages.deliveredBy, users.id))
      .where(eq(deliveryPackages.jobId, jobId))
      .orderBy(desc(deliveryPackages.createdAt))

    return NextResponse.json({ success: true, packages })
  } catch (error) {
    console.error('Failed to fetch delivery packages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const jobId = parseInt(params.id)
    const body = await request.json()

    // Verify freelancer access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.freelancerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only freelancer can create packages' },
        { status: 403 }
      )
    }

    // Create delivery package
    const [deliveryPackage] = await db
      .insert(deliveryPackages)
      .values({
        jobId,
        milestoneId: body.milestoneId || null,
        packageName: body.packageName,
        description: body.description || null,
        files: body.files || [],
        deliveredBy: user.id,
        status: 'delivered',
        deliveryNote: body.deliveryNote || null,
        deliveredAt: new Date()
      })
      .returning()

    return NextResponse.json({
      success: true,
      package: {
        ...deliveryPackage,
        deliveredBy: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarPath
        }
      }
    })
  } catch (error) {
    console.error('Failed to create delivery package:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create package' },
      { status: 500 }
    )
  }
}
