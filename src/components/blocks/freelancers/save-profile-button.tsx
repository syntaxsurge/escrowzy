'use client'

import { useEffect, useState } from 'react'

import { Heart } from 'lucide-react'
import { toast } from 'sonner'

import { SignMessageButton } from '@/components/blocks/blockchain/sign-message-button'
import { UnifiedConnectButton } from '@/components/blocks/blockchain/unified-connect-button'
import { Button } from '@/components/ui/button'
import { apiEndpoints } from '@/config/api-endpoints'
import { useUnifiedWalletInfo } from '@/context'
import { api } from '@/lib/api/http-client'

interface SaveProfileButtonProps {
  freelancerId: string
  isSaved?: boolean
  isAuthenticated?: boolean
}

export function SaveProfileButton({
  freelancerId,
  isSaved: initialSaved = false,
  isAuthenticated: initialAuth = false
}: SaveProfileButtonProps) {
  const { isConnected } = useUnifiedWalletInfo()
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSaveToggle = async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/freelancers/${freelancerId}/save`, {
        method: isSaved ? 'DELETE' : 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to update saved status')
      }

      setIsSaved(!isSaved)
      toast.success(isSaved ? 'Profile unsaved' : 'Profile saved')
    } catch (error) {
      console.error('Error toggling save status:', error)
      toast.error('Failed to update saved status')
    } finally {
      setIsLoading(false)
    }
  }

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

  // Authenticated - show save button
  if (isAuthenticated) {
    return (
      <Button
        variant={isSaved ? 'default' : 'outline'}
        onClick={handleSaveToggle}
        disabled={isLoading}
        className='border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
      >
        <Heart className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        {isSaved ? 'Saved' : 'Save Profile'}
      </Button>
    )
  }

  return null
}
