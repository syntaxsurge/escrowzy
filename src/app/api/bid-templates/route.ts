import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { bidTemplates } from '@/lib/db/schema'
import { bidTemplateSchema } from '@/lib/schemas/bid'
import { getUser } from '@/services/user'

// GET /api/bid-templates - Get user's bid templates
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const templates = await db
      .select()
      .from(bidTemplates)
      .where(eq(bidTemplates.freelancerId, user.id))
      .orderBy(
        desc(bidTemplates.isDefault),
        desc(bidTemplates.usageCount),
        desc(bidTemplates.createdAt)
      )

    return NextResponse.json({
      success: true,
      templates
    })
  } catch (error) {
    console.error('Error fetching bid templates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/bid-templates - Create a new bid template
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validationResult = bidTemplateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    // If this is set as default, unset other defaults
    if (validationResult.data.isDefault) {
      await db
        .update(bidTemplates)
        .set({ isDefault: false })
        .where(eq(bidTemplates.freelancerId, user.id))
    }

    // Create the template
    const [template] = await db
      .insert(bidTemplates)
      .values({
        freelancerId: user.id,
        name: validationResult.data.name,
        proposalText: validationResult.data.proposalText,
        coverLetter: validationResult.data.coverLetter || null,
        isDefault: validationResult.data.isDefault
      })
      .returning()

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('Error creating bid template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

// PATCH /api/bid-templates - Update a bid template
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Check ownership
    const [existingTemplate] = await db
      .select()
      .from(bidTemplates)
      .where(
        and(eq(bidTemplates.id, id), eq(bidTemplates.freelancerId, user.id))
      )
      .limit(1)

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    // If setting as default, unset other defaults
    if (updateData.isDefault) {
      await db
        .update(bidTemplates)
        .set({ isDefault: false })
        .where(
          and(
            eq(bidTemplates.freelancerId, user.id),
            eq(bidTemplates.isDefault, true)
          )
        )
    }

    // Update the template
    const [updatedTemplate] = await db
      .update(bidTemplates)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(bidTemplates.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      template: updatedTemplate
    })
  } catch (error) {
    console.error('Error updating bid template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE /api/bid-templates - Delete a bid template
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Check ownership
    const [existingTemplate] = await db
      .select()
      .from(bidTemplates)
      .where(
        and(
          eq(bidTemplates.id, parseInt(id)),
          eq(bidTemplates.freelancerId, user.id)
        )
      )
      .limit(1)

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    // Delete the template
    await db.delete(bidTemplates).where(eq(bidTemplates.id, parseInt(id)))

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting bid template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
