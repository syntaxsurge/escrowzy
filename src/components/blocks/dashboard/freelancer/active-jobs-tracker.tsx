'use client'

import Link from 'next/link'

import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  MoreVertical,
  Target,
  User,
  Briefcase
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { appRoutes } from '@/config/app-routes'
import { cn } from '@/lib/utils/cn'

interface Job {
  id: number
  title: string
  status: string
  clientName: string
  totalMilestones: number
  completedMilestones: number
  nextMilestone: string | null
  nextMilestoneDate: Date | null
}

interface MilestoneStats {
  total: number
  pending: number
  inProgress: number
  submitted: number
  approved: number
  disputed: number
}

interface ActiveJobsTrackerProps {
  jobs: Job[]
  milestoneStats: MilestoneStats
  detailed?: boolean
}

export function ActiveJobsTracker({
  jobs,
  milestoneStats,
  detailed = false
}: ActiveJobsTrackerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300'
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getDeadlineStatus = (date: Date | null) => {
    if (!date) return null

    const daysUntil = Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntil < 0) return { status: 'overdue', color: 'text-red-600' }
    if (daysUntil <= 3) return { status: 'urgent', color: 'text-orange-600' }
    if (daysUntil <= 7) return { status: 'soon', color: 'text-yellow-600' }
    return { status: 'normal', color: 'text-green-600' }
  }

  const statsCards = [
    {
      label: 'Total',
      value: milestoneStats.total,
      icon: FileText,
      color: 'text-gray-600'
    },
    {
      label: 'In Progress',
      value: milestoneStats.inProgress,
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      label: 'Submitted',
      value: milestoneStats.submitted,
      icon: Target,
      color: 'text-purple-600'
    },
    {
      label: 'Approved',
      value: milestoneStats.approved,
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ]

  if (detailed) {
    return (
      <div className='space-y-4'>
        {/* Milestone Stats */}
        <div className='grid gap-4 md:grid-cols-4'>
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  {stat.label}
                </CardTitle>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stat.value}</div>
                <Progress
                  value={(stat.value / milestoneStats.total) * 100}
                  className='mt-2'
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Jobs ({jobs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {jobs.length > 0 ? (
                jobs.map(job => {
                  const progress =
                    job.totalMilestones > 0
                      ? (job.completedMilestones / job.totalMilestones) * 100
                      : 0
                  const deadlineStatus = getDeadlineStatus(
                    job.nextMilestoneDate
                  )

                  return (
                    <div
                      key={job.id}
                      className='hover:bg-accent/50 rounded-lg border p-4 transition-colors'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='mb-2 flex items-start justify-between'>
                            <div>
                              <Link
                                href={`/trades/jobs/${job.id}/workspace`}
                                className='text-lg font-semibold hover:underline'
                              >
                                {job.title}
                              </Link>
                              <div className='text-muted-foreground mt-1 flex items-center gap-3 text-sm'>
                                <span className='flex items-center gap-1'>
                                  <User className='h-3 w-3' />
                                  {job.clientName}
                                </span>
                                <Badge
                                  variant='outline'
                                  className={cn(getStatusColor(job.status))}
                                >
                                  {job.status}
                                </Badge>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='sm'>
                                  <MoreVertical className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/trades/jobs/${job.id}/workspace`}
                                  >
                                    Open Workspace
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/trades/jobs/${job.id}`}>
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/messages?jobId=${job.id}`}>
                                    <MessageSquare className='mr-2 h-4 w-4' />
                                    Send Message
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Milestone Progress */}
                          <div className='mb-3'>
                            <div className='mb-1 flex items-center justify-between text-sm'>
                              <span className='text-muted-foreground'>
                                Milestones: {job.completedMilestones}/
                                {job.totalMilestones}
                              </span>
                              <span className='font-medium'>
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={progress} className='h-2' />
                          </div>

                          {/* Next Milestone */}
                          {job.nextMilestone && (
                            <div className='bg-accent/50 rounded-md p-3'>
                              <div className='flex items-center justify-between'>
                                <div>
                                  <p className='text-sm font-medium'>
                                    Next: {job.nextMilestone}
                                  </p>
                                  {job.nextMilestoneDate && (
                                    <p
                                      className={cn(
                                        'mt-1 flex items-center gap-1 text-xs',
                                        deadlineStatus?.color
                                      )}
                                    >
                                      <Calendar className='h-3 w-3' />
                                      Due{' '}
                                      {formatDistanceToNow(
                                        new Date(job.nextMilestoneDate),
                                        { addSuffix: true }
                                      )}
                                    </p>
                                  )}
                                </div>
                                {deadlineStatus?.status === 'urgent' && (
                                  <AlertCircle className='h-5 w-5 text-orange-600' />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className='py-12 text-center'>
                  <FileText className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                  <h3 className='mb-2 text-lg font-semibold'>No active jobs</h3>
                  <p className='text-muted-foreground mb-4'>
                    Start browsing available jobs to get started
                  </p>
                  <Button asChild>
                    <Link href={appRoutes.trades.jobs.base}>
                      Browse Jobs
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center justify-between'>
          <span className='flex items-center gap-2'>
            <Briefcase className='h-5 w-5' />
            Active Jobs
          </span>
          {jobs.length > 0 && (
            <Badge variant='outline'>
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {jobs.length > 0 ? (
            <>
              {jobs.slice(0, 3).map(job => {
                const progress =
                  job.totalMilestones > 0
                    ? (job.completedMilestones / job.totalMilestones) * 100
                    : 0

                return (
                  <div
                    key={job.id}
                    className='hover:bg-accent/50 rounded-lg border p-3 transition-colors'
                  >
                    <div className='mb-2 flex items-start justify-between'>
                      <div>
                        <Link
                          href={`/trades/jobs/${job.id}/workspace`}
                          className='font-medium hover:underline'
                        >
                          {job.title}
                        </Link>
                        <p className='text-muted-foreground text-xs'>
                          {job.clientName}
                        </p>
                      </div>
                      <Badge variant='outline' className='text-xs'>
                        {job.completedMilestones}/{job.totalMilestones}
                      </Badge>
                    </div>
                    <Progress value={progress} className='h-1.5' />
                    {job.nextMilestone && (
                      <p className='text-muted-foreground mt-2 text-xs'>
                        Next: {job.nextMilestone}
                      </p>
                    )}
                  </div>
                )
              })}

              {jobs.length > 3 && (
                <Button variant='outline' className='w-full' asChild>
                  <Link href={appRoutes.trades.jobs.base}>
                    View all {jobs.length} jobs
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <div className='py-8 text-center'>
              <FileText className='text-muted-foreground mx-auto mb-3 h-10 w-10' />
              <p className='text-muted-foreground mb-3 text-sm'>
                No active jobs
              </p>
              <Button size='sm' asChild>
                <Link href={appRoutes.trades.jobs.base}>Browse Jobs</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Import Briefcase icon if not available
