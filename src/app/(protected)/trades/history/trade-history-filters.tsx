'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { Globe, Zap } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TradeHistoryFiltersProps {
  searchParams: Record<string, string | string[] | undefined>
}

export function TradeHistoryFilters({
  searchParams
}: TradeHistoryFiltersProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()

  const listingCategoryFilter =
    (searchParams.listingCategory as string) || 'all'
  const filterStatus = (searchParams.status as string) || 'all'
  const filterPeriod = (searchParams.period as string) || 'all'

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(currentSearchParams.toString())

    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    // Reset page to 1 when filters change
    params.set('page', '1')

    router.push(`?${params.toString()}`)
  }

  return (
    <>
      {/* Trade Type Tabs */}
      <Tabs
        value={listingCategoryFilter}
        onValueChange={value => updateSearchParams('listingCategory', value)}
        className='w-full'
      >
        <TabsList className='bg-background/50 border-primary/20 grid h-14 w-full grid-cols-3 border-2 backdrop-blur-sm'>
          <TabsTrigger
            value='all'
            className='data-[state=active]:from-primary/20 text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:to-purple-600/20'
          >
            ALL TRADES
          </TabsTrigger>
          <TabsTrigger
            value='p2p'
            className='text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/20 data-[state=active]:to-cyan-600/20'
          >
            <Zap className='mr-2 h-4 w-4' />
            P2P CRYPTO
          </TabsTrigger>
          <TabsTrigger
            value='domain'
            className='text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/20 data-[state=active]:to-pink-600/20'
          >
            <Globe className='mr-2 h-4 w-4' />
            DOMAINS
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters Section */}
      <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter your trade history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 sm:flex-row'>
            <Select
              value={filterStatus}
              onValueChange={value => updateSearchParams('status', value)}
            >
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
                <SelectItem value='cancelled'>Cancelled</SelectItem>
                <SelectItem value='disputed'>Disputed</SelectItem>
                <SelectItem value='refunded'>Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterPeriod}
              onValueChange={value => updateSearchParams('period', value)}
            >
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue placeholder='Period' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Time</SelectItem>
                <SelectItem value='7days'>Last 7 Days</SelectItem>
                <SelectItem value='30days'>Last 30 Days</SelectItem>
                <SelectItem value='90days'>Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
