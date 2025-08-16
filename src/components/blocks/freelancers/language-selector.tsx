'use client'

import { useState } from 'react'

import { Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export interface Language {
  language: string
  level: 'basic' | 'conversational' | 'fluent' | 'native'
}

interface LanguageSelectorProps {
  languages: Language[]
  onChange: (languages: Language[]) => void
  maxLanguages?: number
}

const COMMON_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese (Mandarin)',
  'Chinese (Cantonese)',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Dutch',
  'Polish',
  'Turkish',
  'Swedish',
  'Norwegian',
  'Danish',
  'Finnish'
]

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

  const handleAddLanguage = () => {
    if (!newLanguage || languages.length >= maxLanguages) {
      return
    }

    // Check if language already exists
    if (languages.find(l => l.language === newLanguage)) {
      return
    }

    onChange([...languages, { language: newLanguage, level: newLevel }])
    setNewLanguage('')
    setNewLevel('conversational')
  }

  const handleRemoveLanguage = (index: number) => {
    onChange(languages.filter((_, i) => i !== index))
  }

  const handleUpdateLevel = (index: number, level: Language['level']) => {
    onChange(
      languages.map((lang, i) => (i === index ? { ...lang, level } : lang))
    )
  }

  const availableLanguages = COMMON_LANGUAGES.filter(
    lang => !languages.find(l => l.language === lang)
  )

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label>Languages</Label>
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
            <Select value={newLanguage} onValueChange={setNewLanguage}>
              <SelectTrigger className='flex-1'>
                <SelectValue placeholder='Select a language' />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map(lang => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button
              size='sm'
              onClick={handleAddLanguage}
              disabled={!newLanguage}
            >
              <Plus className='h-4 w-4' />
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
