import { NextRequest, NextResponse } from 'next/server'

import { searchFreelancers } from '@/lib/db/queries/freelancers'
import { freelancerSearchSchema } from '@/lib/schemas/freelancer'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse filters from query params
    const filters = {
      search: searchParams.get('search') || undefined,
      skills: searchParams
        .get('skills')
        ?.split(',')
        .map(Number)
        .filter(Boolean),
      minRate: searchParams.get('minRate')
        ? Number(searchParams.get('minRate'))
        : undefined,
      maxRate: searchParams.get('maxRate')
        ? Number(searchParams.get('maxRate'))
        : undefined,
      experienceLevel: searchParams.get('experienceLevel') as any,
      availability: searchParams.get('availability') as any,
      languages: searchParams.get('languages')?.split(',').filter(Boolean),
      minRating: searchParams.get('minRating')
        ? Number(searchParams.get('minRating'))
        : undefined,
      verified: searchParams.get('verified') === 'true',
      sortBy: (searchParams.get('sortBy') as any) || 'newest',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      offset: searchParams.get('offset')
        ? Number(searchParams.get('offset'))
        : 0
    }

    // Validate filters
    const validationResult = freelancerSearchSchema.safeParse(filters)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid filters',
          errors: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const result = await searchFreelancers(validationResult.data)

    return NextResponse.json({
      success: true,
      freelancers: result.freelancers,
      total: result.total
    })
  } catch (error) {
    console.error('Error searching freelancers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search freelancers' },
      { status: 500 }
    )
  }
}
