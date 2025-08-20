import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from '../drizzle'
import { escrowListings, jobPostings } from '../schema'

/**
 * Migration script to move service data from escrowListings to jobPostings
 * This should be run once to consolidate all services into the unified system
 */
export async function migrateServicesToJobs() {
  try {
    console.log(
      'Starting migration of services from escrowListings to jobPostings...'
    )

    // Get all service listings from escrowListings
    const serviceListings = await db
      .select()
      .from(escrowListings)
      .where(eq(escrowListings.listingCategory, 'service'))

    console.log(`Found ${serviceListings.length} service listings to migrate`)

    let migrated = 0
    let failed = 0

    for (const service of serviceListings) {
      try {
        // Check if already migrated (avoid duplicates)
        const existing = await db
          .select()
          .from(jobPostings)
          .where(eq(jobPostings.metadata, { originalListingId: service.id }))
          .limit(1)

        if (existing.length > 0) {
          console.log(
            `Service listing ${service.id} already migrated, skipping...`
          )
          continue
        }

        // Map service fields to jobPostings fields
        // Note: Service-specific fields have been removed from escrowListings schema
        // This migration would need to be run before removing the fields
        const jobData = {
          postingType: 'service' as const,
          clientId: service.userId,
          title: 'Service Listing', // Service fields no longer available
          description: 'Migrated service listing',
          categoryId: 1, // Default category
          budgetType: service.pricePerUnit
            ? ('hourly' as const)
            : ('fixed' as const),
          budgetMin: service.amount,
          budgetMax: service.amount,
          servicePrice: service.amount,
          pricePerUnit: service.pricePerUnit,
          currency: 'USD',
          deliveryTime: 7, // Default 7 days
          revisions: 0,
          paymentMethods: service.paymentMethods || [],
          skillsRequired: [],
          experienceLevel: 'intermediate',
          status: service.isActive ? 'open' : 'closed',
          visibility: 'public',
          metadata: {
            originalListingId: service.id,
            migratedAt: new Date().toISOString(),
            originalMetadata: service.metadata
          },
          createdAt: service.createdAt,
          updatedAt: new Date()
        }

        // Insert into jobPostings
        await db.insert(jobPostings).values(jobData)

        migrated++
        console.log(
          `Migrated service listing ${service.id} (${migrated}/${serviceListings.length})`
        )
      } catch (error) {
        console.error(`Failed to migrate service listing ${service.id}:`, error)
        failed++
      }
    }

    console.log(`Migration completed: ${migrated} migrated, ${failed} failed`)

    // After successful migration, we should update trades table references
    if (migrated > 0) {
      console.log('Updating trade references...')
      // This would need to be done based on your specific needs
      // For now, trades will continue to reference the original listings
    }

    return {
      success: true,
      migrated,
      failed,
      total: serviceListings.length
    }
  } catch (error) {
    console.error('Migration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Export as default for direct execution
export default migrateServicesToJobs
