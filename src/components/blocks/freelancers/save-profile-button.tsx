'use client'

import { useState } from 'react'

import { Heart } from 'lucide-react'
import { toast } from 'sonner'

import { AuthenticatedActionButton } from '@/components/blocks/freelancers/authenticated-action-button'
import { Button } from '@/components/ui/button'

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
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isLoading, setIsLoading] = useState(false)

  const handleSaveToggle = async () => {
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
    <AuthenticatedActionButton
      variant='outline'
      className='border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
    >
      {isAuthenticated =>
        isAuthenticated ? (
          <Button
            variant={isSaved ? 'default' : 'outline'}
            onClick={handleSaveToggle}
            disabled={isLoading}
            className='border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
          >
            <Heart
              className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`}
            />
            {isSaved ? 'Saved' : 'Save Profile'}
          </Button>
        ) : null
      }
    </AuthenticatedActionButton>
  )
}
