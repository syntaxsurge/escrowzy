'use client'

import Link from 'next/link'
import { useState } from 'react'

import { format } from 'date-fns'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Target,
  XCircle
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { appRoutes } from '@/config/app-routes'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'

interface Milestone {
  id: number
  jobId: number
  jobTitle: string
  title: string
  amount: string
  dueDate: Date | null
  status: string
  freelancerName: string
}

interface MilestoneStats {
  total: number
  pending: number
  inProgress: number
  submitted: number
  approved: number
  disputed: number
}

interface MilestoneTrackerProps {
  milestones: Milestone[]
  stats: MilestoneStats
  detailed?: boolean
  clientId?: number
}

export function MilestoneTracker({
  milestones,
  stats,
  detailed = false,
  clientId
}: MilestoneTrackerProps) {
  const { toast } = useToast()
  const [processingId, setProcessingId] = useState<number | null>(null)

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='h-4 w-4 text-gray-500' />
      case 'in_progress':
        return <Loader2 className='h-4 w-4 animate-spin text-blue-500' />
      case 'submitted':
        return <FileText className='h-4 w-4 text-yellow-500' />
      case 'approved':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'disputed':
        return <XCircle className='h-4 w-4 text-red-500' />
      default:
        return <AlertCircle className='h-4 w-4' />
    }
  }

  const getMilestoneStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant='secondary'>Pending</Badge>
      case 'in_progress':
        return <Badge variant='default'>In Progress</Badge>
      case 'submitted':
        return <Badge variant='warning'>Submitted</Badge>
      case 'approved':
        return <Badge variant='success'>Approved</Badge>
      case 'disputed':
        return <Badge variant='destructive'>Disputed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleMilestoneAction = async (milestoneId: number, action: string) => {
    setProcessingId(milestoneId)
    try {
      const response = await api.post(`/api/milestones/${milestoneId}/action`, {
        action
      })

      if (response.success) {
        toast({
          title: 'Success',
          description: `Milestone ${action} successfully`
        })
        // Refresh data
        window.location.reload()
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      console.error(`Failed to ${action} milestone:`, error)
      toast({
        title: 'Error',
        description: `Failed to ${action} milestone`,
        variant: 'destructive'
      })
    } finally {
      setProcessingId(null)
    }
  }

  const calculateProgress = () => {
    if (stats.total === 0) return 0
    return Math.round((stats.approved / stats.total) * 100)
  }

  if (detailed) {
    return (
      <div className='space-y-6'>
        {/* Stats Overview */}
        <div className='grid gap-4 md:grid-cols-6'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-gray-500'>
                {stats.pending}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-blue-500'>
                {stats.inProgress}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-yellow-500'>
                {stats.submitted}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-500'>
                {stats.approved}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>Disputed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-500'>
                {stats.disputed}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Milestones Table */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Target className='h-5 w-5' />
              All Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='all' className='w-full'>
              <TabsList>
                <TabsTrigger value='all'>All</TabsTrigger>
                <TabsTrigger value='pending'>Pending</TabsTrigger>
                <TabsTrigger value='in_progress'>In Progress</TabsTrigger>
                <TabsTrigger value='submitted'>Needs Review</TabsTrigger>
                <TabsTrigger value='approved'>Approved</TabsTrigger>
                <TabsTrigger value='disputed'>Disputed</TabsTrigger>
              </TabsList>

              <TabsContent value='all'>
                <MilestoneTable
                  milestones={milestones}
                  onAction={handleMilestoneAction}
                  processingId={processingId}
                />
              </TabsContent>
              <TabsContent value='pending'>
                <MilestoneTable
                  milestones={milestones.filter(m => m.status === 'pending')}
                  onAction={handleMilestoneAction}
                  processingId={processingId}
                />
              </TabsContent>
              <TabsContent value='in_progress'>
                <MilestoneTable
                  milestones={milestones.filter(
                    m => m.status === 'in_progress'
                  )}
                  onAction={handleMilestoneAction}
                  processingId={processingId}
                />
              </TabsContent>
              <TabsContent value='submitted'>
                <MilestoneTable
                  milestones={milestones.filter(m => m.status === 'submitted')}
                  onAction={handleMilestoneAction}
                  processingId={processingId}
                />
              </TabsContent>
              <TabsContent value='approved'>
                <MilestoneTable
                  milestones={milestones.filter(m => m.status === 'approved')}
                  onAction={handleMilestoneAction}
                  processingId={processingId}
                />
              </TabsContent>
              <TabsContent value='disputed'>
                <MilestoneTable
                  milestones={milestones.filter(m => m.status === 'disputed')}
                  onAction={handleMilestoneAction}
                  processingId={processingId}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span className='flex items-center gap-2'>
            <Target className='h-5 w-5' />
            Milestones
          </span>
          <Button size='sm' variant='outline' asChild>
            <Link href={appRoutes.dashboard.client.milestones}>View All</Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Progress Overview */}
          <div>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-sm font-medium'>Overall Progress</span>
              <span className='text-muted-foreground text-sm'>
                {stats.approved} of {stats.total} completed
              </span>
            </div>
            <Progress value={calculateProgress()} className='h-2' />
          </div>

          {/* Stats Grid */}
          <div className='grid grid-cols-3 gap-2'>
            <div className='rounded-lg border p-2'>
              <div className='flex items-center gap-2'>
                <Clock className='h-3 w-3 text-yellow-500' />
                <span className='text-muted-foreground text-xs'>
                  Pending Review
                </span>
              </div>
              <div className='mt-1 text-lg font-bold'>{stats.submitted}</div>
            </div>
            <div className='rounded-lg border p-2'>
              <div className='flex items-center gap-2'>
                <Loader2 className='h-3 w-3 text-blue-500' />
                <span className='text-muted-foreground text-xs'>
                  In Progress
                </span>
              </div>
              <div className='mt-1 text-lg font-bold'>{stats.inProgress}</div>
            </div>
            <div className='rounded-lg border p-2'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-3 w-3 text-red-500' />
                <span className='text-muted-foreground text-xs'>Disputed</span>
              </div>
              <div className='mt-1 text-lg font-bold'>{stats.disputed}</div>
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div>
            <h3 className='mb-2 text-sm font-medium'>Upcoming Milestones</h3>
            <div className='space-y-2'>
              {milestones.slice(0, 3).map(milestone => (
                <div
                  key={milestone.id}
                  className='flex items-center justify-between rounded-lg border p-3'
                >
                  <div className='flex items-center gap-3'>
                    {getMilestoneStatusIcon(milestone.status)}
                    <div>
                      <p className='font-medium'>{milestone.title}</p>
                      <p className='text-muted-foreground text-xs'>
                        {milestone.jobTitle} • {milestone.freelancerName}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='font-bold'>${milestone.amount}</div>
                    {milestone.dueDate && (
                      <div className='text-muted-foreground text-xs'>
                        Due {format(new Date(milestone.dueDate), 'MMM d')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper component for milestone table
function MilestoneTable({
  milestones,
  onAction,
  processingId
}: {
  milestones: Milestone[]
  onAction: (id: number, action: string) => void
  processingId: number | null
}) {
  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='h-4 w-4 text-gray-500' />
      case 'in_progress':
        return <Loader2 className='h-4 w-4 animate-spin text-blue-500' />
      case 'submitted':
        return <FileText className='h-4 w-4 text-yellow-500' />
      case 'approved':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'disputed':
        return <XCircle className='h-4 w-4 text-red-500' />
      default:
        return <AlertCircle className='h-4 w-4' />
    }
  }

  const getMilestoneStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant='secondary'>Pending</Badge>
      case 'in_progress':
        return <Badge variant='default'>In Progress</Badge>
      case 'submitted':
        return <Badge variant='warning'>Submitted</Badge>
      case 'approved':
        return <Badge variant='success'>Approved</Badge>
      case 'disputed':
        return <Badge variant='destructive'>Disputed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Milestone</TableHead>
          <TableHead>Job</TableHead>
          <TableHead>Freelancer</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className='text-right'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {milestones.map(milestone => (
          <TableRow key={milestone.id}>
            <TableCell className='font-medium'>
              <div className='flex items-center gap-2'>
                {getMilestoneStatusIcon(milestone.status)}
                {milestone.title}
              </div>
            </TableCell>
            <TableCell>
              <Link
                href={`/trades/jobs/${milestone.jobId}`}
                className='hover:underline'
              >
                {milestone.jobTitle}
              </Link>
            </TableCell>
            <TableCell>{milestone.freelancerName}</TableCell>
            <TableCell>
              <span className='font-bold'>${milestone.amount}</span>
            </TableCell>
            <TableCell>
              {milestone.dueDate
                ? format(new Date(milestone.dueDate), 'MMM d, yyyy')
                : '-'}
            </TableCell>
            <TableCell>{getMilestoneStatusBadge(milestone.status)}</TableCell>
            <TableCell className='text-right'>
              <div className='flex items-center justify-end gap-2'>
                {milestone.status === 'submitted' && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => onAction(milestone.id, 'approve')}
                            disabled={processingId === milestone.id}
                          >
                            {processingId === milestone.id ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <CheckCircle className='h-4 w-4' />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Approve Milestone</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              onAction(milestone.id, 'request_revision')
                            }
                            disabled={processingId === milestone.id}
                          >
                            <MessageSquare className='h-4 w-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Request Revision</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
                <Button size='sm' variant='ghost' asChild>
                  <Link href={`/jobs/${milestone.jobId}/workspace`}>View</Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
