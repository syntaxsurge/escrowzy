'use client'

import { UnifiedConnectButton } from '@/components/blocks/blockchain/unified-connect-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface SignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

export function SignInModal({
  open,
  onOpenChange,
  title = 'Sign in Required',
  description = 'Please connect your wallet to continue with this action.'
}: SignInModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className='flex justify-center py-4'>
          <UnifiedConnectButton />
        </div>
      </DialogContent>
    </Dialog>
  )
}
