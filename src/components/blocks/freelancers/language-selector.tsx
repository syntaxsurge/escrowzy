'use client'

import { useState, useMemo } from 'react'

import { X, Languages } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { getLanguages, getPopularLanguages } from '@/lib/utils/localization'

export interface Language {
  language: string
  level: 'basic' | 'conversational' | 'fluent' | 'native'
}

interface LanguageSelectorProps {
  languages: Language[]
  onChange: (languages: Language[]) => void
  maxLanguages?: number
}

const PROFICIENCY_LEVELS = [
  { value: 'basic', label: 'Basic' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'native', label: 'Native/Bilingual' }
]

export function LanguageSelector({
  languages,
  onChange,
  maxLanguages = 10
}: LanguageSelectorProps) {
  const [newLanguage, setNewLanguage] = useState<string>('')
  const [newLevel, setNewLevel] = useState<Language['level']>('conversational')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const allLanguages = useMemo(() => getLanguages(), [])
  const popularLanguages = useMemo(() => getPopularLanguages(), [])

  // Filter out already selected languages
  const availableLanguages = useMemo(() => {
    return allLanguages.filter(
      lang => !languages.find(l => l.language === lang.name)
    )
  }, [allLanguages, languages])

  const availablePopular = useMemo(() => {
    return popularLanguages.filter(
      lang => !languages.find(l => l.language === lang.name)
    )
  }, [popularLanguages, languages])

  // Filter languages based on search
  const filteredLanguages = useMemo(() => {
    if (!search) return availableLanguages

    const searchLower = search.toLowerCase()
    return availableLanguages.filter(
      lang =>
        lang.name.toLowerCase().includes(searchLower) ||
        lang.code.toLowerCase().includes(searchLower)
    )
  }, [search, availableLanguages])

  const handleAddLanguage = (languageName: string) => {
    if (languages.length >= maxLanguages) {
      return
    }

    onChange([...languages, { language: languageName, level: newLevel }])
    setNewLanguage('')
    setNewLevel('conversational')
    setOpen(false)
    setSearch('')
  }

  const handleRemoveLanguage = (index: number) => {
    onChange(languages.filter((_, i) => i !== index))
  }

  const handleUpdateLevel = (index: number, level: Language['level']) => {
    onChange(
      languages.map((lang, i) => (i === index ? { ...lang, level } : lang))
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label>Languages *</Label>
        <span className='text-muted-foreground text-sm'>
          {languages.length}/{maxLanguages}
        </span>
      </div>

      {/* Selected Languages */}
      {languages.length > 0 && (
        <div className='space-y-2'>
          {languages.map((lang, index) => (
            <Card key={index} className='p-3'>
              <div className='flex items-center gap-2'>
                <div className='flex-1'>
                  <span className='font-medium'>{lang.language}</span>
                </div>
                <Select
                  value={lang.level}
                  onValueChange={value =>
                    handleUpdateLevel(index, value as Language['level'])
                  }
                >
                  <SelectTrigger className='w-40'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFICIENCY_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleRemoveLanguage(index)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Language */}
      {languages.length < maxLanguages && (
        <Card className='p-3'>
          <div className='flex items-center gap-2'>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={open}
                  className='flex-1 justify-between'
                >
                  <span className='flex items-center gap-2'>
                    <Languages className='h-4 w-4' />
                    Select a language
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[350px] p-0' align='start'>
                <Command>
                  <CommandInput
                    placeholder='Search languages...'
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList className='max-h-[300px]'>
                    <CommandEmpty>No language found.</CommandEmpty>

                    {/* Popular languages */}
                    {!search && availablePopular.length > 0 && (
                      <CommandGroup heading='Popular Languages'>
                        {availablePopular.map(lang => (
                          <CommandItem
                            key={lang.code}
                            value={lang.name}
                            onSelect={() => handleAddLanguage(lang.name)}
                          >
                            {lang.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {/* All languages or filtered */}
                    <CommandGroup
                      heading={search ? 'Search Results' : 'All Languages'}
                    >
                      {(search ? filteredLanguages : availableLanguages).map(
                        lang => (
                          <CommandItem
                            key={lang.code}
                            value={lang.name}
                            onSelect={() => handleAddLanguage(lang.name)}
                          >
                            {lang.name}
                          </CommandItem>
                        )
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Select
              value={newLevel}
              onValueChange={value => setNewLevel(value as Language['level'])}
            >
              <SelectTrigger className='w-40'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFICIENCY_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}
    </div>
  )
}
