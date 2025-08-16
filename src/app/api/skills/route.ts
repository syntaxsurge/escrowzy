import { NextRequest, NextResponse } from 'next/server'

import { getAllSkills } from '@/lib/db/queries/freelancers'

export async function GET(request: NextRequest) {
  try {
    const skills = await getAllSkills()

    return NextResponse.json({
      success: true,
      skills
    })
  } catch (error) {
    console.error('Error fetching skills:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}
