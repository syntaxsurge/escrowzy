'use client'

import { Plus, Target, Trophy } from 'lucide-react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api/http-client'
import { cn } from '@/lib/utils'

import { GoalDialog } from './goal-dialog'

interface GoalTrackerProps {
  freelancerId: number
}

interface Goal {
  id: string
  title: string
  description?: string
  type: 'earnings' | 'projects' | 'skills' | 'reviews' | 'custom'
  target: number
  current: number
  deadline: Date
  status: 'active' | 'completed' | 'failed'
}

export function GoalTracker({ freelancerId }: GoalTrackerProps) {
  const { data: goalsData, mutate } = useSWR(
    `/api/freelancers/${freelancerId}/goals`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.data : { goals: [], stats: {} }
    }
  )

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'earnings':
        return '💰'
      case 'projects':
        return '📁'
      case 'skills':
        return '🎯'
      case 'reviews':
        return '⭐'
      default:
        return '🎯'
    }
  }

  const goals: Goal[] = goalsData?.goals || []
  const stats = goalsData?.stats || {}

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span className='flex items-center gap-2'>
              <Target className='h-5 w-5' />
              Goals & Achievements
            </span>
            <GoalDialog
              freelancerId={freelancerId}
              onSuccess={mutate}
              trigger={
                <Button size='sm'>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Goal
                </Button>
              }
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='mb-4 grid grid-cols-4 gap-4'>
            <div className='text-center'>
              <p className='text-2xl font-bold'>{stats.total || 0}</p>
              <p className='text-muted-foreground text-xs'>Total</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-blue-600'>
                {stats.active || 0}
              </p>
              <p className='text-muted-foreground text-xs'>Active</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-green-600'>
                {stats.completed || 0}
              </p>
              <p className='text-muted-foreground text-xs'>Completed</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold'>{stats.completionRate || 0}%</p>
              <p className='text-muted-foreground text-xs'>Success Rate</p>
            </div>
          </div>

          <div className='space-y-3'>
            {goals.length > 0 ? (
              goals.map(goal => {
                const progress = (goal.current / goal.target) * 100
                const daysLeft = Math.ceil(
                  (new Date(goal.deadline).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )

                return (
                  <div key={goal.id} className='rounded-lg border p-4'>
                    <div className='mb-2 flex items-start justify-between'>
                      <div>
                        <p className='font-medium'>
                          {getGoalIcon(goal.type)} {goal.title}
                        </p>
                        {goal.description && (
                          <p className='text-muted-foreground text-xs'>
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant='outline'
                        className={cn(
                          goal.status === 'completed' && 'text-green-600',
                          goal.status === 'failed' && 'text-red-600',
                          goal.status === 'active' && 'text-blue-600'
                        )}
                      >
                        {goal.status}
                      </Badge>
                    </div>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <span>
                          {goal.current} / {goal.target}
                        </span>
                        <span className='text-muted-foreground'>
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                        </span>
                      </div>
                      <Progress value={Math.min(progress, 100)} />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className='py-8 text-center'>
                <Trophy className='text-muted-foreground mx-auto mb-3 h-10 w-10' />
                <p className='text-muted-foreground mb-3 text-sm'>
                  No goals set yet
                </p>
                <GoalDialog
                  freelancerId={freelancerId}
                  onSuccess={mutate}
                  trigger={<Button size='sm'>Create Your First Goal</Button>}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
