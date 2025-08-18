'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { MessageSquare } from 'lucide-react'

import { SignMessageButton } from '@/components/blocks/blockchain/sign-message-button'
import { UnifiedConnectButton } from '@/components/blocks/blockchain/unified-connect-button'
import { Button } from '@/components/ui/button'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useUnifiedWalletInfo } from '@/context'
import { api } from '@/lib/api/http-client'

interface SendMessageButtonProps {
  currentUserId?: number
  targetUserId: number
  isAuthenticated: boolean
}

export function SendMessageButton({
  currentUserId,
  targetUserId,
  isAuthenticated: initialAuth
}: SendMessageButtonProps) {
  const { isConnected } = useUnifiedWalletInfo()
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)

  // Check authentication status when wallet connection changes
  useEffect(() => {
    const checkAuth = async () => {
      if (isConnected && !isAuthenticated) {
        setIsCheckingAuth(true)
        try {
          const response = await api.get(apiEndpoints.user.profile)
          if (response.success && response.data) {
            setIsAuthenticated(true)
          }
        } catch (error) {
          // User not authenticated
        } finally {
          setIsCheckingAuth(false)
        }
      }
    }
    checkAuth()
  }, [isConnected, isAuthenticated])

  // Not connected - show connect wallet button
  if (!isConnected) {
    return (
      <div className='w-full sm:w-auto'>
        <UnifiedConnectButton />
      </div>
    )
  }

  // Connected but not authenticated - show sign message button
  if (isConnected && !isAuthenticated && !isCheckingAuth) {
    return (
      <SignMessageButton
        variant='outline'
        className='border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
      >
        Sign to Access Dashboard
      </SignMessageButton>
    )
  }

  // Authenticated - show actual message button
  if (isAuthenticated && currentUserId) {
    const chatUrl = appRoutes.chat.direct(
      `${Math.min(currentUserId, targetUserId)}_${Math.max(currentUserId, targetUserId)}`
    )

    return (
      <Button
        variant='outline'
        asChild
        className='border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
      >
        <Link href={chatUrl}>
          <MessageSquare className='mr-2 h-4 w-4' />
          Send Message
        </Link>
      </Button>
    )
  }

  return null
}
