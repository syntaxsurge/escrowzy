'use client'

import { mutate } from 'swr'

import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { api } from '@/lib/api/http-client'

/**
 * Centralized wallet disconnect function that handles both session clearing and wallet disconnection
 * This ensures consistent behavior across all disconnect implementations
 * Works with both RainbowKit (wagmi) and thirdweb providers
 */
export async function disconnectWallet(disconnect?: () => void): Promise<void> {
  try {
    // Clear the session by calling signout API
    await api.post(apiEndpoints.auth.signOut, undefined, {
      credentials: 'include'
    })

    // Clear SWR cache to remove user data
    await mutate(apiEndpoints.user.profile, null, { revalidate: false })
    await mutate(apiEndpoints.team, null, { revalidate: false })

    // Disconnect wallet if disconnect function is provided
    if (disconnect) {
      disconnect()
    }

    // Force redirect to home page to prevent access to protected routes
    window.location.href = appRoutes.home
  } catch (error) {
    console.error('Error during wallet disconnect:', error)
    // Still redirect even if signout fails to ensure user is logged out
    window.location.href = appRoutes.home
  }
}

/**
 * Hook to get the centralized disconnect function
 * This provides a consistent interface for all components
 */
export function useWalletDisconnect() {
  return {
    disconnect: disconnectWallet
  }
}
