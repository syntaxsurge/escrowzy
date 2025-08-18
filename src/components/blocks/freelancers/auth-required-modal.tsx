'use client'

import { SignMessageButton } from '@/components/blocks/blockchain/sign-message-button'
import { UnifiedConnectButton } from '@/components/blocks/blockchain/unified-connect-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface AuthRequiredModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  isConnected: boolean
  isAuthenticated: boolean
}

export function AuthRequiredModal({
  open,
  onOpenChange,
  title = 'Authentication Required',
  description,
  isConnected,
  isAuthenticated
}: AuthRequiredModalProps) {
  const getContent = () => {
    if (!isConnected) {
      return {
        title: title || 'Connect Wallet Required',
        description:
          description ||
          'Please connect your wallet to continue with this action.',
        button: <UnifiedConnectButton />
      }
    }

    if (!isAuthenticated) {
      return {
        title: title || 'Sign In to Dashboard Required',
        description:
          description ||
          'Please sign the message to access your dashboard and continue with this action.',
        button: (
          <SignMessageButton
            variant='default'
            className='w-full'
            size='default'
          >
            Sign to Access Dashboard
          </SignMessageButton>
        )
      }
    }

    // Should not reach here if properly used
    return null
  }

  const content = getContent()

  if (!content) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <div className='flex justify-center py-4'>{content.button}</div>
      </DialogContent>
    </Dialog>
  )
}
