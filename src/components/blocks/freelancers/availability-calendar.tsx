'use client'

import { useState } from 'react'

import { Clock, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface DaySchedule {
  available: boolean
  startTime?: string
  endTime?: string
}

interface WeeklySchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

interface AvailabilityCalendarProps {
  schedule: WeeklySchedule
  onChange: (schedule: WeeklySchedule) => void
  timezone: string
  onTimezoneChange: (timezone: string) => void
}

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const

const TIME_SLOTS = [
  '00:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00'
]

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Australia/Sydney'
]

export function AvailabilityCalendar({
  schedule,
  onChange,
  timezone,
  onTimezoneChange
}: AvailabilityCalendarProps) {
  const [bulkEdit, setBulkEdit] = useState(false)

  const handleDayToggle = (day: keyof WeeklySchedule) => {
    const newSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        available: !schedule[day].available,
        startTime: schedule[day].available ? undefined : '09:00',
        endTime: schedule[day].available ? undefined : '17:00'
      }
    }
    onChange(newSchedule)
  }

  const handleTimeChange = (
    day: keyof WeeklySchedule,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const newSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        [field]: value
      }
    }
    onChange(newSchedule)
  }

  const handleApplyToAll = () => {
    const mondaySchedule = schedule.monday
    const newSchedule = DAYS.reduce((acc, day) => {
      acc[day] = { ...mondaySchedule }
      return acc
    }, {} as WeeklySchedule)
    onChange(newSchedule)
  }

  const handleSetBusinessHours = () => {
    const businessHours: DaySchedule = {
      available: true,
      startTime: '09:00',
      endTime: '17:00'
    }
    const newSchedule = DAYS.reduce((acc, day) => {
      if (day === 'saturday' || day === 'sunday') {
        acc[day] = { available: false }
      } else {
        acc[day] = businessHours
      }
      return acc
    }, {} as WeeklySchedule)
    onChange(newSchedule)
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Availability Schedule
          </CardTitle>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleSetBusinessHours}
            >
              Set Business Hours
            </Button>
            <Button variant='outline' size='sm' onClick={handleApplyToAll}>
              Apply Monday to All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Timezone Selection */}
        <div>
          <Label htmlFor='timezone'>Timezone</Label>
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger id='timezone'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weekly Schedule */}
        <div className='space-y-3'>
          {DAYS.map(day => {
            const daySchedule = schedule[day]
            const dayLabel = day.charAt(0).toUpperCase() + day.slice(1)

            return (
              <div key={day} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label className='text-base font-medium'>{dayLabel}</Label>
                  <Switch
                    checked={daySchedule.available}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                </div>

                {daySchedule.available && (
                  <div className='grid grid-cols-2 gap-2 pl-4'>
                    <div>
                      <Label htmlFor={`${day}-start`} className='text-xs'>
                        Start Time
                      </Label>
                      <Select
                        value={daySchedule.startTime}
                        onValueChange={value =>
                          handleTimeChange(day, 'startTime', value)
                        }
                      >
                        <SelectTrigger id={`${day}-start`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(time => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`${day}-end`} className='text-xs'>
                        End Time
                      </Label>
                      <Select
                        value={daySchedule.endTime}
                        onValueChange={value =>
                          handleTimeChange(day, 'endTime', value)
                        }
                      >
                        <SelectTrigger id={`${day}-end`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(time => (
                            <SelectItem
                              key={time}
                              value={time}
                              disabled={
                                !!(
                                  daySchedule.startTime &&
                                  time <= daySchedule.startTime
                                )
                              }
                            >
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className='border-t pt-4'>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <Clock className='h-4 w-4' />
            <span>
              Available {DAYS.filter(day => schedule[day].available).length}{' '}
              days per week
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
