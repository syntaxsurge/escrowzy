'use client'

import { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib'

interface GamifiedCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'gradient' | 'neon'
  hover?: boolean
}

export function GamifiedCard({
  children,
  className,
  variant = 'default',
  hover = true
}: GamifiedCardProps) {
  const variantClasses = {
    default:
      'from-background via-muted/50 to-primary/5 dark:to-primary/10 bg-gradient-to-br border-2 border-border/50 backdrop-blur-sm',
    gradient:
      'from-primary/20 via-purple-600/20 to-pink-600/20 bg-gradient-to-br border-2 border-primary/30 backdrop-blur-sm',
    neon: 'from-background to-background bg-gradient-to-br border-2 border-primary/50 shadow-xl shadow-primary/20'
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-500',
        hover && 'hover:scale-[1.02] hover:shadow-2xl',
        variantClasses[variant],
        className
      )}
    >
      {variant === 'gradient' && (
        <div className='bg-grid-white/5 dark:bg-grid-white/10 absolute inset-0' />
      )}
      <div className='relative z-10'>{children}</div>
    </Card>
  )
}
