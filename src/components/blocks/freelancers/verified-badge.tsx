import { CheckCircle, Shield } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface VerifiedBadgeProps {
  type?: 'check' | 'shield'
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export function VerifiedBadge({
  type = 'check',
  size = 'sm',
  showTooltip = true
}: VerifiedBadgeProps) {
  const sizeConfig = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const Icon = type === 'shield' ? Shield : CheckCircle
  const iconClass = `${sizeConfig[size]} text-blue-600`

  const badge = <Icon className={iconClass} />

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='inline-flex items-center'>{badge}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Professional</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
