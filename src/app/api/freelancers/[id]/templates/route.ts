import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { freelancerProfiles } from '@/lib/db/schema'

interface ProposalTemplate {
  id: string
  name: string
  description?: string
  category: string
  content: string
  deliveryTimeDays: number
  priceRange?: {
    min: number
    max: number
  }
  skills: string[]
  createdAt: Date
  updatedAt: Date
  usageCount: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await verifySession()
    if (!session || Number(id) !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, Number(id)))
      .limit(1)

    if (!profile.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get templates from metadata field
    const metadata = (profile[0].metadata || {}) as any
    const templates: ProposalTemplate[] = metadata.templates || []

    // Sort by usage count and last updated
    templates.sort((a, b) => {
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    // Get template statistics
    const stats = {
      totalTemplates: templates.length,
      totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
      categories: [...new Set(templates.map(t => t.category))].length,
      mostUsed: templates[0]?.name || null
    }

    return NextResponse.json({
      templates,
      stats
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
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
    const session = await verifySession()
    if (!session || Number(id) !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      content,
      deliveryTimeDays,
      priceRange,
      skills
    } = body

    if (!name || !category || !content || !deliveryTimeDays) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, Number(id)))
      .limit(1)

    if (!profile.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get templates from metadata field
    const metadata = (profile[0].metadata || {}) as any
    const templates: ProposalTemplate[] = metadata.templates || []

    // Create new template
    const newTemplate: ProposalTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      category,
      content,
      deliveryTimeDays,
      priceRange,
      skills: skills || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    }

    // Add template
    templates.push(newTemplate)

    // Save templates to metadata field
    await db
      .update(freelancerProfiles)
      .set({
        metadata: { ...metadata, templates },
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.userId, Number(id)))

    return NextResponse.json({
      template: newTemplate,
      message: 'Template created successfully'
    })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await verifySession()
    if (!session || Number(id) !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      templateId,
      name,
      description,
      category,
      content,
      deliveryTimeDays,
      priceRange,
      skills
    } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, Number(id)))
      .limit(1)

    if (!profile.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get templates from metadata field
    const metadata = (profile[0].metadata || {}) as any
    const templates: ProposalTemplate[] = metadata.templates || []

    // Find and update template
    const templateIndex = templates.findIndex(
      (t: ProposalTemplate) => t.id === templateId
    )

    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    templates[templateIndex] = {
      ...templates[templateIndex],
      name: name || templates[templateIndex].name,
      description:
        description !== undefined
          ? description
          : templates[templateIndex].description,
      category: category || templates[templateIndex].category,
      content: content || templates[templateIndex].content,
      deliveryTimeDays:
        deliveryTimeDays || templates[templateIndex].deliveryTimeDays,
      priceRange:
        priceRange !== undefined
          ? priceRange
          : templates[templateIndex].priceRange,
      skills: skills || templates[templateIndex].skills,
      updatedAt: new Date()
    }

    // Save updated templates to metadata field
    await db
      .update(freelancerProfiles)
      .set({
        metadata: { ...metadata, templates },
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.userId, Number(id)))

    return NextResponse.json({
      template: templates[templateIndex],
      message: 'Template updated successfully'
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await verifySession()
    if (!session || Number(id) !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, Number(id)))
      .limit(1)

    if (!profile.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get templates from metadata field
    const metadata = (profile[0].metadata || {}) as any
    const templates: ProposalTemplate[] = metadata.templates || []

    // Filter out the template
    const filteredTemplates = templates.filter(
      (t: ProposalTemplate) => t.id !== templateId
    )

    if (filteredTemplates.length === templates.length) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Save updated templates to metadata field
    await db
      .update(freelancerProfiles)
      .set({
        metadata: { ...metadata, templates },
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.userId, Number(id)))

    return NextResponse.json({
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

// Increment usage count when a template is used
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await verifySession()
    if (!session || Number(id) !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get freelancer profile
    const profile = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, Number(id)))
      .limit(1)

    if (!profile.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get templates from metadata field
    const metadata = (profile[0].metadata || {}) as any
    const templates: ProposalTemplate[] = metadata.templates || []

    // Find and increment usage count
    const templateIndex = templates.findIndex(
      (t: ProposalTemplate) => t.id === templateId
    )

    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    templates[templateIndex].usageCount =
      (templates[templateIndex].usageCount || 0) + 1
    templates[templateIndex].updatedAt = new Date()

    // Save updated templates to metadata field
    await db
      .update(freelancerProfiles)
      .set({
        metadata: { ...metadata, templates },
        updatedAt: new Date()
      })
      .where(eq(freelancerProfiles.userId, Number(id)))

    return NextResponse.json({
      message: 'Template usage tracked'
    })
  } catch (error) {
    console.error('Error tracking template usage:', error)
    return NextResponse.json(
      { error: 'Failed to track template usage' },
      { status: 500 }
    )
  }
}
