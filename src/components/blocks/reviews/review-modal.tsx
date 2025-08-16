'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import { ClientReviewForm } from './client-review-form'
import { FreelancerReviewForm } from './freelancer-review-form'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'freelancer' | 'client'
  jobId: number
  jobTitle: string
  targetUserId: number
  targetUserName: string
}

export function ReviewModal({
  isOpen,
  onClose,
  type,
  jobId,
  jobTitle,
  targetUserId,
  targetUserName
}: ReviewModalProps) {
  const handleSuccess = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience to help others make informed decisions
          </DialogDescription>
        </DialogHeader>

        {type === 'freelancer' ? (
          <FreelancerReviewForm
            jobId={jobId}
            freelancerId={targetUserId}
            jobTitle={jobTitle}
            freelancerName={targetUserName}
            onSuccess={handleSuccess}
          />
        ) : (
          <ClientReviewForm
            jobId={jobId}
            clientId={targetUserId}
            jobTitle={jobTitle}
            clientName={targetUserName}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
