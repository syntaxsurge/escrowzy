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
import { Textarea } from '@/components/ui/textarea'

export interface Education {
  institution: string
  degree: string
  fieldOfStudy: string
  startYear: string
  endYear?: string
  description?: string
}

interface EducationFormProps {
  educations: Education[]
  onChange: (educations: Education[]) => void
  maxEducations?: number
}

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 50 }, (_, i) => currentYear + 10 - i)

const DEGREE_TYPES = [
  'High School Diploma',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctoral Degree',
  'Professional Certificate',
  'Bootcamp Certificate',
  'Online Course Certificate',
  'Other'
]

export function EducationForm({
  educations,
  onChange,
  maxEducations = 10
}: EducationFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newEducation, setNewEducation] = useState<Education>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startYear: String(currentYear),
    description: ''
  })

  const handleAdd = () => {
    if (
      newEducation.institution &&
      newEducation.degree &&
      newEducation.fieldOfStudy
    ) {
      onChange([...educations, newEducation])
      setNewEducation({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startYear: String(currentYear),
        description: ''
      })
      setIsAdding(false)
    }
  }

  const handleRemove = (index: number) => {
    onChange(educations.filter((_, i) => i !== index))
  }

  const formatDuration = (edu: Education): string => {
    return edu.endYear
      ? `${edu.startYear} - ${edu.endYear}`
      : `${edu.startYear} - Present`
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-base'>Education</Label>
        {educations.length < maxEducations && !isAdding && (
          <Button variant='outline' size='sm' onClick={() => setIsAdding(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Add Education
          </Button>
        )}
      </div>

      {/* Existing Education */}
      {educations.map((edu, index) => (
        <Card key={index}>
          <CardContent className='pt-6'>
            <div className='space-y-2'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h4 className='font-semibold'>{edu.degree}</h4>
                  <p className='text-muted-foreground text-sm'>
                    {edu.fieldOfStudy} • {edu.institution}
                  </p>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    <Calendar className='mr-1 inline h-3 w-3' />
                    {formatDuration(edu)}
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

              {edu.description && <p className='text-sm'>{edu.description}</p>}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add New Education Form */}
      {isAdding && (
        <Card>
          <CardContent className='space-y-4 pt-6'>
            <div>
              <Label htmlFor='institution'>Institution</Label>
              <Input
                id='institution'
                value={newEducation.institution}
                onChange={e =>
                  setNewEducation({
                    ...newEducation,
                    institution: e.target.value
                  })
                }
                placeholder='University or school name'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='degree'>Degree</Label>
                <Select
                  value={newEducation.degree}
                  onValueChange={value =>
                    setNewEducation({ ...newEducation, degree: value })
                  }
                >
                  <SelectTrigger id='degree'>
                    <SelectValue placeholder='Select degree type' />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREE_TYPES.map(degree => (
                      <SelectItem key={degree} value={degree}>
                        {degree}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='fieldOfStudy'>Field of Study</Label>
                <Input
                  id='fieldOfStudy'
                  value={newEducation.fieldOfStudy}
                  onChange={e =>
                    setNewEducation({
                      ...newEducation,
                      fieldOfStudy: e.target.value
                    })
                  }
                  placeholder='e.g., Computer Science'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='startYear'>Start Year</Label>
                <Select
                  value={newEducation.startYear}
                  onValueChange={value =>
                    setNewEducation({ ...newEducation, startYear: value })
                  }
                >
                  <SelectTrigger id='startYear'>
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
              <div>
                <Label htmlFor='endYear'>End Year (Optional)</Label>
                <Select
                  value={newEducation.endYear || ''}
                  onValueChange={value =>
                    setNewEducation({
                      ...newEducation,
                      endYear: value ? value : undefined
                    })
                  }
                >
                  <SelectTrigger id='endYear'>
                    <SelectValue placeholder='Select year or leave empty' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>Still attending</SelectItem>
                    {YEARS.map(year => (
                      <SelectItem
                        key={year}
                        value={String(year)}
                        disabled={parseInt(newEducation.startYear) > year}
                      >
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor='description'>Description (Optional)</Label>
              <Textarea
                id='description'
                value={newEducation.description}
                onChange={e =>
                  setNewEducation({
                    ...newEducation,
                    description: e.target.value
                  })
                }
                placeholder='Achievements, activities, relevant coursework'
                rows={3}
              />
            </div>

            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setIsAdding(false)
                  setNewEducation({
                    institution: '',
                    degree: '',
                    fieldOfStudy: '',
                    startYear: String(currentYear),
                    description: ''
                  })
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add Education</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
