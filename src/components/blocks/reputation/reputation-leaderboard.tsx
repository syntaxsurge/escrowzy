'use client'

import { useEffect, useState } from 'react'

import { Trophy, Medal, Award, Crown, TrendingUp } from 'lucide-react'

import { UserAvatar } from '@/components/blocks/user-avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiEndpoints } from '@/config/api-endpoints'
import { api } from '@/lib/api/http-client'
import { cn } from '@/lib/utils/cn'

import { ReputationBadge } from './reputation-badge'

interface TopUser {
  id: number
  userId: number
  walletAddress: string
  totalReviews: number
  averageRating: number
  reputationScore: number
  isFreelancer: boolean
  userName: string | null
}

interface ReputationLeaderboardProps {
  limit?: number
  className?: string
}

export function ReputationLeaderboard({
  limit = 10,
  className
}: ReputationLeaderboardProps) {
  const [freelancers, setFreelancers] = useState<TopUser[]>([])
  const [clients, setClients] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'freelancers' | 'clients'>(
    'freelancers'
  )

  useEffect(() => {
    fetchTopUsers()
  }, [limit])

  async function fetchTopUsers() {
    try {
      // Fetch top freelancers
      const freelancerResult = await api.get(
        `${apiEndpoints.reputation}?top=${limit}&isFreelancer=true`,
        { shouldShowErrorToast: false }
      )
      if (freelancerResult.success) {
        setFreelancers(freelancerResult.data.data || freelancerResult.data)
      }

      // Fetch top clients
      const clientResult = await api.get(
        `${apiEndpoints.reputation}?top=${limit}&isFreelancer=false`,
        { shouldShowErrorToast: false }
      )
      if (clientResult.success) {
        setClients(clientResult.data.data || clientResult.data)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  function getRankIcon(rank: number) {
    switch (rank) {
      case 1:
        return <Crown className='h-5 w-5 text-yellow-500' />
      case 2:
        return <Medal className='h-5 w-5 text-gray-400' />
      case 3:
        return <Trophy className='h-5 w-5 text-orange-600' />
      default:
        return (
          <span className='text-muted-foreground text-sm font-bold'>
            #{rank}
          </span>
        )
    }
  }

  function renderLeaderboard(users: TopUser[]) {
    if (loading) {
      return (
        <div className='space-y-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-24' />
              </div>
              <Skeleton className='h-8 w-16' />
            </div>
          ))}
        </div>
      )
    }

    if (users.length === 0) {
      return (
        <div className='text-muted-foreground py-8 text-center'>
          No users found
        </div>
      )
    }

    return (
      <div className='space-y-3'>
        {users.map((user, index) => {
          const rank = index + 1
          const level = getReputationLevel(user.reputationScore)

          return (
            <div
              key={user.id}
              className={cn(
                'flex items-center gap-4 rounded-lg p-3 transition-colors',
                rank <= 3 ? 'bg-muted/50' : 'hover:bg-muted/30'
              )}
            >
              {/* Rank */}
              <div className='flex h-10 w-10 items-center justify-center'>
                {getRankIcon(rank)}
              </div>

              {/* User Info */}
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <UserAvatar
                    user={{ name: user.userName }}
                    walletAddress={user.walletAddress}
                    size='sm'
                  />
                  <div className='min-w-0'>
                    <p className='truncate font-medium'>
                      {user.userName || `User ${user.userId}`}
                    </p>
                    <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                      <span>{user.totalReviews} reviews</span>
                      <span>•</span>
                      <span>⭐ {user.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Badge */}
              <div className='flex items-center gap-2'>
                <ReputationBadge
                  score={user.reputationScore}
                  level={level}
                  size='sm'
                  showScore={false}
                />
                <div className='text-right'>
                  <p className='text-lg font-bold'>{user.reputationScore}</p>
                  <p className='text-muted-foreground text-xs'>points</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <TrendingUp className='text-primary h-5 w-5' />
          <CardTitle>Reputation Leaderboard</CardTitle>
        </div>
        <CardDescription>Top performers on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='freelancers'>
              <Award className='mr-2 h-4 w-4' />
              Freelancers
            </TabsTrigger>
            <TabsTrigger value='clients'>
              <Trophy className='mr-2 h-4 w-4' />
              Clients
            </TabsTrigger>
          </TabsList>
          <TabsContent value='freelancers' className='mt-4'>
            {renderLeaderboard(freelancers)}
          </TabsContent>
          <TabsContent value='clients' className='mt-4'>
            {renderLeaderboard(clients)}
          </TabsContent>
        </Tabs>
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
