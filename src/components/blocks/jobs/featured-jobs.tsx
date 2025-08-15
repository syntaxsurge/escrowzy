'use client'

import { useEffect, useState } from 'react'

import {
  ChevronLeft,
  ChevronRight,
  Star,
  TrendingUp,
  Sparkles
} from 'lucide-react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiEndpoints } from '@/config/api-endpoints'
import { cn } from '@/lib'
import { api } from '@/lib/api/http-client'
import type { JobPostingWithRelations } from '@/lib/db/queries/jobs'

import { JobListingCard, JobListingCardSkeleton } from './job-listing-card'

interface FeaturedJobsProps {
  className?: string
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function FeaturedJobs({
  className,
  autoPlay = true,
  autoPlayInterval = 5000
}: FeaturedJobsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const { data, isLoading } = useSWR(apiEndpoints.jobs.featured, async () => {
    const response = await api.get(`${apiEndpoints.jobs.featured}?limit=5`)
    return response.success ? (response as any).jobs : []
  })

  const jobs = data || []

  useEffect(() => {
    if (!autoPlay || jobs.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % jobs.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, jobs.length])

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + jobs.length) % jobs.length)
  }

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % jobs.length)
  }

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-yellow-500' />
            Featured Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JobListingCardSkeleton />
        </CardContent>
      </Card>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-yellow-500' />
            Featured Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-muted-foreground py-8 text-center'>
            <Star className='text-muted-foreground/50 mx-auto mb-4 h-12 w-12' />
            <p>No featured jobs available at the moment</p>
            <p className='mt-2 text-sm'>
              Check back later for exciting opportunities!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-yellow-500' />
            Featured Jobs
            <Badge variant='secondary' className='ml-2'>
              <TrendingUp className='mr-1 h-3 w-3' />
              Hot
            </Badge>
          </CardTitle>

          {jobs.length > 1 && (
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='icon'
                onClick={handlePrevious}
                className='h-8 w-8'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleNext}
                className='h-8 w-8'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='relative'>
          <div className='overflow-hidden'>
            <div
              className='flex transition-transform duration-300 ease-in-out'
              style={{
                transform: `translateX(-${currentIndex * 100}%)`
              }}
            >
              {jobs.map((job: JobPostingWithRelations) => (
                <div key={job.id} className='w-full flex-shrink-0'>
                  <JobListingCard
                    job={job}
                    featured={true}
                    showActions={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {jobs.length > 1 && (
          <div className='flex justify-center gap-2'>
            {jobs.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  index === currentIndex
                    ? 'bg-primary w-6'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Mini featured jobs for sidebar
export function FeaturedJobsMini({ className }: { className?: string }) {
  const { data, isLoading } = useSWR(
    `${apiEndpoints.jobs.featured}-mini`,
    async () => {
      const response = await api.get(`${apiEndpoints.jobs.featured}?limit=3`)
      return response.success ? (response as any).jobs : []
    }
  )

  const jobs = data || []

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm'>
            <Star className='h-4 w-4 text-yellow-500' />
            Featured Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {[1, 2, 3].map(i => (
            <JobListingCardSkeleton key={i} compact />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (jobs.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-sm'>
          <Star className='h-4 w-4 text-yellow-500' />
          Featured Jobs
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {jobs.map((job: JobPostingWithRelations) => (
          <JobListingCard
            key={job.id}
            job={job}
            featured={true}
            compact={true}
            showActions={false}
          />
        ))}
      </CardContent>
    </Card>
  )
}
