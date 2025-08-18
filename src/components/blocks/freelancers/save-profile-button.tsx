'use client'

import { useState } from 'react'

import { Heart } from 'lucide-react'
import { toast } from 'sonner'

import { UnifiedConnectButton } from '@/components/blocks/blockchain/unified-connect-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface SaveProfileButtonProps {
  freelancerId: string
  isSaved?: boolean
  isAuthenticated?: boolean
}

export function SaveProfileButton({
  freelancerId,
  isSaved: initialSaved = false,
  isAuthenticated = false
}: SaveProfileButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isLoading, setIsLoading] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      setShowConnectModal(true)
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

      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Sign in to Save Profiles</DialogTitle>
            <DialogDescription>
              Connect your wallet to save freelancer profiles and get notified
              about their availability.
            </DialogDescription>
          </DialogHeader>
          <div className='flex justify-center py-4'>
            <UnifiedConnectButton />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
