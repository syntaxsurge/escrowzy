'use client'

import { useState } from 'react'

import { Shield, Star, CheckCircle } from 'lucide-react'

import { UserAvatar } from '@/components/blocks/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import type { EndorsementWithDetails } from '@/lib/db/queries/skill-endorsements'

interface SkillEndorsementCardProps {
  endorsement: EndorsementWithDetails
  showActions?: boolean
  onDelete?: (id: number) => void
}

export function SkillEndorsementCard({
  endorsement,
  showActions = false,
  onDelete
}: SkillEndorsementCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(endorsement.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-gray-200 text-gray-200'
        }`}
      />
    ))
  }

  return (
    <Card className='transition-shadow hover:shadow-lg'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <UserAvatar
              user={{
                name: endorsement.endorser.name || 'Anonymous',
                avatarPath: endorsement.endorser.avatarPath
              }}
              size='md'
            />
            <div>
              <p className='text-sm font-medium'>
                {endorsement.endorser.name || 'Anonymous'}
              </p>
              <p className='text-muted-foreground text-xs'>
                {endorsement.relationship || 'Professional'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {endorsement.verified && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant='secondary' className='gap-1'>
                      <CheckCircle className='h-3 w-3' />
                      Verified
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This endorsement is verified through completed work</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div>
          <div className='mb-1 flex items-center justify-between'>
            <p className='text-sm font-medium'>{endorsement.skill.name}</p>
            <div className='flex items-center'>
              {renderStars(endorsement.rating)}
            </div>
          </div>
        </div>

        {endorsement.projectContext && (
          <div className='bg-muted/50 rounded-md p-3'>
            <p className='text-muted-foreground text-sm'>
              {endorsement.projectContext}
            </p>
          </div>
        )}

        {endorsement.job && (
          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
            <Shield className='h-3 w-3' />
            <span>Worked together on: {endorsement.job.title}</span>
          </div>
        )}

        <div className='flex items-center justify-between pt-2'>
          <p className='text-muted-foreground text-xs'>
            {new Date(endorsement.createdAt).toLocaleDateString()}
          </p>
          {showActions && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
