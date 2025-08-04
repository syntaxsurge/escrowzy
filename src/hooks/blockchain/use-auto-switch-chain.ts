'use client'

import { useEffect, useRef } from 'react'

import { useBlockchain, useNetwork } from '@/context'

export function useAutoSwitchChain() {
  const { chainId, switchChain, isConnected } = useBlockchain()
  const { persistedChainId } = useNetwork()
  const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing timeout
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current)
    }

    // Only switch if:
    // 1. Wallet is connected
    // 2. We have a persisted chain preference
    // 3. Current chain is different from persisted chain
    // 4. switchChain function is available
    if (
      isConnected &&
      persistedChainId &&
      chainId &&
      chainId !== persistedChainId &&
      switchChain
    ) {
      // Add a small delay to prevent rapid switching during initialization
      switchTimeoutRef.current = setTimeout(() => {
        // Switch to the persisted chain
        switchChain(persistedChainId).catch(error => {
          console.error('Failed to switch chain:', error)
        })
      }, 500) // 500ms delay to stabilize
    }

    // Cleanup function
    return () => {
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current)
      }
    }
  }, [isConnected, chainId, persistedChainId, switchChain])
}
