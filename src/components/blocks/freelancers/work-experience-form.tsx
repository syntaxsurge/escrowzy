'use client'

import { useState } from 'react'

import { Plus, X, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export interface WorkExperience {
  company: string
  position: string
  startMonth: string
  startYear: string
  endMonth?: string
  endYear?: string
  isCurrent: boolean
  description?: string
  skills?: number[]
}

interface WorkExperienceFormProps {
  experiences: WorkExperience[]
  onChange: (experiences: WorkExperience[]) => void
  maxExperiences?: number
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 50 }, (_, i) => currentYear - i)

export function WorkExperienceForm({
  experiences,
  onChange,
  maxExperiences = 10
}: WorkExperienceFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newExperience, setNewExperience] = useState<WorkExperience>({
    company: '',
    position: '',
    startMonth: 'January',
    startYear: String(currentYear),
    isCurrent: false,
    description: ''
  })

  const handleAdd = () => {
    if (newExperience.company && newExperience.position) {
      onChange([...experiences, newExperience])
      setNewExperience({
        company: '',
        position: '',
        startMonth: 'January',
        startYear: String(currentYear),
        isCurrent: false,
        description: ''
      })
      setIsAdding(false)
    }
  }

  const handleRemove = (index: number) => {
    onChange(experiences.filter((_, i) => i !== index))
  }

  const handleUpdate = (
    index: number,
    field: keyof WorkExperience,
    value: any
  ) => {
    onChange(
      experiences.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    )
  }

  const formatDuration = (exp: WorkExperience): string => {
    const start = `${exp.startMonth} ${exp.startYear}`
    const end = exp.isCurrent
      ? 'Present'
      : exp.endMonth && exp.endYear
        ? `${exp.endMonth} ${exp.endYear}`
        : ''
    return `${start} - ${end}`
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-base'>Work Experience</Label>
        {experiences.length < maxExperiences && !isAdding && (
          <Button variant='outline' size='sm' onClick={() => setIsAdding(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Add Experience
          </Button>
        )}
      </div>

      {/* Existing Experiences */}
      {experiences.map((exp, index) => (
        <Card key={index}>
          <CardContent className='pt-6'>
            <div className='space-y-4'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h4 className='font-semibold'>{exp.position}</h4>
                  <p className='text-muted-foreground text-sm'>{exp.company}</p>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    <Calendar className='mr-1 inline h-3 w-3' />
                    {formatDuration(exp)}
                  </p>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleRemove(index)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>

              {exp.description && <p className='text-sm'>{exp.description}</p>}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add New Experience Form */}
      {isAdding && (
        <Card>
          <CardContent className='space-y-4 pt-6'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='company'>Company</Label>
                <Input
                  id='company'
                  value={newExperience.company}
                  onChange={e =>
                    setNewExperience({
                      ...newExperience,
                      company: e.target.value
                    })
                  }
                  placeholder='Company name'
                />
              </div>
              <div>
                <Label htmlFor='position'>Position</Label>
                <Input
                  id='position'
                  value={newExperience.position}
                  onChange={e =>
                    setNewExperience({
                      ...newExperience,
                      position: e.target.value
                    })
                  }
                  placeholder='Your role'
                />
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <Switch
                  id='current'
                  checked={newExperience.isCurrent}
                  onCheckedChange={checked =>
                    setNewExperience({ ...newExperience, isCurrent: checked })
                  }
                />
                <Label htmlFor='current'>I currently work here</Label>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label>Start Date</Label>
                  <div className='grid grid-cols-2 gap-2'>
                    <Select
                      value={newExperience.startMonth}
                      onValueChange={value =>
                        setNewExperience({
                          ...newExperience,
                          startMonth: value
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(month => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={newExperience.startYear}
                      onValueChange={value =>
                        setNewExperience({ ...newExperience, startYear: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map(year => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!newExperience.isCurrent && (
                  <div>
                    <Label>End Date</Label>
                    <div className='grid grid-cols-2 gap-2'>
                      <Select
                        value={newExperience.endMonth || 'January'}
                        onValueChange={value =>
                          setNewExperience({
                            ...newExperience,
                            endMonth: value
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(month => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={newExperience.endYear || String(currentYear)}
                        onValueChange={value =>
                          setNewExperience({ ...newExperience, endYear: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map(year => (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor='description'>Description (Optional)</Label>
                <Textarea
                  id='description'
                  value={newExperience.description}
                  onChange={e =>
                    setNewExperience({
                      ...newExperience,
                      description: e.target.value
                    })
                  }
                  placeholder='Describe your responsibilities and achievements'
                  rows={3}
                />
              </div>
            </div>

            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setIsAdding(false)
                  setNewExperience({
                    company: '',
                    position: '',
                    startMonth: 'January',
                    startYear: String(currentYear),
                    isCurrent: false,
                    description: ''
                  })
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add Experience</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
