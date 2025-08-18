'use client'

import { useState } from 'react'

import { X, Search, ChevronDown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Skill {
  id: number
  name: string
  categoryId: number | null
  icon: string | null
  category?: {
    id: number
    name: string
    icon: string | null
  }
}

interface SelectedSkill {
  skillId: number
  yearsOfExperience?: number
  skillLevel?: 'beginner' | 'intermediate' | 'expert'
}

interface SkillSelectorProps {
  skills: Skill[]
  selectedSkills: SelectedSkill[]
  onChange: (skills: SelectedSkill[]) => void
  maxSkills?: number
  showExperience?: boolean
  showLevel?: boolean
}

export function SkillSelector({
  skills,
  selectedSkills,
  onChange,
  maxSkills = 20,
  showExperience = true,
  showLevel = true
}: SkillSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Group skills by category
  const skillsByCategory = skills.reduce(
    (acc, skill) => {
      const categoryName = skill.category?.name || 'Other'
      const categoryId = skill.category?.id || 0
      if (!acc[categoryId]) {
        acc[categoryId] = {
          name: categoryName,
          icon: skill.category?.icon || null,
          skills: []
        }
      }
      acc[categoryId].skills.push(skill)
      return acc
    },
    {} as Record<number, { name: string; icon: string | null; skills: Skill[] }>
  )

  // Filter skills based on search and category
  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesCategory =
      !selectedCategory || skill.categoryId === selectedCategory
    const notSelected = !selectedSkills.find(s => s.skillId === skill.id)
    return matchesSearch && matchesCategory && notSelected
  })

  const handleAddSkill = (skill: Skill) => {
    if (selectedSkills.length >= maxSkills) {
      return
    }

    const newSkill: SelectedSkill = {
      skillId: skill.id,
      yearsOfExperience: 0,
      skillLevel: 'intermediate'
    }

    onChange([...selectedSkills, newSkill])
    setSearchQuery('')
  }

  const handleRemoveSkill = (skillId: number) => {
    onChange(selectedSkills.filter(s => s.skillId !== skillId))
  }

  const handleUpdateSkill = (
    skillId: number,
    field: 'yearsOfExperience' | 'skillLevel',
    value: number | string
  ) => {
    onChange(
      selectedSkills.map(s =>
        s.skillId === skillId ? { ...s, [field]: value } : s
      )
    )
  }

  const getSkillById = (skillId: number) => {
    return skills.find(s => s.id === skillId)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label>Skills</Label>
        <span className='text-muted-foreground text-sm'>
          {selectedSkills.length}/{maxSkills}
        </span>
      </div>

      {/* Selected Skills */}
      {selectedSkills.length > 0 && (
        <div className='space-y-3 rounded-lg border p-4'>
          {selectedSkills.map(selectedSkill => {
            const skill = getSkillById(selectedSkill.skillId)
            if (!skill) return null

            return (
              <div key={selectedSkill.skillId} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {skill.icon && <span>{skill.icon}</span>}
                    <span className='font-medium'>{skill.name}</span>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRemoveSkill(selectedSkill.skillId)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>

                <div className='grid grid-cols-2 gap-2 pl-6'>
                  {showLevel && (
                    <Select
                      value={selectedSkill.skillLevel || 'intermediate'}
                      onValueChange={value =>
                        handleUpdateSkill(
                          selectedSkill.skillId,
                          'skillLevel',
                          value
                        )
                      }
                    >
                      <SelectTrigger className='h-8'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='beginner'>Beginner</SelectItem>
                        <SelectItem value='intermediate'>
                          Intermediate
                        </SelectItem>
                        <SelectItem value='expert'>Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {showExperience && (
                    <Select
                      value={String(selectedSkill.yearsOfExperience || 0)}
                      onValueChange={value =>
                        handleUpdateSkill(
                          selectedSkill.skillId,
                          'yearsOfExperience',
                          parseInt(value)
                        )
                      }
                    >
                      <SelectTrigger className='h-8'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='0'>{'< 1 year'}</SelectItem>
                        <SelectItem value='1'>1 year</SelectItem>
                        <SelectItem value='2'>2 years</SelectItem>
                        <SelectItem value='3'>3 years</SelectItem>
                        <SelectItem value='5'>5+ years</SelectItem>
                        <SelectItem value='10'>10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Skills Button */}
      {selectedSkills.length < maxSkills && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant='outline' className='w-full'>
              Add Skills
              <ChevronDown className='ml-2 h-4 w-4' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-96 p-0' align='start'>
            <div className='border-b p-4'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder='Search skills...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-9'
                />
              </div>
            </div>

            <Tabs defaultValue='all' className='w-full'>
              <div className='overflow-x-auto'>
                <TabsList className='inline-flex h-9 w-max'>
                  <TabsTrigger
                    value='all'
                    onClick={() => setSelectedCategory(null)}
                    className='whitespace-nowrap'
                  >
                    All
                  </TabsTrigger>
                  {Object.entries(skillsByCategory).map(([id, category]) => (
                    <TabsTrigger
                      key={id}
                      value={id}
                      onClick={() => setSelectedCategory(parseInt(id))}
                      className='whitespace-nowrap'
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <ScrollArea className='h-64'>
                <div className='p-2'>
                  {filteredSkills.length === 0 ? (
                    <p className='text-muted-foreground py-4 text-center'>
                      No skills found
                    </p>
                  ) : (
                    <div className='space-y-1'>
                      {filteredSkills.map(skill => (
                        <Button
                          key={skill.id}
                          variant='ghost'
                          className='w-full justify-start'
                          onClick={() => {
                            handleAddSkill(skill)
                            if (selectedSkills.length + 1 >= maxSkills) {
                              setIsOpen(false)
                            }
                          }}
                        >
                          {skill.icon && (
                            <span className='mr-2'>{skill.icon}</span>
                          )}
                          {skill.name}
                          {skill.category && (
                            <Badge variant='outline' className='ml-auto'>
                              {skill.category.name}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Tabs>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
