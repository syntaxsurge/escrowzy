/**
 * Database Schema - Chunked Architecture
 *
 * The schema has been organized into logical modules for better maintainability:
 *
 * - core.ts: Core user/auth tables (users, sessions, teams, etc.)
 * - payments.ts: Payment & subscription tables
 * - messaging.ts: Communication tables
 * - gamification.ts: Gaming & achievement tables
 * - trading.ts: Trading & escrow tables
 * - freelance-core.ts: Freelancer profile tables
 * - jobs.ts: Job posting & bidding tables
 * - workspace.ts: Collaboration workspace tables
 * - reputation.ts: Reputation & review tables
 * - marketing.ts: Marketing & content tables
 * - support.ts: Help & support tables
 * - system.ts: System & background tables
 * - relations.ts: All table relations
 * - types.ts: All exported types
 */

// Re-export everything from the chunked schema files
export * from './schema/core'
export * from './schema/payments'
export * from './schema/messaging'
export * from './schema/gamification'
export * from './schema/trading'
export * from './schema/freelance-core'
export * from './schema/jobs'
export * from './schema/workspace'
export * from './schema/reputation'
export * from './schema/marketing'
export * from './schema/support'
export * from './schema/system'
export * from './schema/relations'
export * from './schema/types'

// Also export ActivityType as both type and value
export { ActivityType } from '@/lib/constants/activity-types'
