'use client'

import { Award, Shield, Star, Trophy, Gem } from 'lucide-react'

import { cn } from '@/lib/utils'

interface ReputationBadgeProps {
  score: number
  level?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
  className?: string
}

export function ReputationBadge({
  score,
  level,
  size = 'md',
  showScore = true,
  className
}: ReputationBadgeProps) {
  // Calculate level from score if not provided
  const reputationLevel = level || getReputationLevel(score)

  const { icon: Icon, color, bgColor, label } = getLevelConfig(reputationLevel)

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base'
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          sizeClasses[size],
          bgColor
        )}
      >
        <Icon className={color} size={iconSizes[size]} />
        {showScore && (
          <div className='bg-background ring-border absolute -right-1 -bottom-1 rounded-full px-1.5 py-0.5 text-xs font-bold shadow-sm ring-1'>
            {score}
          </div>
        )}
      </div>
      <div className='flex flex-col'>
        <span className={cn('font-semibold capitalize', color)}>{label}</span>
        {showScore && (
          <span className='text-muted-foreground text-xs'>
            {score}/100 points
          </span>
        )}
      </div>
    </div>
  )
}

function getReputationLevel(
  score: number
): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
  if (score >= 90) return 'diamond'
  if (score >= 75) return 'platinum'
  if (score >= 60) return 'gold'
  if (score >= 40) return 'silver'
  return 'bronze'
}

function getLevelConfig(level: string) {
  switch (level) {
    case 'diamond':
      return {
        icon: Gem,
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-500/10',
        label: 'Diamond'
      }
    case 'platinum':
      return {
        icon: Trophy,
        color: 'text-violet-500',
        bgColor: 'bg-violet-500/10',
        label: 'Platinum'
      }
    case 'gold':
      return {
        icon: Award,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        label: 'Gold'
      }
    case 'silver':
      return {
        icon: Star,
        color: 'text-gray-400',
        bgColor: 'bg-gray-400/10',
        label: 'Silver'
      }
    default:
      return {
        icon: Shield,
        color: 'text-orange-600',
        bgColor: 'bg-orange-600/10',
        label: 'Bronze'
      }
  }
}
