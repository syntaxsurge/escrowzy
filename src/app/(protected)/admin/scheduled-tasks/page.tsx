'use client'

import { useState } from 'react'

import { format } from 'date-fns'
import {
  Activity,
  AlertCircle,
  Clock,
  PlayCircle,
  RefreshCw,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { api } from '@/lib/api/http-client'

interface ScheduledTask {
  id: string
  name: string
  description: string
  schedule: string // Cron expression
  lastRun?: string
  nextRun?: string
  status: 'active' | 'paused' | 'error'
  successCount: number
  errorCount: number
  averageRunTime?: number
}

export default function ScheduledTasksPage() {
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({})

  // Fetch task statuses
  const { data: tasks, mutate: mutateTasks } = useSWR<ScheduledTask[]>(
    '/api/admin/scheduled-tasks',
    async (url: string) => {
      const response = await api.get(url)
      return response
    },
    {
      refreshInterval: 30000 // Refresh every 30 seconds
    }
  )

  // Check milestone auto-release status
  const { data: autoReleaseStatus } = useSWR(
    '/api/cron/milestone-auto-release',
    async (url: string) => {
      const response = await api.get(url, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_CRON_API_KEY || ''
        }
      })
      return response.success ? response : null
    }
  )

  const runTask = async (taskId: string) => {
    setIsRunning({ ...isRunning, [taskId]: true })

    try {
      const response = await api.post('/api/admin/scheduled-tasks', { taskId })

      if (response.success) {
        toast.success(`Task ${taskId} completed successfully`)
        mutateTasks()
      } else {
        toast.error(response.error || `Failed to run task ${taskId}`)
      }
    } catch (error) {
      toast.error(`Failed to run task ${taskId}`)
    } finally {
      setIsRunning({ ...isRunning, [taskId]: false })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant='success'>Active</Badge>
      case 'paused':
        return <Badge variant='warning'>Paused</Badge>
      case 'error':
        return <Badge variant='destructive'>Error</Badge>
      default:
        return <Badge variant='secondary'>Unknown</Badge>
    }
  }

  const totalTasks = tasks?.length || 0
  const activeTasks = tasks?.filter(t => t.status === 'active').length || 0
  const errorTasks = tasks?.filter(t => t.status === 'error').length || 0
  const totalRuns =
    tasks?.reduce((sum, t) => sum + t.successCount + t.errorCount, 0) || 0
  const successRate =
    totalRuns > 0
      ? (
          ((tasks?.reduce((sum, t) => sum + t.successCount, 0) || 0) /
            totalRuns) *
          100
        ).toFixed(1)
      : '0'

  return (
    <div className='container mx-auto space-y-6 py-6'>
      <div>
        <h1 className='text-3xl font-bold'>Scheduled Tasks</h1>
        <p className='text-muted-foreground'>
          Monitor and manage automated background tasks
        </p>
      </div>

      {/* Overview Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Tasks</CardTitle>
            <Activity className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalTasks}</div>
            <p className='text-muted-foreground text-xs'>
              {activeTasks} active, {errorTasks} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Runs</CardTitle>
            <RefreshCw className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalRuns}</div>
            <Progress value={parseFloat(successRate)} className='mt-2' />
            <p className='text-muted-foreground mt-1 text-xs'>
              {successRate}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Pending Auto-Release
            </CardTitle>
            <Clock className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(autoReleaseStatus as any)?.pendingAutoRelease || 0}
            </div>
            <p className='text-muted-foreground text-xs'>
              Milestones awaiting release
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Overdue Milestones
            </CardTitle>
            <AlertCircle className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(autoReleaseStatus as any)?.overdueMilestones || 0}
            </div>
            <p className='text-muted-foreground text-xs'>Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='tasks' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='tasks'>Scheduled Tasks</TabsTrigger>
          <TabsTrigger value='history'>Run History</TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value='tasks' className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>Active Tasks</CardTitle>
                <Button size='sm' variant='outline'>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Name</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks?.map(task => {
                    const totalTaskRuns = task.successCount + task.errorCount
                    const taskSuccessRate =
                      totalTaskRuns > 0
                        ? ((task.successCount / totalTaskRuns) * 100).toFixed(1)
                        : '0'

                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className='font-medium'>{task.name}</p>
                            <p className='text-muted-foreground text-xs'>
                              {task.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className='text-xs'>{task.schedule}</code>
                        </TableCell>
                        <TableCell>
                          {task.lastRun ? (
                            <div className='text-sm'>
                              {format(new Date(task.lastRun), 'MMM d, HH:mm')}
                            </div>
                          ) : (
                            <span className='text-muted-foreground'>Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.nextRun ? (
                            <div className='text-sm'>
                              {format(new Date(task.nextRun), 'MMM d, HH:mm')}
                            </div>
                          ) : (
                            <span className='text-muted-foreground'>-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Progress
                              value={parseFloat(taskSuccessRate)}
                              className='w-16'
                            />
                            <span className='text-sm'>{taskSuccessRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => runTask(task.id)}
                            disabled={isRunning[task.id]}
                          >
                            {isRunning[task.id] ? (
                              <RefreshCw className='h-4 w-4 animate-spin' />
                            ) : (
                              <PlayCircle className='h-4 w-4' />
                            )}
                            Run Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='history' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Recent Task Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  Task run history will be available in the next update.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='settings' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Task Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Settings className='h-4 w-4' />
                <AlertTitle>Configuration</AlertTitle>
                <AlertDescription>
                  Task schedules are configured through environment variables
                  and can be managed via your deployment platform's cron job
                  settings.
                </AlertDescription>
              </Alert>

              <div className='mt-4 space-y-4'>
                <div className='rounded-lg border p-4'>
                  <h3 className='font-medium'>Cron Expression Reference</h3>
                  <div className='text-muted-foreground mt-2 space-y-2 text-sm'>
                    <p>
                      • <code>0 * * * *</code> - Every hour
                    </p>
                    <p>
                      • <code>0 0 * * *</code> - Daily at midnight
                    </p>
                    <p>
                      • <code>0 9 * * 1-5</code> - Weekdays at 9 AM
                    </p>
                    <p>
                      • <code>0 0 1 * *</code> - Monthly on the 1st
                    </p>
                    <p>
                      • <code>0 0 1 */3 *</code> - Quarterly
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
