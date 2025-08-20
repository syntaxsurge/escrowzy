'use client'

import { useState, useEffect } from 'react'

import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { apiEndpoints } from '@/config/api-endpoints'
import { api } from '@/lib/api/http-client'

import { ReviewCard } from './review-card'

interface ReviewListProps {
  userId: number
  type: 'freelancer' | 'client'
  showFilters?: boolean
}

export function ReviewList({
  userId,
  type,
  showFilters = true
}: ReviewListProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt' | 'rating'>('createdAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [userId, type, page, sortBy, order])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        [type === 'freelancer' ? 'freelancerId' : 'clientId']:
          userId.toString(),
        page: page.toString(),
        limit: '10',
        sortBy,
        order
      })

      const response = await api.get(`${apiEndpoints.reviews[type]}?${params}`)

      if (page === 1) {
        setReviews(response?.reviews || [])
      } else {
        setReviews(prev => [...prev, ...(response?.reviews || [])])
      }

      setStats(response?.stats || null)
      setHasMore((response?.reviews || []).length === 10)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy as 'createdAt' | 'rating')
    setPage(1)
  }

  const handleOrderChange = () => {
    setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    setPage(1)
  }

  const loadMore = () => {
    setPage(prev => prev + 1)
  }

  if (loading && page === 1) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    )
  }

  if (!loading && reviews.length === 0) {
    return (
      <div className='py-8 text-center'>
        <p className='text-muted-foreground'>No reviews yet</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {showFilters && (
        <div className='flex items-center justify-between'>
          <p className='text-muted-foreground text-sm'>
            {stats?.totalReviews || 0} reviews
          </p>
          <div className='flex items-center gap-2'>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='createdAt'>Most Recent</SelectItem>
                <SelectItem value='rating'>Rating</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='outline' size='sm' onClick={handleOrderChange}>
              {order === 'desc' ? '↓' : '↑'}
            </Button>
          </div>
        </div>
      )}

      <div className='space-y-4'>
        {reviews.map(review => (
          <ReviewCard
            key={review.id}
            review={review}
            reviewer={review.reviewer}
            job={review.job}
            type={type}
          />
        ))}
      </div>

      {hasMore && (
        <div className='pt-4 text-center'>
          <Button variant='outline' onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
