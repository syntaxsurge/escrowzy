import { Star } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

interface RatingDisplayProps {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showNumeric?: boolean
  totalReviews?: number
  className?: string
}

export function RatingDisplay({
  rating,
  max = 5,
  size = 'md',
  showNumeric = true,
  totalReviews,
  className
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = max - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className='flex'>
        {Array.from({ length: fullStars }, (_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')}
          />
        ))}
        {hasHalfStar && (
          <div className='relative'>
            <Star className={cn(sizeClasses[size], 'text-gray-300')} />
            <Star
              className={cn(
                sizeClasses[size],
                'absolute inset-0 fill-yellow-400 text-yellow-400',
                'clip-path-[polygon(0_0,50%_0,50%_100%,0_100%)]'
              )}
            />
          </div>
        )}
        {Array.from({ length: emptyStars }, (_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size], 'text-gray-300')}
          />
        ))}
      </div>
      {showNumeric && (
        <span
          className={cn('text-muted-foreground ml-1', textSizeClasses[size])}
        >
          {rating.toFixed(1)}
          {totalReviews !== undefined && (
            <span className='ml-1'>({totalReviews})</span>
          )}
        </span>
      )}
    </div>
  )
}
