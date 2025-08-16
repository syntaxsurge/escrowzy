'use client'

import { useState } from 'react'

import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Lightbulb,
  Loader2,
  Rocket,
  Target,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { api } from '@/lib/api/http-client'
import { cn } from '@/lib/utils'

interface GrowthRecommendationsProps {
  freelancerId: number
}

interface Recommendation {
  id: string
  type:
    | 'skill'
    | 'profile'
    | 'pricing'
    | 'availability'
    | 'portfolio'
    | 'certification'
    | 'networking'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  actionItems: string[]
  estimatedTimeToComplete?: string
  potentialEarningsIncrease?: number
}

interface Insights {
  profileCompleteness: number
  proposalSuccess: number
  clientSatisfaction: number
  skillDemand: number
  overallGrowthPotential: number
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'skill':
      return <Zap className='h-4 w-4' />
    case 'profile':
      return <Users className='h-4 w-4' />
    case 'pricing':
      return <DollarSign className='h-4 w-4' />
    case 'availability':
      return <Clock className='h-4 w-4' />
    case 'portfolio':
      return <Briefcase className='h-4 w-4' />
    case 'certification':
      return <Award className='h-4 w-4' />
    case 'networking':
      return <Users className='h-4 w-4' />
    default:
      return <Target className='h-4 w-4' />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 dark:bg-red-950/20'
    case 'medium':
      return 'text-amber-600 bg-amber-50 dark:bg-amber-950/20'
    case 'low':
      return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
    default:
      return ''
  }
}

export function GrowthRecommendations({
  freelancerId
}: GrowthRecommendationsProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
  const [selectedPriority, setSelectedPriority] = useState<
    'all' | 'high' | 'medium' | 'low'
  >('all')

  const { data, isLoading } = useSWR(
    `/api/freelancers/${freelancerId}/recommendations`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.data : null
    }
  )

  const recommendations: Recommendation[] = data?.recommendations || []
  const growthScore = data?.growthScore || 0
  const insights: Insights = data?.insights || {}
  const summary = data?.summary || {}

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const toggleCompleted = (id: string) => {
    const newCompleted = new Set(completedItems)
    if (newCompleted.has(id)) {
      newCompleted.delete(id)
    } else {
      newCompleted.add(id)
    }
    setCompletedItems(newCompleted)
  }

  const filteredRecommendations = recommendations.filter(
    rec => selectedPriority === 'all' || rec.priority === selectedPriority
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex min-h-[400px] items-center justify-center'>
          <div className='text-center'>
            <Loader2 className='text-primary mx-auto mb-4 h-8 w-8 animate-spin' />
            <p className='text-muted-foreground'>
              Analyzing your growth opportunities...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Growth Score Card */}
      <Card className='overflow-hidden'>
        <div className='bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 p-6 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='mb-2 text-2xl font-bold'>Your Growth Score</h2>
              <p className='text-muted-foreground mb-4'>
                Based on profile analysis and market trends
              </p>
              <div className='flex items-center gap-4'>
                <div className='text-4xl font-bold'>{growthScore}%</div>
                <Badge
                  variant='outline'
                  className={cn(
                    'border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300'
                  )}
                >
                  <TrendingUp className='mr-1 h-3 w-3' />+
                  {summary.potentialEarningsIncrease || 0}% potential growth
                </Badge>
              </div>
            </div>
            <Rocket className='text-muted-foreground h-16 w-16 opacity-20' />
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Profile Strength</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <Progress
                value={insights.profileCompleteness}
                className='flex-1'
              />
              <span className='text-sm font-medium'>
                {Math.round(insights.profileCompleteness)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Proposal Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <Progress value={insights.proposalSuccess} className='flex-1' />
              <span className='text-sm font-medium'>
                {insights.proposalSuccess?.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Client Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <Progress
                value={insights.clientSatisfaction}
                className='flex-1'
              />
              <span className='text-sm font-medium'>
                {Math.round(insights.clientSatisfaction)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>Skill Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <Progress value={insights.skillDemand} className='flex-1' />
              <span className='text-sm font-medium'>
                {Math.round(insights.skillDemand)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations List */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span className='flex items-center gap-2'>
              <Lightbulb className='h-5 w-5' />
              Growth Recommendations
            </span>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-xs'>
                {summary.highPriority} High
              </Badge>
              <Badge variant='outline' className='text-xs'>
                {summary.mediumPriority} Medium
              </Badge>
              <Badge variant='outline' className='text-xs'>
                {summary.lowPriority} Low
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Priority Filter */}
          <div className='mb-4 flex gap-2'>
            <Button
              variant={selectedPriority === 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedPriority('all')}
            >
              All ({recommendations.length})
            </Button>
            <Button
              variant={selectedPriority === 'high' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedPriority('high')}
            >
              <AlertCircle className='mr-1 h-3 w-3' />
              High Priority
            </Button>
            <Button
              variant={selectedPriority === 'medium' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedPriority('medium')}
            >
              Medium Priority
            </Button>
            <Button
              variant={selectedPriority === 'low' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedPriority('low')}
            >
              Low Priority
            </Button>
          </div>

          {/* Recommendations */}
          <div className='space-y-3'>
            {filteredRecommendations.length > 0 ? (
              filteredRecommendations.map(recommendation => {
                const isExpanded = expandedItems.has(recommendation.id)
                const isCompleted = completedItems.has(recommendation.id)

                return (
                  <div
                    key={recommendation.id}
                    className={cn(
                      'rounded-lg border transition-all',
                      isCompleted && 'opacity-60'
                    )}
                  >
                    <div
                      className='cursor-pointer p-4'
                      onClick={() => toggleExpanded(recommendation.id)}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex items-start gap-3'>
                          <div
                            className={cn(
                              'rounded-lg p-2',
                              getPriorityColor(recommendation.priority)
                            )}
                          >
                            {getTypeIcon(recommendation.type)}
                          </div>
                          <div className='flex-1'>
                            <h4
                              className={cn(
                                'font-medium',
                                isCompleted && 'line-through'
                              )}
                            >
                              {recommendation.title}
                            </h4>
                            <p className='text-muted-foreground mt-1 text-sm'>
                              {recommendation.description}
                            </p>
                            <div className='mt-2 flex flex-wrap items-center gap-2'>
                              <Badge variant='outline' className='text-xs'>
                                {recommendation.priority} priority
                              </Badge>
                              {recommendation.estimatedTimeToComplete && (
                                <Badge variant='outline' className='text-xs'>
                                  <Clock className='mr-1 h-3 w-3' />
                                  {recommendation.estimatedTimeToComplete}
                                </Badge>
                              )}
                              {recommendation.potentialEarningsIncrease && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant='outline'
                                        className='cursor-help border-green-500/50 bg-green-50 text-xs text-green-700 dark:bg-green-950/20 dark:text-green-300'
                                      >
                                        <TrendingUp className='mr-1 h-3 w-3' />+
                                        {
                                          recommendation.potentialEarningsIncrease
                                        }
                                        % earnings
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Potential earnings increase</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={e => {
                              e.stopPropagation()
                              toggleCompleted(recommendation.id)
                            }}
                          >
                            {isCompleted ? (
                              <CheckCircle className='h-4 w-4 text-green-600' />
                            ) : (
                              <div className='h-4 w-4 rounded-full border-2' />
                            )}
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className='text-muted-foreground h-4 w-4' />
                          ) : (
                            <ChevronDown className='text-muted-foreground h-4 w-4' />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className='border-t px-4 py-3'>
                        <div className='mb-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20'>
                          <p className='flex items-start gap-2 text-sm'>
                            <BookOpen className='mt-0.5 h-4 w-4 text-blue-600' />
                            <span className='font-medium text-blue-900 dark:text-blue-300'>
                              Impact: {recommendation.impact}
                            </span>
                          </p>
                        </div>

                        <div className='space-y-2'>
                          <p className='text-sm font-medium'>Action Items:</p>
                          <ul className='space-y-1'>
                            {recommendation.actionItems.map((item, index) => (
                              <li
                                key={index}
                                className='text-muted-foreground flex items-start gap-2 text-sm'
                              >
                                <ArrowRight className='mt-0.5 h-3 w-3 flex-shrink-0' />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className='mt-4 flex justify-end'>
                          <Button
                            size='sm'
                            onClick={e => {
                              e.stopPropagation()
                              toggleCompleted(recommendation.id)
                            }}
                          >
                            {isCompleted
                              ? 'Mark as Incomplete'
                              : 'Mark as Complete'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className='py-12 text-center'>
                <Award className='text-muted-foreground mx-auto mb-3 h-10 w-10' />
                <p className='text-muted-foreground mb-1 text-sm'>
                  No recommendations in this category
                </p>
                <p className='text-muted-foreground text-xs'>
                  You're doing great! Keep up the good work.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
