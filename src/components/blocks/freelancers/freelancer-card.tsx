'use client'

import { useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import {
  Bookmark,
  BookmarkCheck,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  Briefcase
} from 'lucide-react'

import { UserAvatar } from '@/components/blocks/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiEndpoints } from '@/config/api-endpoints'
import { api } from '@/lib/api/http-client'
import type { FreelancerProfileWithRelations } from '@/lib/db/queries/freelancers'

import { VerifiedBadge } from './verified-badge'

interface FreelancerCardProps {
  freelancer: FreelancerProfileWithRelations
  displayMode?: 'full' | 'compact' | 'minimal'
  showActions?: boolean
  onSave?: (saved: boolean) => void
  onHire?: () => void
  onView?: () => void
  isSaved?: boolean
}

export function FreelancerCard({
  freelancer,
  displayMode = 'full',
  showActions = true,
  onSave,
  onHire,
  onView,
  isSaved: initialSaved = false
}: FreelancerCardProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isSaving, setIsSaving] = useState(false)

  // Map the freelancer user object to match UserAvatar's expected structure
  const userForAvatar = {
    ...freelancer.user,
    avatarPath: freelancer.user.avatarUrl
      ? freelancer.user.avatarUrl.replace('/uploads/', '')
      : null,
    walletAddress: freelancer.user.walletAddress || undefined
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await api.post(
        apiEndpoints.freelancers.save(freelancer.id)
      )
      if (response.success) {
        const newSavedState = (response as any).saved
        setIsSaved(newSavedState)
        onSave?.(newSavedState)
      }
    } catch (error) {
      console.error('Failed to save freelancer:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCardClick = () => {
    if (onView) {
      onView()
    }
  }

  // Calculate display rating (convert from int to decimal)
  const displayRating = freelancer.avgRating / 10

  // Parse languages
  const languages = (freelancer.languages as any) || []
  const primaryLanguages = languages.slice(0, 2)

  // Get top skills
  const topSkills =
    freelancer.skills?.slice(0, displayMode === 'compact' ? 3 : 5) || []

  // Availability status color
  const availabilityConfig = {
    available: {
      label: 'Available',
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    busy: { label: 'Busy', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    away: { label: 'Away', color: 'text-gray-600', bg: 'bg-gray-100' }
  }
  const availability =
    availabilityConfig[
      freelancer.availability as keyof typeof availabilityConfig
    ] || availabilityConfig.away

  if (displayMode === 'minimal') {
    return (
      <Card
        className='cursor-pointer transition-shadow hover:shadow-md'
        onClick={handleCardClick}
      >
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            <UserAvatar
              user={userForAvatar}
              walletAddress={userForAvatar.walletAddress}
              size='md'
            />
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <h4 className='truncate font-medium'>{freelancer.user.name}</h4>
                {freelancer.verificationStatus === 'verified' && (
                  <VerifiedBadge />
                )}
              </div>
              <p className='text-muted-foreground truncate text-sm'>
                {freelancer.professionalTitle}
              </p>
              <div className='text-muted-foreground mt-1 flex items-center gap-4 text-xs'>
                <span className='flex items-center gap-1'>
                  <DollarSign className='h-3 w-3' />${freelancer.hourlyRate}/hr
                </span>
                {freelancer.reviewCount > 0 && (
                  <span className='flex items-center gap-1'>
                    <Star className='h-3 w-3 fill-yellow-500 text-yellow-500' />
                    {displayRating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='transition-shadow hover:shadow-lg'>
      <CardHeader className='pb-4'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-4'>
            <div className='cursor-pointer' onClick={handleCardClick}>
              <UserAvatar
                user={userForAvatar}
                walletAddress={userForAvatar.walletAddress}
                size='xl'
              />
            </div>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <h3
                  className='hover:text-primary cursor-pointer text-lg font-semibold'
                  onClick={handleCardClick}
                >
                  {freelancer.user.name}
                </h3>
                {freelancer.verificationStatus === 'verified' && (
                  <VerifiedBadge />
                )}
              </div>
              <p className='text-muted-foreground text-sm'>
                {freelancer.professionalTitle}
              </p>
              <div className='flex items-center gap-3 text-sm'>
                <Badge
                  variant='outline'
                  className={`${availability.bg} ${availability.color} border-0`}
                >
                  {availability.label}
                </Badge>
                {freelancer.lastActiveAt && (
                  <span className='text-muted-foreground flex items-center gap-1 text-xs'>
                    <Clock className='h-3 w-3' />
                    Active{' '}
                    {formatDistanceToNow(new Date(freelancer.lastActiveAt), {
                      addSuffix: true
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
          {showActions && (
            <Button
              variant='ghost'
              size='icon'
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaved ? (
                <BookmarkCheck className='h-4 w-4' />
              ) : (
                <Bookmark className='h-4 w-4' />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {displayMode === 'full' && freelancer.bio && (
          <p className='text-muted-foreground line-clamp-3 text-sm'>
            {freelancer.bio}
          </p>
        )}

        {/* Skills */}
        {topSkills.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {topSkills.map(skill => (
              <Badge key={skill.id} variant='secondary'>
                {skill.skill.icon && (
                  <span className='mr-1'>{skill.skill.icon}</span>
                )}
                {skill.skill.name}
                {skill.isVerified && (
                  <CheckCircle className='ml-1 h-3 w-3 text-green-600' />
                )}
              </Badge>
            ))}
            {freelancer.skills.length > topSkills.length && (
              <Badge variant='outline'>
                +{freelancer.skills.length - topSkills.length} more
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className='grid grid-cols-2 gap-4 text-sm sm:grid-cols-4'>
          <div>
            <p className='text-muted-foreground'>Hourly Rate</p>
            <p className='font-semibold'>${freelancer.hourlyRate}/hr</p>
          </div>
          <div>
            <p className='text-muted-foreground'>Experience</p>
            <p className='font-semibold'>
              {freelancer.yearsOfExperience} years
            </p>
          </div>
          <div>
            <p className='text-muted-foreground'>Jobs Completed</p>
            <p className='font-semibold'>{freelancer.totalJobs}</p>
          </div>
          <div>
            <p className='text-muted-foreground'>Success Rate</p>
            <p className='font-semibold'>{freelancer.completionRate}%</p>
          </div>
        </div>

        {/* Rating and Reviews */}
        {freelancer.reviewCount > 0 && (
          <div className='flex items-center gap-4 border-t py-2'>
            <div className='flex items-center gap-1'>
              <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
              <span className='font-semibold'>{displayRating.toFixed(1)}</span>
              <span className='text-muted-foreground text-sm'>
                ({freelancer.reviewCount} reviews)
              </span>
            </div>
            {freelancer.totalEarnings &&
              parseFloat(freelancer.totalEarnings) > 0 && (
                <div className='text-muted-foreground flex items-center gap-1 text-sm'>
                  <DollarSign className='h-4 w-4' />
                  <span>
                    ${parseFloat(freelancer.totalEarnings).toLocaleString()}{' '}
                    earned
                  </span>
                </div>
              )}
          </div>
        )}

        {/* Languages */}
        {displayMode === 'full' && primaryLanguages.length > 0 && (
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-muted-foreground'>Languages:</span>
            {primaryLanguages.map((lang: any, index: number) => (
              <Badge key={index} variant='outline'>
                {lang.language}
              </Badge>
            ))}
            {languages.length > 2 && (
              <span className='text-muted-foreground'>
                +{languages.length - 2} more
              </span>
            )}
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className='pt-4'>
          <div className='flex w-full gap-2'>
            <Button
              variant='outline'
              className='flex-1'
              onClick={handleCardClick}
            >
              View Profile
            </Button>
            {onHire && (
              <Button className='flex-1' onClick={onHire}>
                <Briefcase className='mr-2 h-4 w-4' />
                Hire Now
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

export function FreelancerCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-start gap-4'>
          <Skeleton className='h-16 w-16 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-4 w-24' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Skeleton className='h-16 w-full' />
        <div className='flex gap-2'>
          <Skeleton className='h-6 w-20' />
          <Skeleton className='h-6 w-20' />
          <Skeleton className='h-6 w-20' />
        </div>
        <div className='grid grid-cols-4 gap-4'>
          <Skeleton className='h-12' />
          <Skeleton className='h-12' />
          <Skeleton className='h-12' />
          <Skeleton className='h-12' />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className='h-10 w-full' />
      </CardFooter>
    </Card>
  )
}
