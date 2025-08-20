'use client'

import { useState } from 'react'

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api/http-client'
import { cn } from '@/lib/utils/cn'

interface MilestoneCalendarProps {
  freelancerId: number
}

interface Milestone {
  id: number
  title: string
  jobTitle: string
  dueDate: Date
  status: string
  amount: string
}

export function MilestoneCalendar({ freelancerId }: MilestoneCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const { data: milestonesData } = useSWR(
    `/api/freelancers/${freelancerId}/active-jobs?view=active`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.data.milestones : []
    }
  )

  const milestones: Milestone[] = milestonesData || []

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getMilestonesForDate = (date: Date) => {
    return milestones.filter(
      m => m.dueDate && isSameDay(new Date(m.dueDate), date)
    )
  }

  const milestonesForSelectedDate = selectedDate
    ? getMilestonesForDate(selectedDate)
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Milestone Calendar
          </span>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <span className='text-sm font-medium'>
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-7 gap-1'>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className='text-muted-foreground p-2 text-center text-xs font-medium'
            >
              {day}
            </div>
          ))}
          {monthDays.map(day => {
            const dayMilestones = getMilestonesForDate(day)
            const hasDeadline = dayMilestones.length > 0
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'hover:bg-accent relative h-10 rounded-md border p-1 text-sm transition-colors',
                  !isSameMonth(day, currentMonth) &&
                    'text-muted-foreground opacity-50',
                  isSelected && 'bg-primary text-primary-foreground',
                  isToday && !isSelected && 'border-primary',
                  hasDeadline &&
                    !isSelected &&
                    'bg-orange-50 dark:bg-orange-950/20'
                )}
              >
                <span>{format(day, 'd')}</span>
                {hasDeadline && (
                  <div className='absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange-500' />
                )}
              </button>
            )
          })}
        </div>

        {selectedDate && (
          <div className='mt-4 space-y-2 border-t pt-4'>
            <h4 className='text-sm font-medium'>
              {format(selectedDate, 'MMMM d, yyyy')}
            </h4>
            {milestonesForSelectedDate.length > 0 ? (
              milestonesForSelectedDate.map(milestone => (
                <div key={milestone.id} className='rounded-lg border p-3'>
                  <p className='font-medium'>{milestone.title}</p>
                  <p className='text-muted-foreground text-xs'>
                    {milestone.jobTitle}
                  </p>
                  <div className='mt-2 flex items-center justify-between'>
                    <Badge variant='outline' className='text-xs'>
                      ${milestone.amount}
                    </Badge>
                    <Badge
                      variant='outline'
                      className={cn(
                        'text-xs',
                        milestone.status === 'pending' && 'text-yellow-600',
                        milestone.status === 'in_progress' && 'text-blue-600',
                        milestone.status === 'submitted' && 'text-purple-600',
                        milestone.status === 'approved' && 'text-green-600'
                      )}
                    >
                      {milestone.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-muted-foreground text-sm'>
                No milestones due on this date
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
