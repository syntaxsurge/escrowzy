'use client'

import Link from 'next/link'

import { MessageSquare } from 'lucide-react'

import { AuthenticatedActionButton } from '@/components/blocks/freelancers/authenticated-action-button'
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
  isAuthenticated: _initialAuth // Unused, we'll check auth internally
}: SendMessageButtonProps) {
  const getChatUrl = () => {
    if (!currentUserId) return '#'
    return appRoutes.chat.direct(
      `${Math.min(currentUserId, targetUserId)}_${Math.max(currentUserId, targetUserId)}`
    )
  }

  return (
    <AuthenticatedActionButton
      variant='outline'
      className='border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
    >
      {isAuthenticated =>
        isAuthenticated && currentUserId ? (
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
        ) : null
      }
    </AuthenticatedActionButton>
  )
}
