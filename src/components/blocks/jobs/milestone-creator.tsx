'use client'

import { useState } from 'react'

import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Milestone {
  id?: number
  title: string
  description: string
  amount: string
  dueDate: Date | null
  order?: number
}

interface MilestoneCreatorProps {
  jobId: number
  existingMilestones?: Milestone[]
  onSave: (milestones: Milestone[]) => Promise<void>
  isLoading?: boolean
}

export function MilestoneCreator({
  jobId,
  existingMilestones = [],
  onSave,
  isLoading = false
}: MilestoneCreatorProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(
    existingMilestones.length > 0
      ? existingMilestones
      : [{ title: '', description: '', amount: '', dueDate: null }]
  )
  const [saving, setSaving] = useState(false)

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { title: '', description: '', amount: '', dueDate: null }
    ])
  }

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index))
    }
  }

  const updateMilestone = (
    index: number,
    field: keyof Milestone,
    value: any
  ) => {
    const updated = [...milestones]
    updated[index] = { ...updated[index], [field]: value }
    setMilestones(updated)
  }

  const calculateTotal = () => {
    return milestones.reduce((sum, m) => {
      const amount = parseFloat(m.amount || '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
  }

  const handleSave = async () => {
    // Validate milestones
    const hasErrors = milestones.some(
      m => !m.title || !m.description || !m.amount || !m.dueDate
    )

    if (hasErrors) {
      alert('Please fill in all milestone fields')
      return
    }

    setSaving(true)
    try {
      await onSave(milestones.map((m, index) => ({ ...m, order: index + 1 })))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Project Milestones</CardTitle>
          <CardDescription>
            Break down your project into milestones with clear deliverables and
            due dates
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {milestones.map((milestone, index) => (
            <Card key={index} className='relative'>
              <CardContent className='pt-6'>
                {milestones.length > 1 && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='absolute top-2 right-2'
                    onClick={() => removeMilestone(index)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                )}

                <div className='space-y-4'>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor={`title-${index}`}>
                        Milestone Title <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id={`title-${index}`}
                        placeholder='e.g., Design mockups completed'
                        value={milestone.title}
                        onChange={e =>
                          updateMilestone(index, 'title', e.target.value)
                        }
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor={`amount-${index}`}>
                        Amount (ETH) <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id={`amount-${index}`}
                        type='number'
                        step='0.001'
                        placeholder='0.00'
                        value={milestone.amount}
                        onChange={e =>
                          updateMilestone(index, 'amount', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor={`description-${index}`}>
                      Description <span className='text-red-500'>*</span>
                    </Label>
                    <Textarea
                      id={`description-${index}`}
                      placeholder='Describe what will be delivered in this milestone...'
                      value={milestone.description}
                      onChange={e =>
                        updateMilestone(index, 'description', e.target.value)
                      }
                      rows={3}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor={`due-${index}`}>
                      Due Date <span className='text-red-500'>*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id={`due-${index}`}
                          variant='outline'
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !milestone.dueDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {milestone.dueDate ? (
                            format(milestone.dueDate, 'PPP')
                          ) : (
                            <span>Pick a due date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={milestone.dueDate || undefined}
                          onSelect={date =>
                            updateMilestone(index, 'dueDate', date)
                          }
                          disabled={date => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className='text-muted-foreground text-sm'>
                    Milestone {index + 1} of {milestones.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type='button'
            variant='outline'
            className='w-full'
            onClick={addMilestone}
          >
            <Plus className='mr-2 h-4 w-4' />
            Add Another Milestone
          </Button>

          <div className='bg-muted rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Total Project Value</span>
              <span className='text-lg font-bold'>
                {calculateTotal().toFixed(3)} ETH
              </span>
            </div>
          </div>

          <Button
            className='w-full'
            onClick={handleSave}
            disabled={isLoading || saving}
          >
            {saving ? 'Saving Milestones...' : 'Save Milestones'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
