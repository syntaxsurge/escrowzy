import { NextRequest, NextResponse } from 'next/server'

import { getAllSkills } from '@/lib/db/queries/freelancers'

export async function GET(request: NextRequest) {
  try {
    const skills = await getAllSkills()

    return NextResponse.json({
      skills
    })
  } catch (error) {
    console.error('Error fetching skills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}
