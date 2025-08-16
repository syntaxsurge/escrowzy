'use client'

import { useState } from 'react'

import { format } from 'date-fns'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Upload
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
import { cn } from '@/lib/utils'

interface Milestone {
  id: number
  title: string
  description: string
  amount: string
  dueDate: Date
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'disputed'
  submissionUrl?: string
  feedback?: string
  submittedAt?: Date
  approvedAt?: Date
  order: number
  revisionCount?: number
}

interface MilestoneTrackerProps {
  milestones: Milestone[]
  jobId: number
  isClient: boolean
  isFreelancer: boolean
  onSubmit?: (milestoneId: number) => void
  onApprove?: (milestoneId: number) => void
  onRequestRevision?: (milestoneId: number) => void
  onStartWork?: (milestoneId: number) => void
  onOpenChat?: (milestoneId: number) => void
}

export function MilestoneTracker({
  milestones,
  jobId,
  isClient,
  isFreelancer,
  onSubmit,
  onApprove,
  onRequestRevision,
  onStartWork,
  onOpenChat
}: MilestoneTrackerProps) {
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(
    null
  )

  const completedCount = milestones.filter(m => m.status === 'approved').length
  const totalAmount = milestones.reduce(
    (sum, m) => sum + parseFloat(m.amount),
    0
  )
  const completedAmount = milestones
    .filter(m => m.status === 'approved')
    .reduce((sum, m) => sum + parseFloat(m.amount), 0)
  const progressPercentage = (completedCount / milestones.length) * 100

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500 bg-gray-50'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50'
      case 'submitted':
        return 'text-yellow-600 bg-yellow-50'
      case 'approved':
        return 'text-green-600 bg-green-50'
      case 'disputed':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-500 bg-gray-50'
    }
  }

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className='h-4 w-4' />
      case 'in_progress':
        return <Clock className='h-4 w-4 animate-pulse' />
      case 'submitted':
        return <FileText className='h-4 w-4' />
      case 'approved':
        return <CheckCircle2 className='h-4 w-4' />
      case 'disputed':
        return <AlertCircle className='h-4 w-4' />
      default:
        return <Clock className='h-4 w-4' />
    }
  }

  const getStatusLabel = (status: Milestone['status']) => {
    switch (status) {
      case 'pending':
        return 'Not Started'
      case 'in_progress':
        return 'In Progress'
      case 'submitted':
        return 'Under Review'
      case 'approved':
        return 'Completed'
      case 'disputed':
        return 'Disputed'
      default:
        return status
    }
  }

  const canStartWork = (milestone: Milestone) => {
    // Can start if it's pending and either it's the first milestone or previous is approved
    if (milestone.status !== 'pending') return false
    if (milestone.order === 1) return true

    const previousMilestone = milestones.find(
      m => m.order === milestone.order - 1
    )
    return previousMilestone?.status === 'approved'
  }

  return (
    <div className='space-y-6'>
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>
            {completedCount} of {milestones.length} milestones completed
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Progress value={progressPercentage} className='h-2' />

          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-muted-foreground'>Completed Value</p>
              <p className='text-lg font-semibold'>
                {completedAmount.toFixed(3)} ETH
              </p>
            </div>
            <div>
              <p className='text-muted-foreground'>Total Value</p>
              <p className='text-lg font-semibold'>
                {totalAmount.toFixed(3)} ETH
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestone List */}
      <div className='space-y-4'>
        {milestones.map((milestone, index) => (
          <Card
            key={milestone.id}
            className={cn(
              'transition-all',
              expandedMilestone === milestone.id && 'ring-primary ring-2'
            )}
          >
            <CardHeader
              className='cursor-pointer'
              onClick={() =>
                setExpandedMilestone(
                  expandedMilestone === milestone.id ? null : milestone.id
                )
              }
            >
              <div className='flex items-start justify-between'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground text-sm font-medium'>
                      Milestone {index + 1}
                    </span>
                    <Badge className={getStatusColor(milestone.status)}>
                      <span className='flex items-center gap-1'>
                        {getStatusIcon(milestone.status)}
                        {getStatusLabel(milestone.status)}
                      </span>
                    </Badge>
                    {milestone.revisionCount && milestone.revisionCount > 0 && (
                      <Badge variant='outline'>
                        {milestone.revisionCount} revision
                        {milestone.revisionCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className='text-lg'>{milestone.title}</CardTitle>
                  <CardDescription className='line-clamp-2'>
                    {milestone.description}
                  </CardDescription>
                </div>

                <div className='text-right'>
                  <div className='flex items-center gap-1 text-lg font-semibold'>
                    <DollarSign className='h-4 w-4' />
                    {parseFloat(milestone.amount).toFixed(3)} ETH
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    Due {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardHeader>

            {expandedMilestone === milestone.id && (
              <CardContent className='space-y-4 border-t'>
                <div className='prose prose-sm max-w-none'>
                  <p>{milestone.description}</p>
                </div>

                {milestone.submissionUrl && (
                  <div className='bg-muted rounded-lg p-3'>
                    <p className='text-sm font-medium'>Submission</p>
                    <a
                      href={milestone.submissionUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary text-sm hover:underline'
                    >
                      View submitted work →
                    </a>
                    {milestone.submittedAt && (
                      <p className='text-muted-foreground text-xs'>
                        Submitted on{' '}
                        {format(new Date(milestone.submittedAt), 'PPP')}
                      </p>
                    )}
                  </div>
                )}

                {milestone.feedback && (
                  <div className='bg-muted rounded-lg p-3'>
                    <p className='text-sm font-medium'>Client Feedback</p>
                    <p className='text-sm'>{milestone.feedback}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className='flex flex-wrap gap-2'>
                  {isFreelancer &&
                    milestone.status === 'pending' &&
                    canStartWork(milestone) && (
                      <Button
                        size='sm'
                        onClick={() => onStartWork?.(milestone.id)}
                      >
                        Start Work
                      </Button>
                    )}

                  {isFreelancer && milestone.status === 'in_progress' && (
                    <Button size='sm' onClick={() => onSubmit?.(milestone.id)}>
                      <Upload className='mr-2 h-4 w-4' />
                      Submit Work
                    </Button>
                  )}

                  {isClient && milestone.status === 'submitted' && (
                    <>
                      <Button
                        size='sm'
                        onClick={() => onApprove?.(milestone.id)}
                      >
                        <CheckCircle2 className='mr-2 h-4 w-4' />
                        Approve & Pay
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => onRequestRevision?.(milestone.id)}
                      >
                        Request Revision
                      </Button>
                    </>
                  )}

                  {(milestone.status === 'in_progress' ||
                    milestone.status === 'submitted') && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => onOpenChat?.(milestone.id)}
                    >
                      <MessageSquare className='mr-2 h-4 w-4' />
                      Discussion
                    </Button>
                  )}
                </div>

                {/* Timeline */}
                {(milestone.submittedAt || milestone.approvedAt) && (
                  <div className='border-t pt-4'>
                    <p className='mb-2 text-sm font-medium'>Timeline</p>
                    <div className='text-muted-foreground space-y-1 text-sm'>
                      {milestone.submittedAt && (
                        <p>
                          • Submitted:{' '}
                          {format(new Date(milestone.submittedAt), 'PPP')}
                        </p>
                      )}
                      {milestone.approvedAt && (
                        <p>
                          • Approved:{' '}
                          {format(new Date(milestone.approvedAt), 'PPP')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
