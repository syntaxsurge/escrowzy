'use client'

import { useEffect, useState } from 'react'

import { Clock, ChevronRight, Award } from 'lucide-react'
import { toast } from 'sonner'

import { ReviewModal } from '@/components/blocks/reviews/review-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface PendingReview {
  jobId: number
  jobTitle: string
  completedAt: Date
  type: 'freelancer' | 'client'
  targetUserId: number
  targetUserName: string | null
  daysAgo: number
}

export default function PendingReviewsPage() {
  const [prompts, setPrompts] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchPendingReviews()
  }, [])

  const fetchPendingReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reviews/pending')
      const data = await response.json()
      setPrompts(data.prompts)
    } catch (error) {
      console.error('Error fetching pending reviews:', error)
      toast.error('Failed to load pending reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleWriteReview = (prompt: PendingReview) => {
    setSelectedReview(prompt)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedReview(null)
    fetchPendingReviews()
  }

  const getUrgencyBadge = (daysAgo: number) => {
    if (daysAgo <= 3) {
      return <Badge variant='default'>New</Badge>
    } else if (daysAgo <= 7) {
      return <Badge variant='secondary'>Recent</Badge>
    } else if (daysAgo <= 14) {
      return <Badge variant='outline'>Pending</Badge>
    }
    return null
  }

  if (loading) {
    return (
      <div className='container max-w-4xl py-8'>
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold'>Pending Reviews</h1>
            <p className='text-muted-foreground'>
              Review your completed jobs and earn XP rewards
            </p>
          </div>
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className='p-6'>
                  <Skeleton className='h-20 w-full' />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='container max-w-4xl py-8'>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold'>Pending Reviews</h1>
          <p className='text-muted-foreground'>
            Review your completed jobs and earn XP rewards
          </p>
        </div>

        {prompts.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
              <Award className='text-muted-foreground mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>All caught up!</h3>
              <p className='text-muted-foreground'>
                You have no pending reviews at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Review Rewards</CardTitle>
                <CardDescription>
                  Earn 50 XP for each review, plus 25 bonus XP for 5-star
                  reviews!
                </CardDescription>
              </CardHeader>
            </Card>

            <div className='space-y-4'>
              {prompts.map(prompt => (
                <Card key={`${prompt.type}-${prompt.jobId}`}>
                  <CardContent className='p-6'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1 space-y-1'>
                        <div className='flex items-center gap-2'>
                          <h3 className='font-semibold'>{prompt.jobTitle}</h3>
                          {getUrgencyBadge(prompt.daysAgo)}
                        </div>
                        <p className='text-muted-foreground text-sm'>
                          Review{' '}
                          {prompt.type === 'freelancer'
                            ? 'freelancer'
                            : 'client'}
                          : {prompt.targetUserName || 'User'}
                        </p>
                        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                          <Clock className='h-3 w-3' />
                          <span>
                            Completed {prompt.daysAgo} day
                            {prompt.daysAgo !== 1 ? 's' : ''} ago
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleWriteReview(prompt)}
                        size='sm'
                      >
                        Write Review
                        <ChevronRight className='ml-1 h-4 w-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedReview && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          type={selectedReview.type}
          jobId={selectedReview.jobId}
          jobTitle={selectedReview.jobTitle}
          targetUserId={selectedReview.targetUserId}
          targetUserName={selectedReview.targetUserName || 'User'}
        />
      )}
    </div>
  )
}
