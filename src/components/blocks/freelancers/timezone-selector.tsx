'use client'

import { useState, useMemo } from 'react'

import { Check, ChevronsUpDown, Globe } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { getTimezonesGrouped } from '@/lib/utils/localization'

interface TimezoneSelectorProps {
  value?: string
  onChange: (timezone: string) => void
  placeholder?: string
  className?: string
}

export function TimezoneSelector({
  value,
  onChange,
  placeholder = 'Select timezone...',
  className
}: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const timezonesGrouped = useMemo(() => getTimezonesGrouped(), [])

  // Get current timezone display
  const getTimezoneDisplay = (tz: string) => {
    for (const region in timezonesGrouped) {
      const found = timezonesGrouped[region].find(t => t.value === tz)
      if (found) return found.label
    }
    return tz
  }

  // Filter timezones based on search
  const filteredGroups = useMemo(() => {
    if (!search) return timezonesGrouped

    const filtered: typeof timezonesGrouped = {}
    const searchLower = search.toLowerCase()

    for (const region in timezonesGrouped) {
      const matchingTimezones = timezonesGrouped[region].filter(
        tz =>
          tz.label.toLowerCase().includes(searchLower) ||
          tz.value.toLowerCase().includes(searchLower) ||
          region.toLowerCase().includes(searchLower)
      )

      if (matchingTimezones.length > 0) {
        filtered[region] = matchingTimezones
      }
    }

    return filtered
  }, [search, timezonesGrouped])

  // Auto-detect user's timezone
  const detectTimezone = () => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (detected) {
      onChange(detected)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          <span className='flex items-center gap-2'>
            <Globe className='h-4 w-4' />
            {value ? getTimezoneDisplay(value) : placeholder}
          </span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[400px] p-0' align='start'>
        <Command>
          <CommandInput
            placeholder='Search timezone...'
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className='max-h-[300px]'>
            <CommandEmpty>
              No timezone found.
              <Button
                variant='link'
                size='sm'
                onClick={detectTimezone}
                className='mt-2'
              >
                Use detected timezone
              </Button>
            </CommandEmpty>

            {/* Auto-detect option */}
            {!search && (
              <CommandItem onSelect={detectTimezone} className='mb-2'>
                <Globe className='text-primary mr-2 h-4 w-4' />
                Auto-detect timezone
              </CommandItem>
            )}

            {/* Grouped timezones */}
            {Object.entries(filteredGroups).map(([region, timezones]) => (
              <CommandGroup key={region} heading={region}>
                {timezones.map(tz => (
                  <CommandItem
                    key={tz.value}
                    value={tz.value}
                    onSelect={currentValue => {
                      onChange(currentValue)
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === tz.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {tz.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
