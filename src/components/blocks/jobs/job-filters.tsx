'use client'

import { useState, useEffect } from 'react'

import { Filter, X, DollarSign, Tag, Search } from 'lucide-react'

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
import { cn } from '@/lib'

export interface JobFilterValues {
  search?: string
  categoryId?: number
  budgetMin?: number
  budgetMax?: number
  budgetType?: 'fixed' | 'hourly' | 'all'
  experienceLevel?: string
  projectDuration?: string
  skills?: string[]
  sortBy?: 'newest' | 'budget_high' | 'budget_low' | 'deadline'
}

interface JobFiltersProps {
  filters: JobFilterValues
  categories: Array<{
    id: number
    name: string
    icon?: string
    jobCount?: number
    subCategories?: Array<{
      id: number
      name: string
      jobCount?: number
    }>
  }>
  availableSkills?: string[]
  onFiltersChange: (filters: JobFilterValues) => void
  className?: string
  showCompact?: boolean
}

export function JobFilters({
  filters,
  categories,
  availableSkills = [],
  onFiltersChange,
  className,
  showCompact = false
}: JobFiltersProps) {
  const [localFilters, setLocalFilters] = useState<JobFilterValues>(filters)
  const [skillSearch, setSkillSearch] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    filters.skills || []
  )
  const [budgetRange, setBudgetRange] = useState([
    filters.budgetMin || 0,
    filters.budgetMax || 10000
  ])

  useEffect(() => {
    setLocalFilters(filters)
    setSelectedSkills(filters.skills || [])
    setBudgetRange([filters.budgetMin || 0, filters.budgetMax || 10000])
  }, [filters])

  const handleFilterChange = (key: keyof JobFilterValues, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleSkillToggle = (skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill]

    setSelectedSkills(newSkills)
    handleFilterChange('skills', newSkills)
  }

  const handleBudgetChange = (values: number[]) => {
    setBudgetRange(values)
    handleFilterChange('budgetMin', values[0])
    handleFilterChange('budgetMax', values[1])
  }

  const clearFilters = () => {
    const clearedFilters: JobFilterValues = {
      sortBy: 'newest'
    }
    setLocalFilters(clearedFilters)
    setSelectedSkills([])
    setBudgetRange([0, 10000])
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = () => {
    return !!(
      localFilters.search ||
      localFilters.categoryId ||
      localFilters.budgetMin ||
      localFilters.budgetMax ||
      localFilters.experienceLevel ||
      localFilters.projectDuration ||
      (localFilters.skills && localFilters.skills.length > 0)
    )
  }

  const filteredSkills = availableSkills.filter(
    skill =>
      skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !selectedSkills.includes(skill)
  )

  if (showCompact) {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <Select
          value={localFilters.categoryId?.toString() || 'all'}
          onValueChange={value =>
            handleFilterChange(
              'categoryId',
              value === 'all' ? undefined : parseInt(value)
            )
          }
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='All Categories' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.icon} {category.name}
                {category.jobCount !== undefined && ` (${category.jobCount})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={localFilters.experienceLevel || 'all'}
          onValueChange={value =>
            handleFilterChange(
              'experienceLevel',
              value === 'all' ? undefined : value
            )
          }
        >
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Experience' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Levels</SelectItem>
            <SelectItem value='entry'>Entry Level</SelectItem>
            <SelectItem value='intermediate'>Intermediate</SelectItem>
            <SelectItem value='expert'>Expert</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={localFilters.sortBy || 'newest'}
          onValueChange={value => handleFilterChange('sortBy', value)}
        >
          <SelectTrigger className='w-[150px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>Newest First</SelectItem>
            <SelectItem value='budget_high'>Highest Budget</SelectItem>
            <SelectItem value='budget_low'>Lowest Budget</SelectItem>
            <SelectItem value='deadline'>Deadline Soon</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters() && (
          <Button variant='ghost' size='sm' onClick={clearFilters}>
            <X className='mr-1 h-4 w-4' />
            Clear
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filters
          </span>
          {hasActiveFilters() && (
            <Button variant='ghost' size='sm' onClick={clearFilters}>
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Search */}
        <div className='space-y-2'>
          <Label>Search</Label>
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
            <Input
              placeholder='Search jobs...'
              value={localFilters.search || ''}
              onChange={e => handleFilterChange('search', e.target.value)}
              className='pl-9'
            />
          </div>
        </div>

        {/* Category */}
        <div className='space-y-2'>
          <Label>Category</Label>
          <Select
            value={localFilters.categoryId?.toString() || 'all'}
            onValueChange={value =>
              handleFilterChange(
                'categoryId',
                value === 'all' ? undefined : parseInt(value)
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder='All Categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              {categories.map(category => (
                <div key={category.id}>
                  <SelectItem value={category.id.toString()}>
                    <span className='font-medium'>
                      {category.icon} {category.name}
                      {category.jobCount !== undefined &&
                        ` (${category.jobCount})`}
                    </span>
                  </SelectItem>
                  {category.subCategories?.map(sub => (
                    <SelectItem
                      key={sub.id}
                      value={sub.id.toString()}
                      className='pl-8'
                    >
                      {sub.name}
                      {sub.jobCount !== undefined && ` (${sub.jobCount})`}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Budget Type */}
        <div className='space-y-2'>
          <Label>Budget Type</Label>
          <RadioGroup
            value={localFilters.budgetType || 'all'}
            onValueChange={value =>
              handleFilterChange(
                'budgetType',
                value === 'all' ? undefined : value
              )
            }
          >
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='all' id='all' />
              <Label htmlFor='all'>All Types</Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='fixed' id='fixed' />
              <Label htmlFor='fixed'>Fixed Price</Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='hourly' id='hourly' />
              <Label htmlFor='hourly'>Hourly Rate</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Budget Range */}
        <div className='space-y-2'>
          <Label>Budget Range</Label>
          <div className='space-y-3'>
            <Slider
              value={budgetRange}
              onValueChange={handleBudgetChange}
              min={0}
              max={10000}
              step={100}
              className='w-full'
            />
            <div className='flex items-center justify-between text-sm'>
              <span className='flex items-center gap-1'>
                <DollarSign className='h-3 w-3' />
                {budgetRange[0]}
              </span>
              <span className='flex items-center gap-1'>
                <DollarSign className='h-3 w-3' />
                {budgetRange[1] === 10000 ? '10,000+' : budgetRange[1]}
              </span>
            </div>
          </div>
        </div>

        {/* Experience Level */}
        <div className='space-y-2'>
          <Label>Experience Level</Label>
          <Select
            value={localFilters.experienceLevel || 'all'}
            onValueChange={value =>
              handleFilterChange(
                'experienceLevel',
                value === 'all' ? undefined : value
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder='All Levels' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Levels</SelectItem>
              <SelectItem value='entry'>
                <div>
                  <div className='font-medium'>Entry Level</div>
                  <div className='text-muted-foreground text-xs'>
                    Looking for beginners
                  </div>
                </div>
              </SelectItem>
              <SelectItem value='intermediate'>
                <div>
                  <div className='font-medium'>Intermediate</div>
                  <div className='text-muted-foreground text-xs'>
                    Some experience required
                  </div>
                </div>
              </SelectItem>
              <SelectItem value='expert'>
                <div>
                  <div className='font-medium'>Expert</div>
                  <div className='text-muted-foreground text-xs'>
                    Extensive experience needed
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Project Duration */}
        <div className='space-y-2'>
          <Label>Project Duration</Label>
          <Select
            value={localFilters.projectDuration || 'all'}
            onValueChange={value =>
              handleFilterChange(
                'projectDuration',
                value === 'all' ? undefined : value
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder='Any Duration' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Any Duration</SelectItem>
              <SelectItem value='less_than_week'>Less than a week</SelectItem>
              <SelectItem value='1_2_weeks'>1-2 weeks</SelectItem>
              <SelectItem value='2_4_weeks'>2-4 weeks</SelectItem>
              <SelectItem value='1_3_months'>1-3 months</SelectItem>
              <SelectItem value='3_6_months'>3-6 months</SelectItem>
              <SelectItem value='more_than_6_months'>
                More than 6 months
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Skills */}
        {availableSkills.length > 0 && (
          <div className='space-y-2'>
            <Label>Required Skills</Label>
            <Input
              placeholder='Search skills...'
              value={skillSearch}
              onChange={e => setSkillSearch(e.target.value)}
            />

            {selectedSkills.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-2'>
                {selectedSkills.map(skill => (
                  <Badge
                    key={skill}
                    variant='secondary'
                    className='cursor-pointer'
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                    <X className='ml-1 h-3 w-3' />
                  </Badge>
                ))}
              </div>
            )}

            {skillSearch && filteredSkills.length > 0 && (
              <div className='mt-2 rounded-md border p-2'>
                <p className='text-muted-foreground mb-2 text-xs'>
                  Available skills:
                </p>
                <div className='flex flex-wrap gap-1'>
                  {filteredSkills.slice(0, 10).map(skill => (
                    <Badge
                      key={skill}
                      variant='outline'
                      className='hover:bg-accent cursor-pointer'
                      onClick={() => handleSkillToggle(skill)}
                    >
                      <Tag className='mr-1 h-3 w-3' />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
