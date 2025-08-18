'use client'

import { useEffect, useState } from 'react'

import {
  RefreshCw,
  TrendingUp,
  Award,
  Star,
  MessageSquare,
  CheckCircle
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

import { ReputationBadge } from './reputation-badge'

interface ReputationData {
  userId: number
  totalReviews: number
  averageRating: number
  reputationScore: number
  isFreelancer: boolean
  nfts?: Array<{
    id: number
    type: string
    level: string | null
    tokenId: number
    mintedAt: Date
  }>
}

interface ReputationCardProps {
  userId: number
  isFreelancer?: boolean
  showActions?: boolean
  className?: string
}

export function ReputationCard({
  userId,
  isFreelancer = true,
  showActions = false,
  className
}: ReputationCardProps) {
  const { toast } = useToast()
  const [reputation, setReputation] = useState<ReputationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchReputation()
  }, [userId, isFreelancer])

  async function fetchReputation() {
    try {
      const response = await fetch(
        `/api/reputation?userId=${userId}&isFreelancer=${isFreelancer}`
      )

      if (!response.ok) throw new Error('Failed to fetch reputation')

      const data = await response.json()
      setReputation(data.data)
    } catch (error) {
      console.error('Error fetching reputation:', error)
      toast({
        title: 'Error',
        description: 'Failed to load reputation data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const response = await fetch('/api/reputation/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) throw new Error('Failed to sync reputation')

      const data = await response.json()

      // Refresh reputation data
      await fetchReputation()

      toast({
        title: 'Success',
        description: `Reputation synced successfully. ${data.data.nftsMinted.length} NFTs minted, ${data.data.achievementsAwarded.length} achievements awarded.`
      })
    } catch (error) {
      console.error('Error syncing reputation:', error)
      toast({
        title: 'Error',
        description: 'Failed to sync reputation',
        variant: 'destructive'
      })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-48' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </CardContent>
      </Card>
    )
  }

  if (!reputation) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Reputation</CardTitle>
          <CardDescription>No reputation data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const level = getReputationLevel(reputation.reputationScore)
  const nextLevelScore = getNextLevelScore(reputation.reputationScore)
  const progressToNext =
    nextLevelScore > 0
      ? ((reputation.reputationScore % getScorePerLevel()) /
          getScorePerLevel()) *
        100
      : 100

  return (
    <Card className={className}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Reputation Score</CardTitle>
            <CardDescription>
              {isFreelancer ? 'Freelancer' : 'Client'} Reputation
            </CardDescription>
          </div>
          {showActions && (
            <Button
              size='sm'
              variant='outline'
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw
                className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Reputation Badge */}
        <div className='flex justify-center'>
          <ReputationBadge
            score={reputation.reputationScore}
            level={level}
            size='lg'
          />
        </div>

        {/* Progress to next level */}
        {nextLevelScore > 0 && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>
                Progress to next level
              </span>
              <span className='font-medium'>
                {reputation.reputationScore}/{nextLevelScore}
              </span>
            </div>
            <Progress value={progressToNext} className='h-2' />
          </div>
        )}

        {/* Stats */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <div className='text-muted-foreground flex items-center gap-2'>
              <MessageSquare className='h-4 w-4' />
              <span className='text-sm'>Total Reviews</span>
            </div>
            <p className='text-2xl font-bold'>{reputation.totalReviews}</p>
          </div>
          <div className='space-y-1'>
            <div className='text-muted-foreground flex items-center gap-2'>
              <Star className='h-4 w-4' />
              <span className='text-sm'>Average Rating</span>
            </div>
            <p className='text-2xl font-bold'>
              {reputation.averageRating.toFixed(1)}
            </p>
          </div>
        </div>

        {/* NFT Badges */}
        {reputation.nfts && reputation.nfts.length > 0 && (
          <div className='space-y-2'>
            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              <Award className='h-4 w-4' />
              <span>Reputation NFTs</span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {reputation.nfts.map(nft => (
                <Badge key={nft.id} variant='secondary' className='capitalize'>
                  <CheckCircle className='mr-1 h-3 w-3' />
                  {nft.level || nft.type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className='flex items-center justify-between border-t pt-2'>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <TrendingUp className='h-4 w-4' />
            <span>Performance</span>
          </div>
          <Badge
            variant={reputation.reputationScore >= 75 ? 'default' : 'secondary'}
          >
            {reputation.reputationScore >= 90 && 'Top Performer'}
            {reputation.reputationScore >= 75 &&
              reputation.reputationScore < 90 &&
              'High Performer'}
            {reputation.reputationScore >= 60 &&
              reputation.reputationScore < 75 &&
              'Good Standing'}
            {reputation.reputationScore >= 40 &&
              reputation.reputationScore < 60 &&
              'Building Reputation'}
            {reputation.reputationScore < 40 && 'New Member'}
          </Badge>
        </div>
      </CardContent>
    </Card>
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

function getNextLevelScore(currentScore: number): number {
  if (currentScore >= 90) return 0 // Already at max
  if (currentScore >= 75) return 90
  if (currentScore >= 60) return 75
  if (currentScore >= 40) return 60
  return 40
}

function getScorePerLevel(): number {
  return 15 // Score points between levels (except bronze to silver which is 40)
}
