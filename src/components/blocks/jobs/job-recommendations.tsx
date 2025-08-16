'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  Brain,
  Briefcase,
  Calendar,
  DollarSign,
  Filter,
  RefreshCw,
  Target,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { appRoutes } from '@/config/app-routes'
import { api } from '@/lib/api/http-client'
import type { JobMatch } from '@/lib/algorithms/skill-matching'

export function JobRecommendations() {
  const router = useRouter()
  const [minMatchScore, setMinMatchScore] = useState('60')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    data: recommendations = [],
    isLoading,
    mutate
  } = useSWR<JobMatch[]>(
    `/api/jobs/recommendations?minMatchScore=${minMatchScore}`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.recommendations : []
    }
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setIsRefreshing(false)
    toast.success('Recommendations refreshed')
  }

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getMatchBadgeVariant = (score: number) => {
    if (score >= 90) return 'success'
    if (score >= 75) return 'default'
    if (score >= 60) return 'secondary'
    return 'outline'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Jobs</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className='h-32 w-full' />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Brain className='h-5 w-5' />
              Recommended Jobs
            </CardTitle>
            <p className='text-muted-foreground text-sm'>
              Jobs matching your skills and experience
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Select value={minMatchScore} onValueChange={setMinMatchScore}>
              <SelectTrigger className='w-[140px]'>
                <Filter className='mr-2 h-4 w-4' />
                <SelectValue placeholder='Min match' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='50'>50%+ Match</SelectItem>
                <SelectItem value='60'>60%+ Match</SelectItem>
                <SelectItem value='70'>70%+ Match</SelectItem>
                <SelectItem value='80'>80%+ Match</SelectItem>
                <SelectItem value='90'>90%+ Match</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size='sm'
              variant='outline'
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className='text-center py-8'>
            <Target className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h3 className='text-lg font-semibold mb-2'>No Recommendations</h3>
            <p className='text-muted-foreground text-sm mb-4'>
              Add more skills to your profile to get better job matches
            </p>
            <Button
              variant='outline'
              onClick={() => router.push('/profile/freelancer')}
            >
              Update Profile
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            {recommendations.map((recommendation) => (
              <Card
                key={recommendation.job.id}
                className='hover:shadow-md transition-shadow cursor-pointer'
                onClick={() =>
                  router.push(`${appRoutes.trades.jobs.base}/${recommendation.job.id}`)
                }
              >
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-lg mb-1'>
                        {recommendation.job.title}
                      </h3>
                      <p className='text-muted-foreground text-sm line-clamp-2'>
                        {recommendation.job.description}
                      </p>
                    </div>
                    <div className='text-right ml-4'>
                      <div
                        className={`text-2xl font-bold ${getMatchColor(
                          recommendation.matchScore
                        )}`}
                      >
                        {recommendation.matchScore}%
                      </div>
                      <Badge
                        variant={getMatchBadgeVariant(recommendation.matchScore) as any}
                        className='mt-1'
                      >
                        Match Score
                      </Badge>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Progress value={recommendation.matchPercentage} className='h-2' />
                    
                    <div className='flex flex-wrap gap-2'>
                      <div className='flex items-center gap-1 text-sm'>
                        <Target className='h-3 w-3' />
                        <span className='text-muted-foreground'>
                          {recommendation.matchedSkills.length} matched skills
                        </span>
                      </div>
                      {recommendation.job.budgetMax && (
                        <div className='flex items-center gap-1 text-sm'>
                          <DollarSign className='h-3 w-3' />
                          <span className='text-muted-foreground'>
                            ${recommendation.job.budgetMin || '0'} - $
                            {recommendation.job.budgetMax}
                          </span>
                        </div>
                      )}
                      {recommendation.job.deadline && (
                        <div className='flex items-center gap-1 text-sm'>
                          <Calendar className='h-3 w-3' />
                          <span className='text-muted-foreground'>
                            Due{' '}
                            {formatDistanceToNow(
                              new Date(recommendation.job.deadline),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Matched Skills */}
                    <div className='flex flex-wrap gap-1'>
                      {recommendation.matchedSkills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant='success' className='text-xs'>
                          ✓ {skill}
                        </Badge>
                      ))}
                      {recommendation.matchedSkills.length > 3 && (
                        <Badge variant='secondary' className='text-xs'>
                          +{recommendation.matchedSkills.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {/* Missing Skills */}
                    {recommendation.missingSkills.length > 0 && (
                      <div className='flex flex-wrap gap-1'>
                        {recommendation.missingSkills.slice(0, 2).map((skill) => (
                          <Badge key={skill} variant='outline' className='text-xs'>
                            {skill}
                          </Badge>
                        ))}
                        {recommendation.missingSkills.length > 2 && (
                          <Badge variant='outline' className='text-xs'>
                            +{recommendation.missingSkills.length - 2} missing
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className='flex items-center justify-between mt-4'>
                    <span className='text-muted-foreground text-xs'>
                      Posted{' '}
                      {formatDistanceToNow(new Date(recommendation.job.createdAt), {
                        addSuffix: true
                      })}
                    </span>
                    <Button size='sm' variant='ghost'>
                      View Details
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className='text-center pt-4'>
              <Button
                variant='outline'
                onClick={() => router.push(appRoutes.trades.jobs.base)}
              >
                <Briefcase className='mr-2 h-4 w-4' />
                Browse All Jobs
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}