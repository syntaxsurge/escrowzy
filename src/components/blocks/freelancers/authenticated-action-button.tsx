'use client'

import { useEffect, useState } from 'react'

import useSWR from 'swr'

import { SignMessageButton } from '@/components/blocks/blockchain/sign-message-button'
import { UnifiedConnectButton } from '@/components/blocks/blockchain/unified-connect-button'
import { apiEndpoints } from '@/config/api-endpoints'
import { useUnifiedWalletInfo } from '@/context'
import { swrConfig, swrFetcher } from '@/lib/api/swr'

interface AuthenticatedActionButtonProps {
  children: (isAuthenticated: boolean) => React.ReactNode
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive'
  className?: string
}

export function AuthenticatedActionButton({
  children,
  variant = 'outline',
  className = 'border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
}: AuthenticatedActionButtonProps) {
  const { isConnected } = useUnifiedWalletInfo()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Use SWR to check if user has a team (is authenticated with dashboard)
  const { data: teamData, isLoading: teamLoading } = useSWR(
    isConnected ? apiEndpoints.team : null,
    swrFetcher,
    {
      ...swrConfig,
      revalidateOnFocus: false,
      onError: () => {
        // If error (like 401), user is not authenticated
        setHasCheckedAuth(true)
      },
      onSuccess: () => {
        setHasCheckedAuth(true)
      }
    }
  )

  useEffect(() => {
    if (!isConnected) {
      setHasCheckedAuth(false)
    }
  }, [isConnected])

  const isAuthenticated = !!teamData && !teamLoading && hasCheckedAuth

  // Not connected - show connect wallet button
  if (!isConnected) {
    return (
      <div className='w-full sm:w-auto'>
        <UnifiedConnectButton />
      </div>
    )
  }

  // Connected but still checking auth status
  if (isConnected && !hasCheckedAuth && teamLoading) {
    return (
      <SignMessageButton variant={variant} className={className}>
        Sign to Access Dashboard
      </SignMessageButton>
    )
  }

  // Connected but not authenticated - show sign message button
  if (isConnected && hasCheckedAuth && !isAuthenticated) {
    return (
      <SignMessageButton variant={variant} className={className}>
        Sign to Access Dashboard
      </SignMessageButton>
    )
  }

  // Authenticated - render the actual button
  if (isAuthenticated) {
    return <>{children(true)}</>
  }

  // Default: show sign message button
  return (
    <SignMessageButton variant={variant} className={className}>
      Sign to Access Dashboard
    </SignMessageButton>
  )
}
