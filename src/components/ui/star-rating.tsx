'use client'

import { useState } from 'react'

import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

interface StarRatingProps {
  value?: number
  onChange?: (value: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
  showValue?: boolean
  className?: string
}

export function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = 'md',
  readonly = false,
  showValue = false,
  className
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    setHoverValue(null)
  }

  const displayValue = hoverValue !== null ? hoverValue : value

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className='flex'>
        {Array.from({ length: max }, (_, i) => {
          const rating = i + 1
          const filled = rating <= displayValue
          const halfFilled = rating - 0.5 === displayValue

          return (
            <button
              key={i}
              type='button'
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={cn(
                'relative transition-colors',
                readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                )}
              />
              {halfFilled && (
                <Star
                  className={cn(
                    sizeClasses[size],
                    'absolute inset-0 fill-yellow-400 text-yellow-400',
                    'clip-path-[polygon(0_0,50%_0,50%_100%,0_100%)]'
                  )}
                />
              )}
            </button>
          )
        })}
      </div>
      {showValue && (
        <span className='text-muted-foreground ml-2 text-sm'>
          {displayValue.toFixed(1)} / {max}
        </span>
      )}
    </div>
  )
}
