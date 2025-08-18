import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/session'
import { applyForPartnership } from '@/lib/db/queries/partnerships'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const applicationData = await req.json()

    // Validate required fields
    const requiredFields = [
      'companyName',
      'websiteUrl',
      'contactEmail',
      'partnershipType',
      'proposedTerms'
    ]
    for (const field of requiredFields) {
      if (!applicationData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    const application = await applyForPartnership({
      ...applicationData,
      userId: session.user.id
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Failed to submit partnership application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      application,
      message: 'Partnership application submitted successfully'
    })
  } catch (error) {
    console.error('Failed to submit partnership application:', error)
    return NextResponse.json(
      { error: 'Failed to submit partnership application' },
      { status: 500 }
    )
  }
}
