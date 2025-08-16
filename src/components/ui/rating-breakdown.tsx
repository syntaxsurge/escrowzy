import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface RatingBreakdownProps {
  ratingBreakdown: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  totalReviews: number
  className?: string
}

export function RatingBreakdown({
  ratingBreakdown,
  totalReviews,
  className
}: RatingBreakdownProps) {
  const ratings = [5, 4, 3, 2, 1] as const

  return (
    <div className={cn('space-y-2', className)}>
      {ratings.map(rating => {
        const count = ratingBreakdown[rating]
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

        return (
          <div key={rating} className='flex items-center gap-2'>
            <span className='w-8 text-sm font-medium'>{rating}★</span>
            <Progress value={percentage} className='h-2 flex-1' />
            <span className='text-muted-foreground w-12 text-right text-xs'>
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
