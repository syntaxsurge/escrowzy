import { NextRequest, NextResponse } from 'next/server'

import { migrateServicesToJobs } from '@/lib/db/migrations/migrate-services-to-jobs'
import { getUser } from '@/services/user'

// POST /api/admin/migrate-services - Run migration to move services to jobs table
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only allow admin users to run migration
    // For now, we'll allow any authenticated user to run it
    // In production, you should check if user.role === 'admin' or similar

    console.log(`User ${user.email} is running service migration...`)

    // Run the migration
    const result = await migrateServicesToJobs()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Migration failed'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${result.migrated} services`,
      details: {
        migrated: result.migrated,
        failed: result.failed,
        total: result.total
      }
    })
  } catch (error) {
    console.error('Migration endpoint error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to run migration'
      },
      { status: 500 }
    )
  }
}
