'use client'

import React, { useEffect, useState } from 'react'

import '@rainbow-me/rainbowkit/styles.css'
import {
  getDefaultConfig,
  RainbowKitProvider,
  lightTheme,
  darkTheme
} from '@rainbow-me/rainbowkit'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { WagmiProvider } from 'wagmi'

import { appConfig } from '@/config/app-config'
import { envPublic } from '@/config/env.public'
import { SUPPORTED_CHAIN_IDS, getViemChain } from '@/lib/blockchain'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1
    }
  }
})

// Theme configuration
const customLightTheme = lightTheme({
  accentColor: '#7b3fe4',
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small'
})

const customDarkTheme = darkTheme({
  accentColor: '#7b3fe4',
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small'
})

export function WagmiRainbowKitProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [config, setConfig] = useState<ReturnType<
    typeof getDefaultConfig
  > | null>(null)

  useEffect(() => {
    setMounted(true)

    // Initialize config on client side only
    const projectId = envPublic.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    if (!projectId || projectId === '') {
      throw new Error(
        'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable is required'
      )
    }

    const viemChains = SUPPORTED_CHAIN_IDS.map(id => getViemChain(id)).filter(
      Boolean
    )

    const wagmiConfig = getDefaultConfig({
      appName: appConfig.name,
      projectId,
      chains: viemChains as any,
      ssr: false
    })

    setConfig(wagmiConfig)
  }, [])

  // Determine which theme to use based on the current theme
  // Use resolvedTheme to handle 'system' theme correctly
  const currentTheme = mounted
    ? resolvedTheme === 'dark'
      ? customDarkTheme
      : customLightTheme
    : customLightTheme // Default to light theme on initial render

  // Don't render until config is initialized
  if (!config) {
    return null
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={currentTheme} modalSize='wide'>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default WagmiRainbowKitProvider
