'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Clock,
  FolderOpen,
  Home,
  ListTodo,
  MessageSquare,
  Users
} from 'lucide-react'
import useSWR from 'swr'

import { FileManager } from '@/components/blocks/workspace/file-manager'
import { JobCalendar } from '@/components/blocks/workspace/job-calendar'
import { TaskBoard } from '@/components/blocks/workspace/task-board'
import { TimeTracker } from '@/components/blocks/workspace/time-tracker'
import { WorkspaceActivity } from '@/components/blocks/workspace/workspace-activity'
import { WorkspaceChat } from '@/components/blocks/workspace/workspace-chat'
import { WorkspaceOverview } from '@/components/blocks/workspace/workspace-overview'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'
import type { JobPostingWithRelations } from '@/lib/db/queries/jobs'
import { pusherClient } from '@/lib/pusher-client'

// Import workspace components

interface WorkspaceSession {
  id: number
  userId: number
  user: {
    id: number
    name: string
    email: string
    avatarUrl: string | null
  }
  status: 'active' | 'idle' | 'disconnected'
  currentTab: string | null
  lastActivityAt: Date
}

export default function JobWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSession()
  const jobId = params.id as string

  const [activeTab, setActiveTab] = useState('overview')
  const [activeSessions, setActiveSessions] = useState<WorkspaceSession[]>([])

  // Fetch job details
  const {
    data: job,
    isLoading,
    mutate: mutateJob
  } = useSWR<JobPostingWithRelations>(
    apiEndpoints.jobs.byId(jobId),
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any).job : null
    }
  )

  // Fetch workspace sessions
  const { data: sessions, mutate: mutateSessions } = useSWR(
    `/api/jobs/${jobId}/workspace/sessions`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any).sessions : []
    },
    {
      refreshInterval: 30000 // Refresh every 30 seconds
    }
  )

  // Initialize workspace session
  useEffect(() => {
    if (!user || !jobId) return

    const initSession = async () => {
      try {
        await api.post(`/api/jobs/${jobId}/workspace/join`, {
          currentTab: activeTab
        })
      } catch (error) {
        console.error('Failed to join workspace:', error)
      }
    }

    initSession()

    // Subscribe to workspace events
    if (pusherClient) {
      const channel = pusherClient.subscribe(`workspace-${jobId}`)

      channel.bind('user-joined', (data: any) => {
        mutateSessions()
      })

      channel.bind('user-left', (data: any) => {
        mutateSessions()
      })

      channel.bind('activity-update', (data: any) => {
        mutateSessions()
      })

      // Clean up on unmount
      return () => {
        api.post(`/api/jobs/${jobId}/workspace/leave`).catch(console.error)
        pusherClient?.unsubscribe(`workspace-${jobId}`)
      }
    }

    return () => {
      api.post(`/api/jobs/${jobId}/workspace/leave`).catch(console.error)
    }
  }, [user, jobId])

  // Update session when tab changes
  useEffect(() => {
    if (!user || !jobId) return

    const updateSession = async () => {
      try {
        await api.patch(`/api/jobs/${jobId}/workspace/session`, {
          currentTab: activeTab
        })
      } catch (error) {
        console.error('Failed to update session:', error)
      }
    }

    updateSession()
  }, [activeTab, user, jobId])

  // Check access permissions
  const isClient = job?.clientId === user?.id
  const isFreelancer = job?.freelancerId === user?.id
  const hasAccess = isClient || isFreelancer

  if (isLoading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <div className='text-center'>
          <div className='border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent' />
          <p className='text-muted-foreground mt-2 text-sm'>
            Loading workspace...
          </p>
        </div>
      </div>
    )
  }

  if (!job || !hasAccess) {
    return (
      <div className='flex h-96 flex-col items-center justify-center'>
        <h2 className='text-xl font-semibold'>Access Denied</h2>
        <p className='text-muted-foreground mt-2'>
          You don't have permission to access this workspace.
        </p>
        <Button
          className='mt-4'
          onClick={() => router.push(appRoutes.trades.jobs.base)}
        >
          Back to Jobs
        </Button>
      </div>
    )
  }

  const completedMilestones =
    job.milestones?.filter(m => m.status === 'approved').length || 0
  const totalMilestones = job.milestones?.length || 0
  const progress =
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  return (
    <div className='container mx-auto px-4 py-6'>
      {/* Header */}
      <div className='mb-6'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push(appRoutes.trades.jobs.detail(jobId))}
              className='gap-2'
            >
              <ArrowLeft className='h-4 w-4' />
              Back to Job
            </Button>
            <Separator orientation='vertical' className='h-6' />
            <Badge variant='outline' className='gap-1'>
              <Users className='h-3 w-3' />
              {sessions?.length || 0} Active
            </Badge>
          </div>
          <div className='flex items-center gap-2'>
            {sessions?.map((session: WorkspaceSession) => (
              <TooltipProvider key={session.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className='h-8 w-8 border-2 border-green-500'>
                      <AvatarImage src={session.user.avatarUrl || undefined} />
                      <AvatarFallback>
                        {session.user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className='text-xs'>
                      <p className='font-medium'>{session.user.name}</p>
                      <p className='text-muted-foreground'>
                        {session.currentTab
                          ? `Viewing ${session.currentTab}`
                          : 'Active'}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        <div>
          <h1 className='text-2xl font-bold'>{job.title} - Workspace</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Collaborate, track progress, and manage deliverables
          </p>
        </div>

        {/* Progress Bar */}
        <div className='mt-4'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Project Progress</span>
            <span className='font-medium'>
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className='mt-2' />
          <div className='text-muted-foreground mt-1 flex justify-between text-xs'>
            <span>
              {completedMilestones} of {totalMilestones} milestones completed
            </span>
            {job.deadline && (
              <span>
                Deadline: {format(new Date(job.deadline), 'MMM dd, yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-6'>
          <TabsTrigger value='overview' className='gap-2'>
            <Home className='h-4 w-4' />
            <span className='hidden sm:inline'>Overview</span>
          </TabsTrigger>
          <TabsTrigger value='files' className='gap-2'>
            <FolderOpen className='h-4 w-4' />
            <span className='hidden sm:inline'>Files</span>
          </TabsTrigger>
          <TabsTrigger value='messages' className='gap-2'>
            <MessageSquare className='h-4 w-4' />
            <span className='hidden sm:inline'>Messages</span>
          </TabsTrigger>
          <TabsTrigger value='tasks' className='gap-2'>
            <ListTodo className='h-4 w-4' />
            <span className='hidden sm:inline'>Tasks</span>
          </TabsTrigger>
          <TabsTrigger value='timeline' className='gap-2'>
            <Clock className='h-4 w-4' />
            <span className='hidden sm:inline'>Timeline</span>
          </TabsTrigger>
          <TabsTrigger value='calendar' className='gap-2'>
            <Calendar className='h-4 w-4' />
            <span className='hidden sm:inline'>Calendar</span>
          </TabsTrigger>
        </TabsList>

        <div className='mt-6'>
          <TabsContent value='overview' className='space-y-6'>
            <WorkspaceOverview
              job={job}
              isClient={isClient}
              isFreelancer={isFreelancer}
            />
          </TabsContent>

          <TabsContent value='files' className='space-y-6'>
            <FileManager
              jobId={parseInt(jobId)}
              isClient={isClient}
              isFreelancer={isFreelancer}
            />
          </TabsContent>

          <TabsContent value='messages' className='space-y-6'>
            <WorkspaceChat
              jobId={parseInt(jobId)}
              job={job}
              currentUser={user!}
            />
          </TabsContent>

          <TabsContent value='tasks' className='space-y-6'>
            <TaskBoard
              jobId={parseInt(jobId)}
              milestones={job.milestones || []}
              isClient={isClient}
              isFreelancer={isFreelancer}
            />
          </TabsContent>

          <TabsContent value='timeline' className='space-y-6'>
            <WorkspaceActivity jobId={parseInt(jobId)} job={job} />
          </TabsContent>

          <TabsContent value='calendar' className='space-y-6'>
            <JobCalendar
              jobId={parseInt(jobId)}
              milestones={job.milestones || []}
              isClient={isClient}
              isFreelancer={isFreelancer}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Time Tracker Widget (Always Visible for Freelancer) */}
      {isFreelancer && job.budgetType === 'hourly' && (
        <div className='fixed right-6 bottom-6 z-50'>
          <TimeTracker
            jobId={parseInt(jobId)}
            hourlyRate={job.budgetMin || '0'}
          />
        </div>
      )}
    </div>
  )
}
