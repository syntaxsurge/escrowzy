// Session management
export { getServerSession, getSession as getAuthSession } from './session'

// User authentication functions
export { getUser } from './get-user' // For Server Components (read-only)
export {
  getUserForRoute,
  getUserForRoute as getUserFromRequest
} from './get-user-route' // For API Routes and Server Actions

// Admin authentication
export { authenticateAdminRequest as isAdmin } from './admin'

// Team authentication
export {
  validateTeamMember,
  requireTeamRole,
  getTeamMemberRole
} from './team-auth'

// Security utilities
export { rateLimit as rateLimiter } from './rate-limit'
export { addSecurityHeaders as securityHeaders } from './security-headers'

// Re-export utilities
export * from './auth-utils'
export * from './cookie-utils'
