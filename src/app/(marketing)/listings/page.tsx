'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  ShoppingBag,
  Globe,
  Filter,
  DollarSign,
  Search,
  TrendingUp,
  Users,
  Activity,
  Tag
} from 'lucide-react'
import useSWR from 'swr'

import { UnifiedConnectButton } from '@/components/blocks/blockchain/unified-connect-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes, refreshIntervals } from '@/config/app-routes'
import { useUnifiedWalletInfo } from '@/context'
import { cn } from '@/lib'
import { swrFetcher } from '@/lib/api/swr'
import type { EscrowListingWithUser } from '@/types/listings'

export default function PublicListingsPage() {
  const router = useRouter()
  const { isConnected } = useUnifiedWalletInfo()
  const [category, setCategory] = useState<'all' | 'p2p' | 'domain'>('all')
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all')
  const [filterToken, setFilterToken] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch marketplace listings
  const { data: listingsData, isLoading } = useSWR(
    apiEndpoints.listings.all,
    swrFetcher,
    {
      refreshInterval: refreshIntervals.SLOW
    }
  )

  // Fetch market stats
  const { data: statsData } = useSWR(
    apiEndpoints.listings.marketStats,
    swrFetcher,
    {
      refreshInterval: refreshIntervals.SLOW
    }
  )

  const listings = listingsData?.listings || []
  const stats = statsData?.stats

  // Filter listings based on search and filters
  const filteredListings = listings.filter((listing: EscrowListingWithUser) => {
    // Category filter
    if (category !== 'all' && listing.listingCategory !== category) return false

    // Type filter
    if (filterType !== 'all' && listing.listingType !== filterType) return false

    // Token filter
    if (filterToken !== 'all' && listing.tokenAddress !== filterToken)
      return false

    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      return (
        (listing.domainMetadata as any)?.domainName
          ?.toLowerCase()
          .includes(search) ||
        listing.terms?.toLowerCase().includes(search) ||
        listing.user?.name?.toLowerCase().includes(search)
      )
    }

    return true
  })

  const handleListingClick = (listing: EscrowListingWithUser) => {
    if (!isConnected) {
      return // Show connect wallet prompt
    }
    router.push(`${appRoutes.trades.listings.base}?id=${listing.id}`)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-foreground mb-4 text-4xl font-bold'>
            P2P & Domain Marketplace
          </h1>
          <p className='text-muted-foreground text-lg'>
            Trade cryptocurrencies and domain names securely with escrow
            protection
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <Card className='border-border bg-card'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Active Listings
                </CardTitle>
                <Activity className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.activeListings}</div>
                <p className='text-muted-foreground text-xs'>
                  Available for trading
                </p>
              </CardContent>
            </Card>

            <Card className='border-border bg-card'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Volume
                </CardTitle>
                <TrendingUp className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  ${stats.totalVolume?.toLocaleString() || 0}
                </div>
                <p className='text-muted-foreground text-xs'>
                  All-time trading volume
                </p>
              </CardContent>
            </Card>

            <Card className='border-border bg-card'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Active Traders
                </CardTitle>
                <Users className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.activeTraders}</div>
                <p className='text-muted-foreground text-xs'>
                  Trading this month
                </p>
              </CardContent>
            </Card>

            <Card className='border-border bg-card'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Avg. Price
                </CardTitle>
                <DollarSign className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  ${stats.avgPrice?.toFixed(2) || 0}
                </div>
                <p className='text-muted-foreground text-xs'>
                  Average listing price
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className='mb-6 space-y-4'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            {/* Category Tabs */}
            <Tabs
              value={category}
              onValueChange={value => setCategory(value as any)}
              className='w-full lg:w-auto'
            >
              <TabsList className='grid w-full grid-cols-3 lg:w-auto'>
                <TabsTrigger value='all' className='gap-2'>
                  <Tag className='h-4 w-4' />
                  All
                </TabsTrigger>
                <TabsTrigger value='p2p' className='gap-2'>
                  <ShoppingBag className='h-4 w-4' />
                  P2P
                </TabsTrigger>
                <TabsTrigger value='domain' className='gap-2'>
                  <Globe className='h-4 w-4' />
                  Domains
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search and Filters */}
            <div className='flex flex-col gap-2 sm:flex-row'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search listings...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full pl-9 sm:w-[200px]'
                />
              </div>

              <Select
                value={filterType}
                onValueChange={v => setFilterType(v as any)}
              >
                <SelectTrigger className='w-full sm:w-[120px]'>
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='buy'>Buy</SelectItem>
                  <SelectItem value='sell'>Sell</SelectItem>
                </SelectContent>
              </Select>

              <Button variant='outline' className='gap-2'>
                <Filter className='h-4 w-4' />
                More Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className='flex min-h-[400px] items-center justify-center'>
            <Spinner size='lg' />
          </div>
        ) : filteredListings.length === 0 ? (
          <Card className='border-border bg-card'>
            <CardContent className='flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8'>
              <ShoppingBag className='text-muted-foreground h-12 w-12' />
              <h3 className='text-foreground text-xl font-semibold'>
                No listings found
              </h3>
              <p className='text-muted-foreground text-center'>
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to create a listing'}
              </p>
              {!isConnected && (
                <div className='flex flex-col items-center gap-2'>
                  <p className='text-muted-foreground text-sm'>
                    Connect your wallet to start trading
                  </p>
                  <UnifiedConnectButton />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filteredListings.map((listing: EscrowListingWithUser) => (
              <Card
                key={listing.id}
                className={cn(
                  'border-border bg-card cursor-pointer transition-all hover:scale-105 hover:shadow-lg',
                  !isConnected && 'opacity-90'
                )}
                onClick={() => handleListingClick(listing)}
              >
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='text-foreground line-clamp-1 text-lg'>
                        {listing.listingCategory === 'domain'
                          ? (listing.domainMetadata as any)?.domainName
                          : `${listing.listingType} ${listing.tokenOffered}`}
                      </CardTitle>
                      <p className='text-muted-foreground mt-1 line-clamp-2 text-sm'>
                        {listing.terms || 'No description'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        listing.listingType === 'buy' ? 'default' : 'secondary'
                      }
                      className='ml-2'
                    >
                      {listing.listingType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Price
                      </span>
                      <span className='text-foreground font-semibold'>
                        $
                        {listing.amount
                          ? parseFloat(listing.amount).toLocaleString()
                          : '0'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Category
                      </span>
                      <Badge variant='outline'>
                        {listing.listingCategory === 'p2p' ? (
                          <>
                            <ShoppingBag className='mr-1 h-3 w-3' />
                            P2P
                          </>
                        ) : (
                          <>
                            <Globe className='mr-1 h-3 w-3' />
                            Domain
                          </>
                        )}
                      </Badge>
                    </div>
                    {listing.user && (
                      <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground text-sm'>
                          Seller
                        </span>
                        <span className='text-foreground text-sm font-medium'>
                          {listing.user.name || 'Anonymous'}
                        </span>
                      </div>
                    )}
                  </div>
                  {!isConnected && (
                    <div className='border-border mt-4 border-t pt-4'>
                      <p className='text-muted-foreground text-center text-xs'>
                        Connect wallet to view details
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA for non-connected users */}
        {!isConnected && (
          <Card className='border-border bg-card mt-8'>
            <CardContent className='flex flex-col items-center justify-center space-y-4 p-8'>
              <h3 className='text-foreground text-xl font-semibold'>
                Ready to start trading?
              </h3>
              <p className='text-muted-foreground text-center'>
                Connect your wallet to access all features and start trading
                securely
              </p>
              <UnifiedConnectButton />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
