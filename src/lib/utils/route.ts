/**
 * Utility functions for route management and path matching
 */

import { appRoutes } from '@/config/app-routes'

/**
 * Check if a pathname starts with a given route prefix
 */
export function isRouteActive(pathname: string, routePrefix: string): boolean {
  return pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)
}

/**
 * Check if pathname matches any of the provided route prefixes
 */
export function matchesAnyRoute(
  pathname: string,
  routePrefixes: string[]
): boolean {
  return routePrefixes.some(prefix => isRouteActive(pathname, prefix))
}

/**
 * Get the active section based on pathname using app routes config
 */
export function getActiveSection(pathname: string): string | null {
  // Freelancer Hub - Freelancer specific routes
  if (
    matchesAnyRoute(pathname, [
      appRoutes.profile.freelancer.base,
      appRoutes.dashboard.freelancer,
      appRoutes.dashboard.freelancerBids
    ])
  ) {
    return 'freelancer'
  }

  // Command Center - Dashboard routes (excluding freelancer routes)
  if (
    isRouteActive(pathname, appRoutes.dashboard.base) &&
    !isRouteActive(pathname, appRoutes.dashboard.freelancer) &&
    !isRouteActive(pathname, appRoutes.dashboard.freelancerBids)
  ) {
    return 'command'
  }

  // Trading routes
  if (isRouteActive(pathname, appRoutes.trades.base)) {
    return 'trading'
  }

  // Battle/Gaming routes
  if (
    matchesAnyRoute(pathname, [appRoutes.battles.arena, appRoutes.rewards.base])
  ) {
    return 'battle'
  }

  // Social routes - chat, team, invitations, notifications
  if (
    matchesAnyRoute(pathname, [
      appRoutes.chat.base,
      appRoutes.dashboard.settings.team,
      appRoutes.dashboard.invitations,
      appRoutes.dashboard.notifications
    ])
  ) {
    return 'social'
  }

  // Vault routes - subscription, pricing
  if (
    matchesAnyRoute(pathname, [
      appRoutes.dashboard.settings.subscription,
      appRoutes.pricing
    ])
  ) {
    return 'vault'
  }

  // Resources routes - terms, privacy
  if (matchesAnyRoute(pathname, [appRoutes.terms, appRoutes.privacy])) {
    return 'resources'
  }

  return null
}
