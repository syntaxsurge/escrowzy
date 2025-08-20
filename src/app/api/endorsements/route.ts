import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { getServerSession } from '@/lib/auth/session'
import {
  createSkillEndorsement,
  getUserSkillEndorsements,
  getSkillEndorsementStats,
  canEndorseUser
} from '@/lib/db/queries/skill-endorsements'
import { findUserById } from '@/lib/db/queries/users'

const endorsementSchema = z.object({
  endorsedUserId: z.number().int().positive(),
  skillId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  relationship: z.enum(['client', 'freelancer', 'colleague']).optional(),
  projectContext: z.string().min(10).max(500).optional(),
  jobId: z.number().int().positive().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = endorsementSchema.parse(body)

    // Check if user can endorse
    const { canEndorse, reason } = await canEndorseUser(
      session.user.id,
      validatedData.endorsedUserId
    )

    if (!canEndorse) {
      return NextResponse.json(
        { error: reason || 'Cannot endorse this user' },
        { status: 400 }
      )
    }

    const endorsement = await createSkillEndorsement({
      endorserId: session.user.id,
      ...validatedData
    })

    // Send notification to endorsed user
    const endorsedUser = await findUserById(validatedData.endorsedUserId)
    if (endorsedUser?.email) {
      // Email notification would be sent here
      console.log(
        `Notification: ${endorsedUser.name} received a skill endorsement`
      )
    }

    return NextResponse.json({
      success: true,
      endorsement
    })
  } catch (error) {
    console.error('Error creating endorsement:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create endorsement' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const statsOnly = searchParams.get('statsOnly') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const userIdNum = parseInt(userId)
    if (isNaN(userIdNum)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    if (statsOnly) {
      const stats = await getSkillEndorsementStats(userIdNum)
      return NextResponse.json({ stats })
    }

    const endorsements = await getUserSkillEndorsements(userIdNum)
    const stats = await getSkillEndorsementStats(userIdNum)

    return NextResponse.json({
      endorsements,
      stats
    })
  } catch (error) {
    console.error('Error fetching endorsements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch endorsements' },
      { status: 500 }
    )
  }
}
