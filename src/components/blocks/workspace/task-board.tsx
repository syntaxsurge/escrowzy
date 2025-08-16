'use client'

import { useCallback, useState } from 'react'

import { format } from 'date-fns'
import {
  Calendar,
  ChevronRight,
  Clock,
  Flag,
  MoreVertical,
  Plus,
  User
} from 'lucide-react'
// Note: react-beautiful-dnd needs to be installed: pnpm add react-beautiful-dnd @types/react-beautiful-dnd
// For now, we'll use a simpler implementation without drag and drop
import useSWR from 'swr'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/http-client'
import { cn } from '@/lib/utils'

interface Task {
  id: number
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo: {
    id: number
    name: string
    avatarUrl: string | null
  } | null
  milestoneId: number | null
  milestone?: {
    id: number
    title: string
  }
  dueDate: Date | null
  estimatedHours: number | null
  actualHours: number | null
  tags: string[]
  position: number
  createdAt: Date
}

interface TaskColumn {
  id: 'todo' | 'in_progress' | 'review' | 'done'
  title: string
  tasks: Task[]
  color: string
}

interface TaskBoardProps {
  jobId: number
  milestones: any[]
  isClient: boolean
  isFreelancer: boolean
}

export function TaskBoard({ jobId, milestones, isClient, isFreelancer }: TaskBoardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    milestoneId: '',
    dueDate: '',
    estimatedHours: ''
  })

  // Fetch tasks
  const { data: tasks = [], mutate } = useSWR(
    `/api/jobs/${jobId}/tasks`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any).tasks : []
    }
  )

  // Group tasks by status
  const columns: TaskColumn[] = [
    {
      id: 'todo',
      title: 'To Do',
      tasks: tasks.filter((t: Task) => t.status === 'todo'),
      color: 'bg-gray-100'
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      tasks: tasks.filter((t: Task) => t.status === 'in_progress'),
      color: 'bg-blue-100'
    },
    {
      id: 'review',
      title: 'In Review',
      tasks: tasks.filter((t: Task) => t.status === 'review'),
      color: 'bg-yellow-100'
    },
    {
      id: 'done',
      title: 'Done',
      tasks: tasks.filter((t: Task) => t.status === 'done'),
      color: 'bg-green-100'
    }
  ]

  // Handle task status change
  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await api.patch(`/api/jobs/${jobId}/tasks/${taskId}`, {
        status: newStatus
      })
      mutate()
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  // Create task
  const handleCreateTask = async () => {
    try {
      await api.post(`/api/jobs/${jobId}/tasks`, {
        ...newTask,
        milestoneId: newTask.milestoneId ? parseInt(newTask.milestoneId) : null,
        estimatedHours: newTask.estimatedHours ? parseInt(newTask.estimatedHours) : null
      })
      mutate()
      setShowCreateDialog(false)
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        milestoneId: '',
        dueDate: '',
        estimatedHours: ''
      })
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50'
      case 'high':
        return 'text-orange-600 bg-orange-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Task Board</h3>
          <p className='text-sm text-muted-foreground'>
            Manage and track project tasks
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className='gap-2'>
              <Plus className='h-4 w-4' />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to the project board
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='title'>Task Title</Label>
                <Input
                  id='title'
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder='Enter task title'
                />
              </div>
              <div>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder='Enter task description'
                  rows={3}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='priority'>Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='low'>Low</SelectItem>
                      <SelectItem value='medium'>Medium</SelectItem>
                      <SelectItem value='high'>High</SelectItem>
                      <SelectItem value='urgent'>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='milestone'>Milestone</Label>
                  <Select
                    value={newTask.milestoneId}
                    onValueChange={(value) => setNewTask({ ...newTask, milestoneId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select milestone' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>No milestone</SelectItem>
                      {milestones.map((milestone) => (
                        <SelectItem key={milestone.id} value={milestone.id.toString()}>
                          {milestone.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='dueDate'>Due Date</Label>
                  <Input
                    id='dueDate'
                    type='date'
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor='estimatedHours'>Estimated Hours</Label>
                  <Input
                    id='estimatedHours'
                    type='number'
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                    placeholder='0'
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {columns.map((column) => (
          <div key={column.id} className='flex flex-col'>
            <div className={cn('rounded-t-lg p-3', column.color)}>
              <div className='flex items-center justify-between'>
                <h4 className='font-medium'>{column.title}</h4>
                <Badge variant='secondary'>{column.tasks.length}</Badge>
              </div>
            </div>
            <div className='min-h-[400px] rounded-b-lg border-2 border-t-0 p-2'>
              {column.tasks.map((task) => (
                <Card key={task.id} className='mb-2 cursor-pointer transition-shadow hover:shadow-md'>
                  <CardContent className='p-3'>
                    <div className='space-y-2'>
                      <div className='flex items-start justify-between'>
                        <p className='text-sm font-medium line-clamp-2'>
                          {task.title}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' className='h-6 w-6'>
                              <MoreVertical className='h-3 w-3' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Assign</DropdownMenuItem>
                            {column.id !== 'todo' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'todo')}>
                                Move to Todo
                              </DropdownMenuItem>
                            )}
                            {column.id !== 'in_progress' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                                Move to In Progress
                              </DropdownMenuItem>
                            )}
                            {column.id !== 'review' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'review')}>
                                Move to Review
                              </DropdownMenuItem>
                            )}
                            {column.id !== 'done' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'done')}>
                                Move to Done
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className='text-red-600'>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {task.description && (
                        <p className='text-xs text-muted-foreground line-clamp-2'>
                          {task.description}
                        </p>
                      )}

                      <div className='flex items-center gap-2'>
                        <Badge
                          variant='outline'
                          className={cn('text-xs', getPriorityColor(task.priority))}
                        >
                          <Flag className='mr-1 h-3 w-3' />
                          {task.priority}
                        </Badge>
                        {task.milestone && (
                          <Badge variant='secondary' className='text-xs'>
                            {task.milestone.title}
                          </Badge>
                        )}
                      </div>

                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          {task.dueDate && (
                            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                              <Calendar className='h-3 w-3' />
                              {format(new Date(task.dueDate), 'MMM dd')}
                            </div>
                          )}
                          {task.estimatedHours && (
                            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                              <Clock className='h-3 w-3' />
                              {task.estimatedHours}h
                            </div>
                          )}
                        </div>
                        {task.assignedTo && (
                          <Avatar className='h-6 w-6'>
                            <AvatarImage src={task.assignedTo.avatarUrl || undefined} />
                            <AvatarFallback className='text-xs'>
                              {task.assignedTo.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}