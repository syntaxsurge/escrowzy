'use client'

import { useState, useEffect } from 'react'

import { Search, ArrowUpDown, RefreshCw } from 'lucide-react'
import useSWR from 'swr'
import { useDebounce } from 'use-debounce'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { apiEndpoints } from '@/config/api-endpoints'
import { api } from '@/lib/api/http-client'
import type { EscrowListingWithUser } from '@/types/listings'
import { SUPPORTED_TOKENS, PAYMENT_METHODS } from '@/types/listings'

import { ListingCard } from './listing-card'

interface ListingFilters {
  listingType?: 'buy' | 'sell' | ''
  tokenOffered?: string
  paymentMethod?: string
  minAmount?: string
  maxAmount?: string
  search?: string
}

export function ListingBrowser() {
  const [filters, setFilters] = useState<ListingFilters>({})
  const [debouncedSearch] = useDebounce(filters.search, 500)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState<'createdAt' | 'pricePerUnit' | 'amount'>(
    'createdAt'
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Build query params
  const queryParams = new URLSearchParams()
  queryParams.set('page', page.toString())
  queryParams.set('limit', pageSize.toString())
  queryParams.set('sortBy', sortBy)
  queryParams.set('sortOrder', sortOrder)

  if (filters.listingType) queryParams.set('listingType', filters.listingType)
  if (filters.tokenOffered)
    queryParams.set('tokenOffered', filters.tokenOffered)
  if (filters.paymentMethod)
    queryParams.set('paymentMethod', filters.paymentMethod)
  if (filters.minAmount) queryParams.set('minAmount', filters.minAmount)
  if (filters.maxAmount) queryParams.set('maxAmount', filters.maxAmount)
  if (debouncedSearch) queryParams.set('search', debouncedSearch)

  // Fetch listings
  const {
    data: response,
    error,
    isLoading,
    mutate
  } = useSWR(
    `${apiEndpoints.listings.base}?${queryParams.toString()}`,
    async () => {
      const res = await api.get(
        `${apiEndpoints.listings.base}?${queryParams.toString()}`
      )
      return res.success ? res.data : { listings: [], total: 0 }
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  )

  const listings = response?.listings || []
  const totalCount = response?.total || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [
    filters.listingType,
    filters.tokenOffered,
    filters.paymentMethod,
    debouncedSearch
  ])

  const handleFilterChange = (key: keyof ListingFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const clearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const activeFilterCount = Object.values(filters).filter(v => v).length

  return (
    <div className='space-y-4'>
      {/* Filters Bar */}
      <div className='bg-card flex flex-col gap-4 rounded-lg border p-4'>
        <div className='flex flex-col gap-3 lg:flex-row'>
          {/* Search */}
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
            <Input
              placeholder='Search by user or description...'
              value={filters.search || ''}
              onChange={e => handleFilterChange('search', e.target.value)}
              className='pl-9'
            />
          </div>

          {/* Listing Type Filter */}
          <Select
            value={filters.listingType || 'all'}
            onValueChange={value =>
              handleFilterChange(
                'listingType',
                value === 'all' ? undefined : value
              )
            }
          >
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='All Types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='buy'>Buy Offers</SelectItem>
              <SelectItem value='sell'>Sell Offers</SelectItem>
            </SelectContent>
          </Select>

          {/* Token Filter */}
          <Select
            value={filters.tokenOffered || 'all'}
            onValueChange={value =>
              handleFilterChange(
                'tokenOffered',
                value === 'all' ? undefined : value
              )
            }
          >
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='All Tokens' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Tokens</SelectItem>
              {Object.keys(SUPPORTED_TOKENS).map(token => (
                <SelectItem key={token} value={token}>
                  {token}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment Method Filter */}
          <Select
            value={filters.paymentMethod || 'all'}
            onValueChange={value =>
              handleFilterChange(
                'paymentMethod',
                value === 'all' ? undefined : value
              )
            }
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Payment Method' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Methods</SelectItem>
              {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon'>
                <ArrowUpDown className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSort('createdAt')}>
                Date{' '}
                {sortBy === 'createdAt' && (sortOrder === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('pricePerUnit')}>
                Price{' '}
                {sortBy === 'pricePerUnit' &&
                  (sortOrder === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('amount')}>
                Amount{' '}
                {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          <Button
            variant='outline'
            size='icon'
            onClick={() => mutate()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>

        {/* Amount Range Filters */}
        <div className='flex flex-col gap-3 sm:flex-row'>
          <Input
            type='number'
            placeholder='Min amount'
            value={filters.minAmount || ''}
            onChange={e => handleFilterChange('minAmount', e.target.value)}
            className='w-full sm:w-[150px]'
          />
          <Input
            type='number'
            placeholder='Max amount'
            value={filters.maxAmount || ''}
            onChange={e => handleFilterChange('maxAmount', e.target.value)}
            className='w-full sm:w-[150px]'
          />

          {activeFilterCount > 0 && (
            <Button variant='ghost' onClick={clearFilters} className='ml-auto'>
              Clear filters ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          {isLoading ? 'Loading...' : `${totalCount} listings found`}
        </p>
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Spinner size='lg' />
        </div>
      ) : error ? (
        <Card className='p-8 text-center'>
          <p className='text-destructive'>Failed to load listings</p>
          <Button variant='outline' onClick={() => mutate()} className='mt-4'>
            Retry
          </Button>
        </Card>
      ) : listings.length === 0 ? (
        <Card className='p-12 text-center'>
          <p className='text-muted-foreground mb-2'>No listings found</p>
          <p className='text-muted-foreground text-sm'>
            Try adjusting your filters or create a new listing
          </p>
        </Card>
      ) : (
        <>
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {listings.map((listing: EscrowListingWithUser) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onAccept={mutate}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='mt-6 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  First
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className='text-muted-foreground text-sm'>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setPage(prev => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  Last
                </Button>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-muted-foreground text-sm'>
                  Items per page:
                </span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className='border-input bg-background h-8 rounded-md border px-2 py-1 text-sm'
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
