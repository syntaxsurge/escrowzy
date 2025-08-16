import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { deliveryPackages, jobPostings } from '@/lib/db/schema'
import { requireAuth } from '@/lib/middleware/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; packageId: string } }
) {
  try {
    const user = await requireAuth(request)
    const jobId = parseInt(params.id)
    const packageId = parseInt(params.packageId)
    const body = await request.json()

    // Verify client access
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.clientId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only client can accept packages' },
        { status: 403 }
      )
    }

    // Get the package
    const deliveryPackage = await db.query.deliveryPackages.findFirst({
      where: eq(deliveryPackages.id, packageId)
    })

    if (!deliveryPackage || deliveryPackage.jobId !== jobId) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      )
    }

    if (deliveryPackage.status !== 'delivered') {
      return NextResponse.json(
        { success: false, error: 'Package already processed' },
        { status: 400 }
      )
    }

    // Update package status
    const [updatedPackage] = await db
      .update(deliveryPackages)
      .set({
        status: 'accepted',
        acceptanceNote: body.acceptanceNote || null,
        signature: body.signature,
        signedBy: user.id,
        acceptedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(deliveryPackages.id, packageId))
      .returning()

    return NextResponse.json({
      success: true,
      package: updatedPackage,
      message: 'Delivery package accepted successfully'
    })
  } catch (error) {
    console.error('Failed to accept package:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to accept package' },
      { status: 500 }
    )
  }
}
