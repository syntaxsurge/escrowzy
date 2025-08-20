import { NextRequest, NextResponse } from 'next/server'

import { eq, and } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobBids, jobPostings } from '@/lib/db/schema'
import { getUser } from '@/services/user'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const jobId = parseInt(id)
    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }

    // Get current user
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const bidAmount = formData.get('bidAmount') as string
    const deliveryTimeDays = parseInt(
      formData.get('deliveryTimeDays') as string
    )
    const proposalText = formData.get('proposalText') as string
    const coverLetter = formData.get('coverLetter') as string | null
    const milestoneBreakdown = formData.get('milestoneBreakdown')
      ? JSON.parse(formData.get('milestoneBreakdown') as string)
      : null

    // Validate required fields
    if (!bidAmount || !deliveryTimeDays || !proposalText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if job exists and is open
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, jobId)
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'open') {
      return NextResponse.json(
        { error: 'Job is not accepting applications' },
        { status: 400 }
      )
    }

    // Check if user already applied
    const existingBid = await db.query.jobBids.findFirst({
      where: and(eq(jobBids.jobId, jobId), eq(jobBids.freelancerId, user.id))
    })

    if (existingBid) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 400 }
      )
    }

    // Handle file attachments (simplified for now)
    const attachments: any[] = []
    const files = formData.getAll('attachments')
    // In production, you would upload files to storage and save URLs

    // Create the bid
    const [newBid] = await db
      .insert(jobBids)
      .values({
        jobId,
        freelancerId: user.id,
        bidAmount,
        deliveryDays: deliveryTimeDays,
        proposalText,
        coverLetter,
        attachments: attachments.length > 0 ? attachments : null,
        status: 'pending',
        metadata: milestoneBreakdown ? { milestones: milestoneBreakdown } : null
      })
      .returning()

    // Update job bid count
    await db
      .update(jobPostings)
      .set({
        currentBidsCount: job.currentBidsCount + 1,
        updatedAt: new Date()
      })
      .where(eq(jobPostings.id, jobId))

    return NextResponse.json(newBid)
  } catch (error) {
    console.error('Error submitting bid:', error)
    return NextResponse.json({ error: 'Failed to submit bid' }, { status: 500 })
  }
}
