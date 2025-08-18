'use client'

import { useEffect, useState } from 'react'

import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'

import { AuthRequiredModal } from '@/components/blocks/freelancers/auth-required-modal'
import { Button } from '@/components/ui/button'
import { apiEndpoints } from '@/config/api-endpoints'
import { useUnifiedWalletInfo } from '@/context'
import { swrConfig, swrFetcher } from '@/lib/api/swr'

interface SaveProfileButtonProps {
  freelancerId: string
  isSaved?: boolean
  isAuthenticated?: boolean
}

export function SaveProfileButton({
  freelancerId,
  isSaved: initialSaved = false,
  isAuthenticated: _initialAuth = false // Unused, we'll check auth internally
}: SaveProfileButtonProps) {
  const { isConnected } = useUnifiedWalletInfo()
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSaveToggle = async () => {
    if (!isConnected || !isAuthenticated) {
      setShowAuthModal(true)
      return
    }

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

  return (
    <>
      <Button
        variant={isSaved ? 'default' : 'outline'}
        onClick={handleSaveToggle}
        disabled={isLoading}
        className='border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
      >
        <Heart className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        {isSaved ? 'Saved' : 'Save Profile'}
      </Button>
      <AuthRequiredModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title={
          !isConnected ? 'Sign in to Save Profiles' : 'Sign to Access Dashboard'
        }
        description={
          !isConnected
            ? 'Connect your wallet to save freelancer profiles and get notified about their availability.'
            : 'Sign the message to access your dashboard and save this profile.'
        }
        isConnected={isConnected}
        isAuthenticated={isAuthenticated}
      />
    </>
  )
}
