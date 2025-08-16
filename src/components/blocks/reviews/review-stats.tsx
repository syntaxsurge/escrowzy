'use client'

import { useEffect, useState } from 'react'

import { Star, TrendingUp, MessageSquare, Award } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RatingBreakdown } from '@/components/ui/rating-breakdown'
import { RatingDisplay } from '@/components/ui/rating-display'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReviewStats } from '@/lib/schemas/reviews'

interface ReviewStatsProps {
  userId: number
  type: 'freelancer' | 'client'
}

export function ReviewStatsComponent({ userId, type }: ReviewStatsProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [userId, type])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        [type === 'freelancer' ? 'freelancerId' : 'clientId']: userId.toString()
      })

      const response = await fetch(`/api/reviews/${type}?${params}`)
      const data = await response.json()

      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching review stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className='pb-2'>
              <Skeleton className='h-4 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-16' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const detailedRatings =
    type === 'freelancer'
      ? [
          {
            label: 'Communication',
            value: stats.detailedRatings?.communication
          },
          { label: 'Quality', value: stats.detailedRatings?.quality },
          { label: 'Deadlines', value: stats.detailedRatings?.deadline }
        ]
      : [
          { label: 'Payment', value: stats.detailedRatings?.payment },
          {
            label: 'Communication',
            value: stats.detailedRatings?.communication
          },
          { label: 'Clarity', value: stats.detailedRatings?.clarity }
        ]

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Average Rating
            </CardTitle>
            <Star className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.averageRating.toFixed(1)}
            </div>
            <RatingDisplay rating={stats.averageRating} showNumeric={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Reviews</CardTitle>
            <MessageSquare className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalReviews}</div>
            <p className='text-muted-foreground text-xs'>
              {stats.responseRate?.toFixed(0)}% response rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              5-Star Reviews
            </CardTitle>
            <Award className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.ratingBreakdown[5]}</div>
            <p className='text-muted-foreground text-xs'>
              {stats.totalReviews > 0
                ? `${((stats.ratingBreakdown[5] / stats.totalReviews) * 100).toFixed(0)}% of total`
                : '0% of total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Performance</CardTitle>
            <TrendingUp className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.averageRating >= 4.5
                ? 'Excellent'
                : stats.averageRating >= 4.0
                  ? 'Good'
                  : stats.averageRating >= 3.5
                    ? 'Average'
                    : 'Needs Improvement'}
            </div>
            <p className='text-muted-foreground text-xs'>Overall performance</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <RatingBreakdown
              ratingBreakdown={stats.ratingBreakdown}
              totalReviews={stats.totalReviews}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detailed Ratings</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {detailedRatings.map(
              rating =>
                rating.value && (
                  <div
                    key={rating.label}
                    className='flex items-center justify-between'
                  >
                    <span className='text-sm font-medium'>{rating.label}</span>
                    <div className='flex items-center gap-2'>
                      <RatingDisplay rating={rating.value} size='sm' />
                    </div>
                  </div>
                )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
