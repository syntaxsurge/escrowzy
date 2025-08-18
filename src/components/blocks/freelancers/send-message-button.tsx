'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { MessageSquare } from 'lucide-react'
import useSWR from 'swr'

import { AuthRequiredModal } from '@/components/blocks/freelancers/auth-required-modal'
import { Button } from '@/components/ui/button'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useUnifiedWalletInfo } from '@/context'
import { swrConfig, swrFetcher } from '@/lib/api/swr'

interface SendMessageButtonProps {
  currentUserId?: number
  targetUserId: number
  isAuthenticated: boolean
}

export function SendMessageButton({
  currentUserId,
  targetUserId,
  isAuthenticated: _initialAuth // Unused, we'll check auth internally
}: SendMessageButtonProps) {
  const { isConnected } = useUnifiedWalletInfo()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Use SWR to check if user has a team (is authenticated with dashboard)
  const { data: teamData, isLoading: teamLoading } = useSWR(
    isConnected ? apiEndpoints.team : null,
    swrFetcher,
    {
      ...swrConfig,
      revalidateOnFocus: false,
      onError: () => {
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

  const getChatUrl = () => {
    if (!currentUserId) return '#'
    return appRoutes.chat.direct(
      `${Math.min(currentUserId, targetUserId)}_${Math.max(currentUserId, targetUserId)}`
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isConnected || !isAuthenticated || !currentUserId) {
      e.preventDefault()
      setShowAuthModal(true)
      return
    }
  }

  // If fully authenticated with a current user ID, show as a link
  if (isAuthenticated && currentUserId) {
    return (
      <Button
        variant='outline'
        asChild
        className='border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
      >
        <Link href={getChatUrl()}>
          <MessageSquare className='mr-2 h-4 w-4' />
          Send Message
        </Link>
      </Button>
    )
  }

  // Otherwise show as a button that opens auth modal
  return (
    <>
      <Button
        variant='outline'
        onClick={handleClick}
        className='border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
      >
        <MessageSquare className='mr-2 h-4 w-4' />
        Send Message
      </Button>
      <AuthRequiredModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title={!isConnected ? 'Sign in to Message' : 'Sign to Access Dashboard'}
        description={
          !isConnected
            ? 'Connect your wallet to send messages to freelancers.'
            : 'Sign the message to access your dashboard and send messages.'
        }
        isConnected={isConnected}
        isAuthenticated={isAuthenticated}
      />
    </>
  )
}
