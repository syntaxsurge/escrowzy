'use client'

import { useState } from 'react'

import { format, formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  File,
  Flag,
  MessageSquare,
  Package,
  Play,
  Plus,
  Star,
  Upload,
  User,
  Users
} from 'lucide-react'
import useSWR from 'swr'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { api } from '@/lib/api/http-client'
import type { JobPostingWithRelations } from '@/lib/db/queries/jobs'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string | null
  user: {
    id: number
    name: string
    avatarUrl: string | null
  }
  metadata?: any
  createdAt: Date
}

interface WorkspaceActivityProps {
  jobId: number
  job: JobPostingWithRelations
}

export function WorkspaceActivity({ jobId, job }: WorkspaceActivityProps) {
  const [filter, setFilter] = useState('all')

  // Fetch activity
  const { data: activities = [] } = useSWR(
    `/api/jobs/${jobId}/activity`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any).activities : []
    },
    {
      refreshInterval: 30000 // Refresh every 30 seconds
    }
  )

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'milestone_created':
      case 'milestone_updated':
        return <Package className='h-4 w-4' />
      case 'milestone_submitted':
        return <Upload className='h-4 w-4' />
      case 'milestone_approved':
        return <CheckCircle2 className='h-4 w-4' />
      case 'task_created':
      case 'task_updated':
        return <Flag className='h-4 w-4' />
      case 'task_completed':
        return <CheckCircle2 className='h-4 w-4' />
      case 'file_uploaded':
        return <File className='h-4 w-4' />
      case 'message_sent':
        return <MessageSquare className='h-4 w-4' />
      case 'time_tracked':
        return <Clock className='h-4 w-4' />
      case 'member_joined':
      case 'member_left':
        return <Users className='h-4 w-4' />
      case 'event_created':
        return <Calendar className='h-4 w-4' />
      default:
        return <AlertCircle className='h-4 w-4' />
    }
  }

  // Get activity color
  const getActivityColor = (type: string) => {
    if (type.includes('approved') || type.includes('completed')) {
      return 'bg-green-100 text-green-600'
    }
    if (type.includes('submitted') || type.includes('created')) {
      return 'bg-blue-100 text-blue-600'
    }
    if (type.includes('updated') || type.includes('tracked')) {
      return 'bg-yellow-100 text-yellow-600'
    }
    if (type.includes('message') || type.includes('comment')) {
      return 'bg-purple-100 text-purple-600'
    }
    return 'bg-gray-100 text-gray-600'
  }

  // Filter activities
  const filteredActivities = activities.filter((activity: ActivityItem) => {
    if (filter === 'all') return true
    if (filter === 'milestones') {
      return activity.type.includes('milestone')
    }
    if (filter === 'tasks') {
      return activity.type.includes('task')
    }
    if (filter === 'files') {
      return activity.type.includes('file')
    }
    if (filter === 'messages') {
      return activity.type.includes('message') || activity.type.includes('comment')
    }
    return true
  })

  // Generate mock activities if none exist
  const mockActivities: ActivityItem[] = filteredActivities.length > 0 ? filteredActivities : [
    {
      id: '1',
      type: 'milestone_created',
      title: 'Project kickoff milestone created',
      description: 'Initial project setup and requirements gathering',
      user: job.client || { id: 1, name: 'Client', avatarUrl: null },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      type: 'member_joined',
      title: 'Freelancer joined the workspace',
      description: null,
      user: job.freelancer || { id: 2, name: 'Freelancer', avatarUrl: null },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      type: 'task_created',
      title: 'Created task: Design wireframes',
      description: 'Create initial wireframes for the application',
      user: job.freelancer || { id: 2, name: 'Freelancer', avatarUrl: null },
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    },
    {
      id: '4',
      type: 'file_uploaded',
      title: 'Uploaded project-requirements.pdf',
      description: 'Initial project requirements document',
      user: job.client || { id: 1, name: 'Client', avatarUrl: null },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      id: '5',
      type: 'time_tracked',
      title: 'Tracked 2 hours',
      description: 'Working on wireframe designs',
      user: job.freelancer || { id: 2, name: 'Freelancer', avatarUrl: null },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ]

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Activity Timeline</h3>
          <p className='text-sm text-muted-foreground'>
            Track all project activities and updates
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Activity</SelectItem>
            <SelectItem value='milestones'>Milestones</SelectItem>
            <SelectItem value='tasks'>Tasks</SelectItem>
            <SelectItem value='files'>Files</SelectItem>
            <SelectItem value='messages'>Messages</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className='h-[500px] pr-4'>
            <div className='relative'>
              {/* Timeline line */}
              <div className='absolute left-5 top-0 bottom-0 w-px bg-border' />

              {/* Activity items */}
              <div className='space-y-6'>
                {mockActivities.map((activity, index) => (
                  <div key={activity.id} className='relative flex gap-4'>
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'relative z-10 flex h-10 w-10 items-center justify-center rounded-full',
                        getActivityColor(activity.type)
                      )}
                    >
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Content */}
                    <div className='flex-1 pb-6'>
                      <div className='flex items-start justify-between'>
                        <div className='space-y-1'>
                          <p className='text-sm font-medium'>{activity.title}</p>
                          {activity.description && (
                            <p className='text-xs text-muted-foreground'>
                              {activity.description}
                            </p>
                          )}
                          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                            <Avatar className='h-5 w-5'>
                              <AvatarImage src={activity.user.avatarUrl || undefined} />
                              <AvatarFallback className='text-xs'>
                                {activity.user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{activity.user.name}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(activity.createdAt)} ago</span>
                          </div>
                        </div>
                        {activity.metadata?.amount && (
                          <Badge variant='secondary'>
                            ${activity.metadata.amount}
                          </Badge>
                        )}
                      </div>

                      {/* Additional metadata */}
                      {activity.metadata && (
                        <div className='mt-3 rounded-lg bg-muted p-3'>
                          {activity.metadata.files && (
                            <div className='flex items-center gap-2 text-xs'>
                              <File className='h-3 w-3' />
                              <span>{activity.metadata.files.length} files</span>
                            </div>
                          )}
                          {activity.metadata.duration && (
                            <div className='flex items-center gap-2 text-xs'>
                              <Clock className='h-3 w-3' />
                              <span>{activity.metadata.duration} hours</span>
                            </div>
                          )}
                          {activity.metadata.status && (
                            <Badge variant='outline' className='text-xs'>
                              {activity.metadata.status}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {mockActivities.length === 0 && (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <Clock className='h-12 w-12 text-muted-foreground' />
                    <p className='mt-2 text-sm font-medium'>No activity yet</p>
                    <p className='text-xs text-muted-foreground'>
                      Activities will appear here as work progresses
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}