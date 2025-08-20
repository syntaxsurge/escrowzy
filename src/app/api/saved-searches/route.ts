import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { savedSearches } from '@/lib/db/schema'
import { getUser } from '@/services/user'

// GET /api/saved-searches - Get user's saved searches
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const searchType = searchParams.get('type') // jobs or freelancers

    // Build query conditions
    const conditions = [eq(savedSearches.userId, user.id)]
    if (searchType) {
      conditions.push(eq(savedSearches.searchType, searchType))
    }

    // Fetch saved searches
    const searches = await db
      .select()
      .from(savedSearches)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(savedSearches.createdAt))

    return NextResponse.json({
      searches
    })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
      { status: 500 }
    )
  }
}

// POST /api/saved-searches - Create a new saved search
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      searchType = 'jobs',
      filters = {},
      query,
      alertsEnabled = false,
      alertFrequency = 'daily'
    } = body

    // Validate input
    if (!name) {
      return NextResponse.json(
        { error: 'Search name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await db
      .select()
      .from(savedSearches)
      .where(
        and(eq(savedSearches.userId, user.id), eq(savedSearches.name, name))
      )
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: 'A saved search with this name already exists'
        },
        { status: 400 }
      )
    }

    // Create the saved search
    const [newSearch] = await db
      .insert(savedSearches)
      .values({
        userId: user.id,
        name,
        searchType,
        filters,
        query,
        alertsEnabled,
        alertFrequency
      })
      .returning()

    return NextResponse.json({
      search: newSearch
    })
  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to create saved search' },
      { status: 500 }
    )
  }
}

// PATCH /api/saved-searches - Update a saved search
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      )
    }

    // Check ownership
    const [search] = await db
      .select()
      .from(savedSearches)
      .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, user.id)))
      .limit(1)

    if (!search) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    // Update the search
    const [updatedSearch] = await db
      .update(savedSearches)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(savedSearches.id, id))
      .returning()

    return NextResponse.json({
      search: updatedSearch
    })
  } catch (error) {
    console.error('Error updating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to update saved search' },
      { status: 500 }
    )
  }
}

// DELETE /api/saved-searches - Delete a saved search
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      )
    }

    // Check ownership
    const [search] = await db
      .select()
      .from(savedSearches)
      .where(
        and(
          eq(savedSearches.id, parseInt(id)),
          eq(savedSearches.userId, user.id)
        )
      )
      .limit(1)

    if (!search) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    // Delete the search
    await db.delete(savedSearches).where(eq(savedSearches.id, parseInt(id)))

    return NextResponse.json({
      message: 'Saved search deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    )
  }
}
