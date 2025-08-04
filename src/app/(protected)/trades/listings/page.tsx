'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  Plus,
  ShoppingCart,
  Filter,
  DollarSign,
  Users,
  Activity,
  Zap
} from 'lucide-react'
import useSWR from 'swr'

import {
  GamifiedHeader,
  GamifiedStatsCards,
  GamifiedListingCard,
  type StatCard
} from '@/components/blocks/trading'
import { navigationProgress } from '@/components/providers/navigation-progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { api } from '@/lib/api/http-client'
import type { P2PListingWithUser } from '@/types/p2p-listings'

export default function P2PMarketplacePage() {
  const router = useRouter()
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all')
  const [filterToken, setFilterToken] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch marketplace listings
  const { data: listingsData, mutate: mutateListings } = useSWR(
    apiEndpoints.listings.all,
    async () => {
      const res = await api.get(apiEndpoints.listings.all)
      return res.success ? res.data : null
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  )

  // Fetch marketplace stats
  const { data: marketStats } = useSWR(
    apiEndpoints.listings.marketStats,
    async () => {
      const res = await api.get(apiEndpoints.listings.marketStats)
      return res.success ? res.data : null
    },
    {
      refreshInterval: 60000
    }
  )

  // Filter listings
  const filteredListings =
    listingsData?.listings?.filter((listing: P2PListingWithUser) => {
      if (filterType !== 'all' && listing.listingType !== filterType)
        return false
      if (filterToken !== 'all' && listing.tokenOffered !== filterToken)
        return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const userName = listing.user?.name?.toLowerCase() || ''
        const userEmail = listing.user?.email?.toLowerCase() || ''
        if (!userName.includes(query) && !userEmail.includes(query))
          return false
      }
      return listing.isActive
    }) || []

  // Get unique tokens from listings
  const availableTokens = Array.from(
    new Set(
      listingsData?.listings?.map((l: P2PListingWithUser) => l.tokenOffered) ||
        []
    )
  )

  // Prepare stats cards
  const statsCards: StatCard[] = [
    {
      title: 'Active Offers',
      value: marketStats?.totalActiveListings ?? 0,
      subtitle: 'Available for trading',
      icon: <Activity className='h-5 w-5 text-white' />,
      badge: 'LIVE',
      colorScheme: 'green'
    },
    {
      title: 'Buy Orders',
      value: marketStats?.totalBuyOrders ?? 0,
      subtitle: 'Users want to buy',
      icon: <DollarSign className='h-5 w-5 text-white' />,
      badge: 'DEMAND',
      colorScheme: 'blue'
    },
    {
      title: 'Sell Orders',
      value: marketStats?.totalSellOrders ?? 0,
      subtitle: 'Users want to sell',
      icon: <Zap className='h-5 w-5 text-white' />,
      badge: 'SUPPLY',
      colorScheme: 'purple'
    },
    {
      title: 'Active Traders',
      value: marketStats?.activeTraders ?? 0,
      subtitle: 'Unique users trading',
      icon: <Users className='h-5 w-5 text-white' />,
      badge: 'COMMUNITY',
      colorScheme: 'yellow'
    }
  ]

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-8 py-6'>
        {/* Gaming Header */}
        <GamifiedHeader
          title='P2P MARKETPLACE'
          subtitle='Browse and trade cryptocurrencies directly with other users'
          icon={<ShoppingCart className='h-8 w-8 text-white' />}
          actions={
            <Button
              onClick={() => {
                navigationProgress.start()
                router.push(appRoutes.trades.listings.create)
              }}
              size='lg'
              className='border-0 bg-gradient-to-r from-blue-600 to-cyan-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-cyan-800 hover:shadow-xl'
            >
              <Plus className='mr-2 h-5 w-5' />
              CREATE LISTING
            </Button>
          }
        />

        {/* Gaming Stats Cards */}
        <GamifiedStatsCards cards={statsCards} />

        {/* Filters Section */}
        <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
          <CardContent className='p-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-2'>
                <Filter className='text-primary h-5 w-5' />
                <span className='text-lg font-bold'>FILTERS</span>
              </div>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                <Select
                  value={filterType}
                  onValueChange={(value: any) => setFilterType(value)}
                >
                  <SelectTrigger className='w-full sm:w-[140px]'>
                    <SelectValue placeholder='Type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Types</SelectItem>
                    <SelectItem value='buy'>Buy Orders</SelectItem>
                    <SelectItem value='sell'>Sell Orders</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterToken} onValueChange={setFilterToken}>
                  <SelectTrigger className='w-full sm:w-[140px]'>
                    <SelectValue placeholder='Token' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Tokens</SelectItem>
                    {availableTokens.map((token: any) => (
                      <SelectItem key={token} value={token as string}>
                        {token as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder='Search by user...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full sm:w-[200px]'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        {filteredListings.length > 0 ? (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {filteredListings.map((listing: P2PListingWithUser) => (
              <GamifiedListingCard
                key={listing.id}
                listing={listing}
                onAccept={() => mutateListings()}
              />
            ))}
          </div>
        ) : (
          <div className='flex min-h-[400px] items-center justify-center'>
            <div className='text-center'>
              <div className='mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20'>
                <ShoppingCart className='h-12 w-12 text-blue-600 dark:text-blue-400' />
              </div>
              <h3 className='mb-2 text-2xl font-black'>NO LISTINGS FOUND</h3>
              <p className='text-muted-foreground mb-6'>
                {searchQuery || filterType !== 'all' || filterToken !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Be the first to create a listing'}
              </p>
              {!searchQuery &&
                filterType === 'all' &&
                filterToken === 'all' && (
                  <Button
                    onClick={() => {
                      navigationProgress.start()
                      router.push(appRoutes.trades.listings.create)
                    }}
                    size='lg'
                    className='border-0 bg-gradient-to-r from-blue-600 to-cyan-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-cyan-800 hover:shadow-xl'
                  >
                    <Plus className='mr-2 h-5 w-5' />
                    CREATE FIRST LISTING
                  </Button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
