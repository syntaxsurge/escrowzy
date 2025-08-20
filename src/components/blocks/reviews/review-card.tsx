import { formatDistanceToNow } from 'date-fns'
import { MessageSquare } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RatingDisplay } from '@/components/ui/rating-display'
import { cn } from '@/lib/utils/cn'

interface ReviewCardProps {
  review: {
    id: number
    rating: number
    reviewText: string | null
    createdAt: Date
    response?: string | null
    respondedAt?: Date | null
    communicationRating?: number | null
    qualityRating?: number | null
    deadlineRating?: number | null
    paymentRating?: number | null
    clarityRating?: number | null
    wouldHireAgain?: boolean
    wouldWorkAgain?: boolean
  }
  reviewer: {
    name: string | null
    walletAddress: string
  } | null
  job: {
    title: string
  } | null
  type: 'freelancer' | 'client'
  showResponse?: boolean
  onRespond?: () => void
  className?: string
}

export function ReviewCard({
  review,
  reviewer,
  job,
  type,
  showResponse = true,
  onRespond,
  className
}: ReviewCardProps) {
  const getInitials = (name: string | null, address: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    }
    return address.slice(0, 2).toUpperCase()
  }

  const detailedRatings =
    type === 'freelancer'
      ? [
          { label: 'Communication', value: review.communicationRating },
          { label: 'Quality', value: review.qualityRating },
          { label: 'Deadlines', value: review.deadlineRating }
        ]
      : [
          { label: 'Payment', value: review.paymentRating },
          { label: 'Communication', value: review.communicationRating },
          { label: 'Clarity', value: review.clarityRating }
        ]

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className='p-6'>
        <div className='space-y-4'>
          <div className='flex items-start justify-between'>
            <div className='flex items-start gap-3'>
              <Avatar className='h-10 w-10'>
                <AvatarFallback>
                  {reviewer
                    ? getInitials(reviewer.name, reviewer.walletAddress)
                    : 'UN'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className='flex items-center gap-2'>
                  <p className='font-medium'>{reviewer?.name || 'Anonymous'}</p>
                  {(type === 'freelancer'
                    ? review.wouldHireAgain
                    : review.wouldWorkAgain) && (
                    <Badge variant='secondary' className='text-xs'>
                      {type === 'freelancer'
                        ? 'Would hire again'
                        : 'Would work again'}
                    </Badge>
                  )}
                </div>
                <p className='text-muted-foreground text-xs'>
                  {job?.title || 'Project'} •{' '}
                  {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
            <RatingDisplay rating={review.rating} size='sm' />
          </div>

          {review.reviewText && (
            <p className='text-sm leading-relaxed'>{review.reviewText}</p>
          )}

          {detailedRatings.some(r => r.value) && (
            <div className='flex flex-wrap gap-4 pt-2'>
              {detailedRatings.map(
                rating =>
                  rating.value && (
                    <div key={rating.label} className='flex items-center gap-1'>
                      <span className='text-muted-foreground text-xs'>
                        {rating.label}:
                      </span>
                      <RatingDisplay
                        rating={rating.value}
                        size='sm'
                        showNumeric={false}
                      />
                    </div>
                  )
              )}
            </div>
          )}

          {review.response && showResponse && (
            <div className='bg-muted/50 mt-4 rounded-lg p-4'>
              <div className='mb-2 flex items-center gap-2'>
                <MessageSquare className='text-muted-foreground h-4 w-4' />
                <p className='text-muted-foreground text-xs font-medium'>
                  Response •{' '}
                  {review.respondedAt &&
                    formatDistanceToNow(review.respondedAt, {
                      addSuffix: true
                    })}
                </p>
              </div>
              <p className='text-sm'>{review.response}</p>
            </div>
          )}

          {!review.response && onRespond && (
            <div className='flex items-center gap-2 pt-2'>
              <Button variant='ghost' size='sm' onClick={onRespond}>
                <MessageSquare className='mr-2 h-4 w-4' />
                Respond
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
