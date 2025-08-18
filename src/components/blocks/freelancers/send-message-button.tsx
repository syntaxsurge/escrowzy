'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { MessageSquare } from 'lucide-react'

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
  const router = useRouter()

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push(appRoutes.signIn)
      return
    }
  }

  if (!isAuthenticated) {
    return (
      <Button
        variant='outline'
        onClick={handleClick}
        className='border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20'
      >
        <MessageSquare className='mr-2 h-4 w-4' />
        Send Message
      </Button>
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
