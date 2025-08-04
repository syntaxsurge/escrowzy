'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode
} from 'react'

import { appConfig } from '@/config/app-config'
import {
  DEFAULT_CHAIN_ID,
  isSupportedChainId,
  type SupportedChainIds
} from '@/lib/blockchain'

interface NetworkContextValue {
  selectedChainId: SupportedChainIds
  setSelectedChainId: (chainId: SupportedChainIds) => void
  persistedChainId: SupportedChainIds | null
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

const NETWORK_STORAGE_KEY = `${appConfig.name}-selected-network`

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [selectedChainId, setSelectedChainIdState] =
    useState<SupportedChainIds>(DEFAULT_CHAIN_ID as SupportedChainIds)
  const [persistedChainId, setPersistedChainId] =
    useState<SupportedChainIds | null>(null)

  // Load persisted network on mount
  useEffect(() => {
    const stored = localStorage.getItem(NETWORK_STORAGE_KEY)
    if (stored) {
      const chainId = Number(stored)
      if (isSupportedChainId(chainId)) {
        setSelectedChainIdState(chainId as SupportedChainIds)
        setPersistedChainId(chainId as SupportedChainIds)
      }
    }
  }, [])

  const setSelectedChainId = (chainId: SupportedChainIds) => {
    setSelectedChainIdState(chainId)
    setPersistedChainId(chainId)
    localStorage.setItem(NETWORK_STORAGE_KEY, chainId.toString())
  }

  return (
    <NetworkContext.Provider
      value={{
        selectedChainId,
        setSelectedChainId,
        persistedChainId
      }}
    >
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const context = useContext(NetworkContext)
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider')
  }
  return context
}
