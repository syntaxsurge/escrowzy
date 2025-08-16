'use client'

import { format } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Package,
  TrendingUp,
  Users
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { JobPostingWithRelations } from '@/lib/db/queries/jobs'
import { cn } from '@/lib/utils'

interface WorkspaceOverviewProps {
  job: JobPostingWithRelations
  isClient: boolean
  isFreelancer: boolean
}

export function WorkspaceOverview({
  job,
  isClient,
  isFreelancer
}: WorkspaceOverviewProps) {
  // Calculate project statistics
  const totalMilestones = job.milestones?.length || 0
  const completedMilestones =
    job.milestones?.filter(m => m.status === 'approved').length || 0
  const inProgressMilestones =
    job.milestones?.filter(m => m.status === 'in_progress').length || 0
  const pendingMilestones =
    job.milestones?.filter(m => m.status === 'pending').length || 0

  const totalBudget =
    job.milestones?.reduce((sum, m) => sum + parseFloat(m.amount), 0) || 0
  const paidAmount =
    job.milestones
      ?.filter(m => m.status === 'approved')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0) || 0
  const remainingAmount = totalBudget - paidAmount

  const progress =
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  // Get next milestone
  const nextMilestone = job.milestones?.find(
    m => m.status === 'pending' || m.status === 'in_progress'
  )

  // Calculate days remaining
  const daysRemaining = job.deadline
    ? Math.ceil(
        (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null

  return (
    <div className='space-y-6'>
      {/* Key Metrics */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Progress</CardTitle>
            <TrendingUp className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{Math.round(progress)}%</div>
            <Progress value={progress} className='mt-2' />
            <p className='text-muted-foreground mt-2 text-xs'>
              {completedMilestones} of {totalMilestones} milestones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Budget</CardTitle>
            <DollarSign className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${totalBudget.toFixed(2)}</div>
            <div className='mt-2 space-y-1'>
              <div className='flex justify-between text-xs'>
                <span className='text-green-600'>Paid</span>
                <span>${paidAmount.toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-xs'>
                <span className='text-yellow-600'>Remaining</span>
                <span>${remainingAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Deadline</CardTitle>
            <Calendar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            {job.deadline ? (
              <>
                <div className='text-2xl font-bold'>
                  {format(new Date(job.deadline), 'MMM dd')}
                </div>
                <p
                  className={cn(
                    'mt-2 text-xs',
                    daysRemaining && daysRemaining < 7
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                  )}
                >
                  {daysRemaining && daysRemaining > 0
                    ? `${daysRemaining} days remaining`
                    : daysRemaining === 0
                      ? 'Due today'
                      : 'Overdue'}
                </p>
              </>
            ) : (
              <div className='text-muted-foreground text-sm'>
                No deadline set
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Status</CardTitle>
            <CheckCircle2 className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <Badge
                variant={job.status === 'in_progress' ? 'default' : 'secondary'}
                className='text-xs'
              >
                {job.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <div className='space-y-1 text-xs'>
                <div className='flex justify-between'>
                  <span className='text-green-600'>Completed</span>
                  <span>{completedMilestones}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-blue-600'>In Progress</span>
                  <span>{inProgressMilestones}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Pending</span>
                  <span>{pendingMilestones}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-4 w-4' />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Client */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Avatar>
                  <AvatarImage src={job.client?.avatarPath || undefined} />
                  <AvatarFallback>
                    {job.client?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='text-sm font-medium'>{job.client?.name}</p>
                  <p className='text-muted-foreground text-xs'>Client</p>
                </div>
              </div>
              <Badge variant='outline'>Owner</Badge>
            </div>

            {/* Freelancer */}
            {job.freelancer && (
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Avatar>
                    <AvatarImage
                      src={job.freelancer?.avatarPath || undefined}
                    />
                    <AvatarFallback>
                      {job.freelancer?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='text-sm font-medium'>
                      {job.freelancer?.name}
                    </p>
                    <p className='text-muted-foreground text-xs'>Freelancer</p>
                  </div>
                </div>
                <Badge variant='outline'>Assignee</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Milestone */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='h-4 w-4' />
              Next Milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextMilestone ? (
              <div className='space-y-3'>
                <div>
                  <p className='font-medium'>{nextMilestone.title}</p>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {nextMilestone.description}
                  </p>
                </div>
                <Separator />
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <p className='text-muted-foreground'>Amount</p>
                    <p className='font-medium'>${nextMilestone.amount}</p>
                  </div>
                  <div>
                    <p className='text-muted-foreground'>Due Date</p>
                    <p className='font-medium'>
                      {nextMilestone.dueDate
                        ? format(
                            new Date(nextMilestone.dueDate),
                            'MMM dd, yyyy'
                          )
                        : 'No due date'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className='text-muted-foreground mb-2 text-sm'>Status</p>
                  <Badge
                    variant={
                      nextMilestone.status === 'in_progress'
                        ? 'default'
                        : nextMilestone.status === 'submitted'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {nextMilestone.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <CheckCircle2 className='h-12 w-12 text-green-500' />
                <p className='mt-2 text-sm font-medium'>
                  All milestones completed!
                </p>
                <p className='text-muted-foreground text-xs'>
                  Great job on completing the project
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-4 w-4' />
            Project Summary
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <h4 className='mb-2 font-medium'>Description</h4>
            <p className='text-muted-foreground text-sm'>{job.description}</p>
          </div>

          <Separator />

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <div>
              <p className='text-muted-foreground text-sm'>Category</p>
              <p className='text-sm font-medium'>{job.category?.name}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Budget Type</p>
              <p className='text-sm font-medium capitalize'>{job.budgetType}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Experience Level</p>
              <p className='text-sm font-medium capitalize'>
                {job.experienceLevel}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Project Duration</p>
              <p className='text-sm font-medium'>
                {job.projectDuration || 'Not specified'}
              </p>
            </div>
          </div>

          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <>
              <Separator />
              <div>
                <p className='text-muted-foreground mb-2 text-sm'>
                  Required Skills
                </p>
                <div className='flex flex-wrap gap-2'>
                  {(job.skillsRequired as any[]).map((skill, index) => (
                    <Badge key={index} variant='secondary'>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-4 w-4' />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {job.milestones?.slice(0, 3).map(milestone => (
              <div key={milestone.id} className='flex items-center gap-4'>
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    milestone.status === 'approved' &&
                      'bg-green-100 text-green-600',
                    milestone.status === 'in_progress' &&
                      'bg-blue-100 text-blue-600',
                    milestone.status === 'submitted' &&
                      'bg-yellow-100 text-yellow-600',
                    milestone.status === 'pending' &&
                      'bg-gray-100 text-gray-600'
                  )}
                >
                  {milestone.status === 'approved' && (
                    <CheckCircle2 className='h-4 w-4' />
                  )}
                  {milestone.status === 'in_progress' && (
                    <Clock className='h-4 w-4' />
                  )}
                  {milestone.status === 'submitted' && (
                    <Package className='h-4 w-4' />
                  )}
                  {milestone.status === 'pending' && (
                    <AlertCircle className='h-4 w-4' />
                  )}
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>{milestone.title}</p>
                  <p className='text-muted-foreground text-xs'>
                    {milestone.status.replace('_', ' ')}
                  </p>
                </div>
                <span className='text-sm font-medium'>${milestone.amount}</span>
              </div>
            ))}

            {!job.milestones ||
              (job.milestones.length === 0 && (
                <p className='text-muted-foreground text-sm'>No activity yet</p>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
