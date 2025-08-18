'use client'

import Link from 'next/link'
import { useState } from 'react'

import { MessageSquare } from 'lucide-react'

import { SignInModal } from '@/components/blocks/auth/sign-in-modal'
import { Button } from '@/components/ui/button'
import { appRoutes } from '@/config/app-routes'

interface SendMessageButtonProps {
  currentUserId?: number
  targetUserId: number
  isAuthenticated: boolean
}

export function SendMessageButton({
  currentUserId,
  targetUserId,
  isAuthenticated
}: SendMessageButtonProps) {
  const [showSignInModal, setShowSignInModal] = useState(false)

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowSignInModal(true)
      return
    }
  }

  if (!isAuthenticated) {
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
        <SignInModal
          open={showSignInModal}
          onOpenChange={setShowSignInModal}
          title='Sign in to Message'
          description='Connect your wallet to send messages to freelancers.'
        />
      </>
    )
  }

  if (!currentUserId) {
    return null
  }

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
