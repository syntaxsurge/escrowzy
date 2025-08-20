'use client'

import { useState } from 'react'

import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  File,
  Flag,
  MessageSquare,
  Package,
  Upload,
  Users
} from 'lucide-react'
import useSWR from 'swr'

import { UserAvatar } from '@/components/blocks/user-avatar'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils/cn'

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
      return (
        activity.type.includes('message') || activity.type.includes('comment')
      )
    }
    return true
  })

  // Use actual activities from API
  const displayActivities: ActivityItem[] = filteredActivities

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Activity Timeline</h3>
          <p className='text-muted-foreground text-sm'>
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
              <div className='bg-border absolute top-0 bottom-0 left-5 w-px' />

              {/* Activity items */}
              <div className='space-y-6'>
                {displayActivities.map((activity, index) => (
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
                          <p className='text-sm font-medium'>
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className='text-muted-foreground text-xs'>
                              {activity.description}
                            </p>
                          )}
                          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                            <UserAvatar
                              user={{
                                name: activity.user.name,
                                avatarPath: activity.user.avatarUrl
                              }}
                              size='xs'
                            />
                            <span>{activity.user.name}</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(activity.createdAt)} ago
                            </span>
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
                        <div className='bg-muted mt-3 rounded-lg p-3'>
                          {activity.metadata.files && (
                            <div className='flex items-center gap-2 text-xs'>
                              <File className='h-3 w-3' />
                              <span>
                                {activity.metadata.files.length} files
                              </span>
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

                {displayActivities.length === 0 && (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <Clock className='text-muted-foreground h-12 w-12' />
                    <p className='mt-2 text-sm font-medium'>No activity yet</p>
                    <p className='text-muted-foreground text-xs'>
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
