'use client'

import { useState, useEffect } from 'react'

import {
  Filter,
  X,
  DollarSign,
  Star,
  Clock,
  Shield,
  Languages,
  Briefcase
} from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

export interface FreelancerFilterValues {
  search?: string
  skills?: number[]
  minRate?: number
  maxRate?: number
  experienceLevel?: 'entry' | 'intermediate' | 'expert'
  availability?: 'available' | 'busy' | 'away'
  languages?: string[]
  minRating?: number
  verified?: boolean
  sortBy?: 'newest' | 'rating' | 'price_low' | 'price_high' | 'experience'
}

interface FreelancerFiltersProps {
  filters: FreelancerFilterValues
  onChange: (filters: FreelancerFilterValues) => void
  skills?: { id: number; name: string }[]
  languages?: string[]
  displayMode?: 'sidebar' | 'compact'
  onClose?: () => void
}

export function FreelancerFilters({
  filters,
  onChange,
  skills = [],
  languages = [],
  displayMode = 'sidebar',
  onClose
}: FreelancerFiltersProps) {
  const [localFilters, setLocalFilters] =
    useState<FreelancerFilterValues>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (
    key: keyof FreelancerFilterValues,
    value: any
  ) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onChange(newFilters)
  }

  const handleRateChange = (values: number[]) => {
    handleFilterChange('minRate', values[0])
    handleFilterChange('maxRate', values[1])
  }

  const handleSkillToggle = (skillId: number) => {
    const currentSkills = localFilters.skills || []
    const newSkills = currentSkills.includes(skillId)
      ? currentSkills.filter(id => id !== skillId)
      : [...currentSkills, skillId]
    handleFilterChange('skills', newSkills)
  }

  const handleLanguageToggle = (language: string) => {
    const currentLanguages = localFilters.languages || []
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(l => l !== language)
      : [...currentLanguages, language]
    handleFilterChange('languages', newLanguages)
  }

  const handleClearFilters = () => {
    const clearedFilters: FreelancerFilterValues = { sortBy: 'newest' }
    setLocalFilters(clearedFilters)
    onChange(clearedFilters)
  }

  const activeFilterCount = Object.entries(localFilters).filter(
    ([key, value]) => key !== 'sortBy' && value !== undefined && value !== ''
  ).length

  if (displayMode === 'compact') {
    return (
      <div className='flex flex-wrap gap-2'>
        <Select
          value={localFilters.sortBy || 'newest'}
          onValueChange={value => handleFilterChange('sortBy', value)}
        >
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>Newest</SelectItem>
            <SelectItem value='rating'>Highest Rated</SelectItem>
            <SelectItem value='price_low'>Lowest Price</SelectItem>
            <SelectItem value='price_high'>Highest Price</SelectItem>
            <SelectItem value='experience'>Most Experienced</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={localFilters.availability || ''}
          onValueChange={value =>
            handleFilterChange('availability', value || undefined)
          }
        >
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='Availability' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=''>All</SelectItem>
            <SelectItem value='available'>Available</SelectItem>
            <SelectItem value='busy'>Busy</SelectItem>
            <SelectItem value='away'>Away</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={localFilters.experienceLevel || ''}
          onValueChange={value =>
            handleFilterChange('experienceLevel', value || undefined)
          }
        >
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='Experience' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=''>All Levels</SelectItem>
            <SelectItem value='entry'>Entry Level</SelectItem>
            <SelectItem value='intermediate'>Intermediate</SelectItem>
            <SelectItem value='expert'>Expert</SelectItem>
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button variant='outline' size='sm' onClick={handleClearFilters}>
            Clear Filters ({activeFilterCount})
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filters
          </CardTitle>
          <div className='flex items-center gap-2'>
            {activeFilterCount > 0 && (
              <Badge variant='secondary'>{activeFilterCount}</Badge>
            )}
            {onClose && (
              <Button variant='ghost' size='sm' onClick={onClose}>
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Sort By */}
        <div className='space-y-2'>
          <Label>Sort By</Label>
          <Select
            value={localFilters.sortBy || 'newest'}
            onValueChange={value => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='newest'>Newest</SelectItem>
              <SelectItem value='rating'>Highest Rated</SelectItem>
              <SelectItem value='price_low'>Lowest Price</SelectItem>
              <SelectItem value='price_high'>Highest Price</SelectItem>
              <SelectItem value='experience'>Most Experienced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Accordion type='single' collapsible defaultValue='availability'>
          {/* Availability */}
          <AccordionItem value='availability'>
            <AccordionTrigger>
              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4' />
                Availability
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={localFilters.availability || 'all'}
                onValueChange={value =>
                  handleFilterChange(
                    'availability',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='all' id='all' />
                  <Label htmlFor='all'>All</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='available' id='available' />
                  <Label htmlFor='available'>Available Now</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='busy' id='busy' />
                  <Label htmlFor='busy'>Busy</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='away' id='away' />
                  <Label htmlFor='away'>Away</Label>
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>

          {/* Hourly Rate */}
          <AccordionItem value='rate'>
            <AccordionTrigger>
              <div className='flex items-center gap-2'>
                <DollarSign className='h-4 w-4' />
                Hourly Rate
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between text-sm'>
                  <span>${localFilters.minRate || 0}</span>
                  <span>${localFilters.maxRate || 500}</span>
                </div>
                <Slider
                  min={0}
                  max={500}
                  step={10}
                  value={[
                    localFilters.minRate || 0,
                    localFilters.maxRate || 500
                  ]}
                  onValueChange={handleRateChange}
                  className='w-full'
                />
                <div className='grid grid-cols-2 gap-2'>
                  <Input
                    type='number'
                    placeholder='Min'
                    value={localFilters.minRate || ''}
                    onChange={e =>
                      handleFilterChange(
                        'minRate',
                        parseInt(e.target.value) || undefined
                      )
                    }
                  />
                  <Input
                    type='number'
                    placeholder='Max'
                    value={localFilters.maxRate || ''}
                    onChange={e =>
                      handleFilterChange(
                        'maxRate',
                        parseInt(e.target.value) || undefined
                      )
                    }
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Experience Level */}
          <AccordionItem value='experience'>
            <AccordionTrigger>
              <div className='flex items-center gap-2'>
                <Briefcase className='h-4 w-4' />
                Experience Level
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={localFilters.experienceLevel || 'all'}
                onValueChange={value =>
                  handleFilterChange(
                    'experienceLevel',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='all' id='exp-all' />
                  <Label htmlFor='exp-all'>All Levels</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='entry' id='exp-entry' />
                  <Label htmlFor='exp-entry'>Entry Level (0-2 years)</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='intermediate' id='exp-intermediate' />
                  <Label htmlFor='exp-intermediate'>
                    Intermediate (3-5 years)
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='expert' id='exp-expert' />
                  <Label htmlFor='exp-expert'>Expert (6+ years)</Label>
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>

          {/* Rating */}
          <AccordionItem value='rating'>
            <AccordionTrigger>
              <div className='flex items-center gap-2'>
                <Star className='h-4 w-4' />
                Minimum Rating
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={String(localFilters.minRating || 0)}
                onValueChange={value =>
                  handleFilterChange(
                    'minRating',
                    value === '0' ? undefined : parseFloat(value)
                  )
                }
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='0' id='rating-all' />
                  <Label htmlFor='rating-all'>Any Rating</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='4.5' id='rating-45' />
                  <Label htmlFor='rating-45'>4.5+ stars</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='4' id='rating-4' />
                  <Label htmlFor='rating-4'>4+ stars</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='3.5' id='rating-35' />
                  <Label htmlFor='rating-35'>3.5+ stars</Label>
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>

          {/* Skills */}
          {skills.length > 0 && (
            <AccordionItem value='skills'>
              <AccordionTrigger>
                <div className='flex items-center gap-2'>
                  Skills
                  {(localFilters.skills?.length || 0) > 0 && (
                    <Badge variant='secondary' className='ml-1'>
                      {localFilters.skills?.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className='max-h-60 space-y-2 overflow-y-auto'>
                  {skills.map(skill => (
                    <div key={skill.id} className='flex items-center space-x-2'>
                      <Switch
                        id={`skill-${skill.id}`}
                        checked={
                          localFilters.skills?.includes(skill.id) || false
                        }
                        onCheckedChange={() => handleSkillToggle(skill.id)}
                      />
                      <Label
                        htmlFor={`skill-${skill.id}`}
                        className='cursor-pointer'
                      >
                        {skill.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <AccordionItem value='languages'>
              <AccordionTrigger>
                <div className='flex items-center gap-2'>
                  <Languages className='h-4 w-4' />
                  Languages
                  {(localFilters.languages?.length || 0) > 0 && (
                    <Badge variant='secondary' className='ml-1'>
                      {localFilters.languages?.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className='max-h-60 space-y-2 overflow-y-auto'>
                  {languages.map(language => (
                    <div key={language} className='flex items-center space-x-2'>
                      <Switch
                        id={`lang-${language}`}
                        checked={
                          localFilters.languages?.includes(language) || false
                        }
                        onCheckedChange={() => handleLanguageToggle(language)}
                      />
                      <Label
                        htmlFor={`lang-${language}`}
                        className='cursor-pointer'
                      >
                        {language}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Verified Only */}
        <div className='flex items-center justify-between'>
          <Label
            htmlFor='verified'
            className='flex cursor-pointer items-center gap-2'
          >
            <Shield className='h-4 w-4' />
            Verified Only
          </Label>
          <Switch
            id='verified'
            checked={localFilters.verified || false}
            onCheckedChange={checked =>
              handleFilterChange('verified', checked || undefined)
            }
          />
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant='outline'
            className='w-full'
            onClick={handleClearFilters}
          >
            Clear All Filters
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
