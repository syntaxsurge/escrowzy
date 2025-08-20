'use client'

import { useState } from 'react'

import { addDays, format, isSameDay, startOfMonth, startOfWeek } from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus
} from 'lucide-react'
import useSWR from 'swr'

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
import { cn } from '@/lib/utils/cn'

interface CalendarEvent {
  id: number
  title: string
  description: string | null
  eventType: string
  startTime: Date
  endTime: Date | null
  location: string | null
  attendees: number[]
  isAllDay: boolean
  status: string
}

interface JobCalendarProps {
  jobId: number
  milestones: any[]
  isClient: boolean
  isFreelancer: boolean
}

export function JobCalendar({
  jobId,
  milestones,
  isClient,
  isFreelancer
}: JobCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventType: 'meeting',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    location: '',
    isAllDay: false
  })

  // Fetch events
  const { data: events = [], mutate } = useSWR(
    `/api/jobs/${jobId}/events`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any).events : []
    }
  )

  // Create event
  const handleCreateEvent = async () => {
    try {
      const startTime = newEvent.isAllDay
        ? new Date(`${newEvent.date}T00:00:00`)
        : new Date(`${newEvent.date}T${newEvent.startTime}`)

      const endTime = newEvent.isAllDay
        ? new Date(`${newEvent.date}T23:59:59`)
        : newEvent.endTime
          ? new Date(`${newEvent.date}T${newEvent.endTime}`)
          : null

      await api.post(`/api/jobs/${jobId}/events`, {
        ...newEvent,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString()
      })

      mutate()
      setShowEventDialog(false)
      setNewEvent({
        title: '',
        description: '',
        eventType: 'meeting',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '',
        endTime: '',
        location: '',
        isAllDay: false
      })
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  // Get calendar days
  const getCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentDate))
    const days = []

    for (let i = 0; i < 35; i++) {
      days.push(addDays(start, i))
    }

    return days
  }

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((event: CalendarEvent) =>
      isSameDay(new Date(event.startTime), date)
    )
  }

  // Get milestones for a specific day
  const getMilestonesForDay = (date: Date) => {
    return milestones.filter(
      milestone =>
        milestone.dueDate && isSameDay(new Date(milestone.dueDate), date)
    )
  }

  // Get event type color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-600'
      case 'deadline':
        return 'bg-red-100 text-red-600'
      case 'milestone':
        return 'bg-green-100 text-green-600'
      case 'review':
        return 'bg-yellow-100 text-yellow-600'
      case 'delivery':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const calendarDays = getCalendarDays()
  const monthYear = format(currentDate, 'MMMM yyyy')

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Project Calendar</h3>
          <p className='text-muted-foreground text-sm'>
            Schedule meetings, track deadlines, and manage events
          </p>
        </div>
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogTrigger asChild>
            <Button className='gap-2'>
              <Plus className='h-4 w-4' />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Schedule a meeting or add an important date
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='title'>Event Title</Label>
                <Input
                  id='title'
                  value={newEvent.title}
                  onChange={e =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  placeholder='Enter event title'
                />
              </div>
              <div>
                <Label htmlFor='eventType'>Event Type</Label>
                <Select
                  value={newEvent.eventType}
                  onValueChange={value =>
                    setNewEvent({ ...newEvent, eventType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='meeting'>Meeting</SelectItem>
                    <SelectItem value='deadline'>Deadline</SelectItem>
                    <SelectItem value='milestone'>Milestone</SelectItem>
                    <SelectItem value='review'>Review</SelectItem>
                    <SelectItem value='delivery'>Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  value={newEvent.description}
                  onChange={e =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  placeholder='Enter event description'
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor='date'>Date</Label>
                <Input
                  id='date'
                  type='date'
                  value={newEvent.date}
                  onChange={e =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                />
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='isAllDay'
                  checked={newEvent.isAllDay}
                  onChange={e =>
                    setNewEvent({ ...newEvent, isAllDay: e.target.checked })
                  }
                  className='rounded border-gray-300'
                />
                <Label htmlFor='isAllDay' className='cursor-pointer'>
                  All day event
                </Label>
              </div>
              {!newEvent.isAllDay && (
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='startTime'>Start Time</Label>
                    <Input
                      id='startTime'
                      type='time'
                      value={newEvent.startTime}
                      onChange={e =>
                        setNewEvent({ ...newEvent, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='endTime'>End Time</Label>
                    <Input
                      id='endTime'
                      type='time'
                      value={newEvent.endTime}
                      onChange={e =>
                        setNewEvent({ ...newEvent, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
              {newEvent.eventType === 'meeting' && (
                <>
                  <div>
                    <Label htmlFor='location'>Location (Optional)</Label>
                    <Input
                      id='location'
                      value={newEvent.location}
                      onChange={e =>
                        setNewEvent({ ...newEvent, location: e.target.value })
                      }
                      placeholder='Enter meeting location'
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setShowEventDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateEvent}>Create Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <CalendarIcon className='h-4 w-4' />
              {monthYear}
            </CardTitle>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='icon'
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() - 1
                    )
                  )
                }
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant='outline'
                size='icon'
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() + 1
                    )
                  )
                }
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='grid grid-cols-7'>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className='text-muted-foreground border-r border-b p-2 text-center text-xs font-medium'
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDay(day)
              const dayMilestones = getMilestonesForDay(day)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isToday = isSameDay(day, new Date())
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <div
                  key={index}
                  className={cn(
                    'hover:bg-muted/50 min-h-[100px] cursor-pointer border-r border-b p-2 transition-colors',
                    !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
                    isToday && 'bg-primary/5',
                    isSelected && 'ring-primary ring-2'
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className='mb-1 text-sm font-medium'>
                    {format(day, 'd')}
                  </div>
                  <div className='space-y-1'>
                    {/* Milestones */}
                    {dayMilestones.map((milestone: any) => (
                      <div
                        key={`milestone-${milestone.id}`}
                        className='truncate rounded bg-green-100 px-1 py-0.5 text-xs text-green-700'
                      >
                        📦 {milestone.title}
                      </div>
                    ))}
                    {/* Events */}
                    {dayEvents.slice(0, 2).map((event: CalendarEvent) => (
                      <div
                        key={event.id}
                        className={cn(
                          'truncate rounded px-1 py-0.5 text-xs',
                          getEventTypeColor(event.eventType)
                        )}
                      >
                        {event.eventType === 'meeting' && '🎥'}
                        {event.eventType === 'deadline' && '⏰'}
                        {event.eventType === 'review' && '👁'}
                        {event.eventType === 'delivery' && '📦'} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className='text-muted-foreground text-xs'>
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>
              Events for {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {getEventsForDay(selectedDate).map((event: CalendarEvent) => (
                <div
                  key={event.id}
                  className='flex items-start gap-3 rounded-lg border p-3'
                >
                  <Badge
                    variant='outline'
                    className={getEventTypeColor(event.eventType)}
                  >
                    {event.eventType}
                  </Badge>
                  <div className='flex-1 space-y-1'>
                    <p className='font-medium'>{event.title}</p>
                    {event.description && (
                      <p className='text-muted-foreground text-sm'>
                        {event.description}
                      </p>
                    )}
                    <div className='text-muted-foreground flex items-center gap-4 text-xs'>
                      {!event.isAllDay && (
                        <span className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          {format(new Date(event.startTime), 'HH:mm')}
                          {event.endTime &&
                            ` - ${format(new Date(event.endTime), 'HH:mm')}`}
                        </span>
                      )}
                      {event.location && (
                        <span className='flex items-center gap-1'>
                          <MapPin className='h-3 w-3' />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {getMilestonesForDay(selectedDate).map((milestone: any) => (
                <div
                  key={`milestone-${milestone.id}`}
                  className='flex items-start gap-3 rounded-lg border p-3'
                >
                  <Badge
                    variant='outline'
                    className='bg-green-100 text-green-600'
                  >
                    Milestone
                  </Badge>
                  <div className='flex-1 space-y-1'>
                    <p className='font-medium'>{milestone.title}</p>
                    {milestone.description && (
                      <p className='text-muted-foreground text-sm'>
                        {milestone.description}
                      </p>
                    )}
                    <div className='text-muted-foreground text-xs'>
                      Amount: ${milestone.amount}
                    </div>
                  </div>
                </div>
              ))}
              {getEventsForDay(selectedDate).length === 0 &&
                getMilestonesForDay(selectedDate).length === 0 && (
                  <p className='text-muted-foreground text-sm'>
                    No events scheduled for this day
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
