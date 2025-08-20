'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import {
  Plus,
  ShoppingCart,
  Filter,
  DollarSign,
  Users,
  Activity,
  Zap,
  Globe,
  Briefcase
} from 'lucide-react'
import useSWR from 'swr'

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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiEndpoints } from '@/config/api-endpoints'
import { refreshIntervals, appRoutes } from '@/config/app-routes'
import { api } from '@/lib/api/http-client'
import type { EscrowListingWithUser } from '@/types/listings'

import {
  GamifiedHeader,
  GamifiedStatsCards,
  GamifiedListingCard,
  type StatCard
} from '../trading'

export interface UnifiedMarketplaceProps {
  defaultCategory?: 'all' | 'p2p' | 'domain' | 'service'
  showCreateButton?: boolean
  isPublic?: boolean
  title?: string
  description?: string
}

export function UnifiedMarketplace({
  defaultCategory = 'all',
  showCreateButton = true,
  isPublic = false,
  title = 'ESCROW MARKETPLACE',
  description
}: UnifiedMarketplaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all')
  const [filterToken, setFilterToken] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Get category from URL or use default
  const categoryFromUrl = searchParams.get('category') as
    | 'all'
    | 'p2p'
    | 'domain'
    | 'service'
    | null

  // Use URL category if available, otherwise use defaultCategory
  // When no category in URL and defaultCategory is 'all', treat it as 'all'
  const category =
    categoryFromUrl ||
    (defaultCategory === 'all' && !categoryFromUrl ? 'all' : defaultCategory)

  // Update URL when category changes
  const handleCategoryChange = (newCategory: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newCategory === 'all') {
      params.delete('category')
    } else {
      params.set('category', newCategory)
    }
    router.push(`?${params.toString()}`)
  }

  // Fetch marketplace listings (including jobs and services)
  const { data: listingsData, mutate: mutateListings } = useSWR(
    category === 'service' || category === 'all'
      ? apiEndpoints.jobs.base
      : apiEndpoints.listings.all,
    async () => {
      // For service category, fetch from jobs API (includes both jobs and services)
      if (category === 'service' || category === 'all') {
        const res = await api.get(
          `${apiEndpoints.jobs.base}?status=open&limit=100`
        )
        if (res.success) {
          // Transform jobs to listing format and combine with P2P/domain listings
          const jobListings =
            res.data?.jobs?.map((job: any) => ({
              ...job,
              listingCategory:
                job.postingType === 'service' ? 'service' : 'job',
              listingType: job.postingType === 'service' ? 'sell' : 'buy',
              isActive: job.status === 'open',
              amount: job.servicePrice || job.budgetMin || '0',
              pricePerUnit: job.pricePerUnit,
              user: job.client,
              tokenOffered: null,
              paymentMethods: job.paymentMethods || []
            })) || []

          // If showing all categories, also fetch P2P and domain listings
          if (category === 'all') {
            const p2pRes = await api.get(apiEndpoints.listings.all)
            const p2pListings = p2pRes.success
              ? p2pRes.data?.listings || []
              : []
            return { listings: [...jobListings, ...p2pListings] }
          }

          return { listings: jobListings }
        }
      } else {
        // For P2P and domain categories, use existing listings API
        const res = await api.get(apiEndpoints.listings.all)
        return res.success ? res.data : null
      }
      return { listings: [] }
    },
    {
      refreshInterval: refreshIntervals.SLOW,
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
      refreshInterval: refreshIntervals.VERY_SLOW
    }
  )

  // Filter listings
  const filteredListings =
    listingsData?.listings?.filter((listing: any) => {
      // Category filter
      if (category !== 'all') {
        // Service category includes both services and jobs
        if (category === 'service') {
          if (
            listing.listingCategory !== 'service' &&
            listing.listingCategory !== 'job'
          ) {
            return false
          }
        } else if (listing.listingCategory !== category) {
          return false
        }
      }

      // Type filter (only for P2P listings)
      if (
        listing.listingCategory === 'p2p' &&
        filterType !== 'all' &&
        listing.listingType !== filterType
      )
        return false

      // Token filter (only for P2P listings)
      if (
        listing.listingCategory === 'p2p' &&
        filterToken !== 'all' &&
        listing.tokenOffered !== filterToken
      )
        return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const userName = listing.user?.name?.toLowerCase() || ''
        const userEmail = listing.user?.email?.toLowerCase() || ''

        // For domain listings, also search in domain name
        if (listing.listingCategory === 'domain') {
          const domainName =
            (listing.metadata as any)?.domainName?.toLowerCase() || ''
          if (
            !userName.includes(query) &&
            !userEmail.includes(query) &&
            !domainName.includes(query)
          )
            return false
        } else if (
          listing.listingCategory === 'job' ||
          listing.listingCategory === 'service'
        ) {
          // For job/service listings, search in title and description
          const title = listing.title?.toLowerCase() || ''
          const description = listing.description?.toLowerCase() || ''
          if (
            !userName.includes(query) &&
            !userEmail.includes(query) &&
            !title.includes(query) &&
            !description.includes(query)
          )
            return false
        } else {
          if (!userName.includes(query) && !userEmail.includes(query))
            return false
        }
      }

      return listing.isActive
    }) || []

  // Get unique tokens from P2P listings only
  const availableTokens = Array.from(
    new Set(
      listingsData?.listings
        ?.filter((l: EscrowListingWithUser) => l.listingCategory === 'p2p')
        ?.map((l: EscrowListingWithUser) => l.tokenOffered) || []
    )
  )

  // Prepare stats cards based on category
  const statsCards: StatCard[] =
    category === 'domain'
      ? [
          {
            title: 'Domain Listings',
            value: marketStats?.totalDomainListings ?? 0,
            subtitle: 'Domains for sale',
            icon: <Globe className='h-5 w-5 text-white' />,
            badge: 'DOMAINS',
            colorScheme: 'purple'
          },
          {
            title: 'Average Price',
            value: marketStats?.avgDomainPrice
              ? `$${marketStats.avgDomainPrice}`
              : '$0',
            subtitle: 'Domain market average',
            icon: <DollarSign className='h-5 w-5 text-white' />,
            badge: 'PRICING',
            colorScheme: 'green'
          },
          {
            title: 'Active Domains',
            value: marketStats?.activeDomainListings ?? 0,
            subtitle: 'Available now',
            icon: <Activity className='h-5 w-5 text-white' />,
            badge: 'LIVE',
            colorScheme: 'blue'
          },
          {
            title: 'Total Sellers',
            value: marketStats?.domainSellers ?? 0,
            subtitle: 'Domain owners',
            icon: <Users className='h-5 w-5 text-white' />,
            badge: 'SELLERS',
            colorScheme: 'yellow'
          }
        ]
      : category === 'service'
        ? [
            {
              title: 'Job & Service Listings',
              value: filteredListings.filter(
                (l: any) =>
                  l.listingCategory === 'job' || l.listingCategory === 'service'
              ).length,
              subtitle: 'Available postings',
              icon: <Briefcase className='h-5 w-5 text-white' />,
              badge: 'POSTINGS',
              colorScheme: 'green'
            },
            {
              title: 'Freelancers',
              value: new Set(
                filteredListings
                  .filter(
                    (l: any) =>
                      l.listingCategory === 'job' ||
                      l.listingCategory === 'service'
                  )
                  .map((l: any) => l.userId || l.clientId)
              ).size,
              subtitle: 'Active users',
              icon: <Users className='h-5 w-5 text-white' />,
              badge: 'PROVIDERS',
              colorScheme: 'blue'
            },
            {
              title: 'Avg Budget',
              value:
                filteredListings.filter(
                  (l: any) =>
                    l.listingCategory === 'job' ||
                    l.listingCategory === 'service'
                ).length > 0
                  ? `$${Math.round(
                      filteredListings
                        .filter(
                          (l: any) =>
                            l.listingCategory === 'job' ||
                            l.listingCategory === 'service'
                        )
                        .reduce(
                          (sum: number, l: any) =>
                            sum +
                            parseFloat(
                              l.pricePerUnit || l.amount || l.budgetMin || '0'
                            ),
                          0
                        ) /
                        filteredListings.filter(
                          (l: any) =>
                            l.listingCategory === 'job' ||
                            l.listingCategory === 'service'
                        ).length
                    )}`
                  : '$0',
              subtitle: 'Average rate',
              icon: <DollarSign className='h-5 w-5 text-white' />,
              badge: 'PRICING',
              colorScheme: 'purple'
            },
            {
              title: 'Categories',
              value: new Set(
                filteredListings
                  .filter(
                    (l: any) =>
                      l.listingCategory === 'job' ||
                      l.listingCategory === 'service'
                  )
                  .map((l: any) => l.categoryId || 1)
              ).size,
              subtitle: 'Different types',
              icon: <Activity className='h-5 w-5 text-white' />,
              badge: 'VARIETY',
              colorScheme: 'yellow'
            }
          ]
        : [
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

  const getSubtitle = () => {
    if (description) return description

    return category === 'domain'
      ? 'Browse and purchase domains with secure escrow'
      : category === 'p2p'
        ? 'Trade cryptocurrencies directly with other users'
        : category === 'service'
          ? 'Find professional services and freelancers'
          : 'Browse all escrow listings'
  }

  const getIcon = () => {
    switch (category) {
      case 'domain':
        return <Globe className='h-8 w-8 text-white' />
      case 'service':
        return <Briefcase className='h-8 w-8 text-white' />
      case 'p2p':
        return <Zap className='h-8 w-8 text-white' />
      default:
        return <ShoppingCart className='h-8 w-8 text-white' />
    }
  }

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-8 py-6'>
        {/* Gaming Header */}
        <GamifiedHeader
          title={title}
          subtitle={getSubtitle()}
          icon={getIcon()}
          actions={
            showCreateButton && !isPublic ? (
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
            ) : null
          }
        />

        {/* Category Tabs */}
        <Tabs
          value={category}
          onValueChange={handleCategoryChange}
          className='w-full'
        >
          <TabsList className='bg-background/50 border-primary/20 grid h-14 w-full grid-cols-4 border-2 backdrop-blur-sm'>
            <TabsTrigger
              value='all'
              className='data-[state=active]:from-primary/20 text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:to-purple-600/20'
            >
              ALL LISTINGS
            </TabsTrigger>
            <TabsTrigger
              value='p2p'
              className='text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/20 data-[state=active]:to-cyan-600/20'
            >
              <Zap className='mr-2 h-4 w-4' />
              P2P TRADING
            </TabsTrigger>
            <TabsTrigger
              value='domain'
              className='text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/20 data-[state=active]:to-pink-600/20'
            >
              <Globe className='mr-2 h-4 w-4' />
              DOMAINS
            </TabsTrigger>
            <TabsTrigger
              value='service'
              className='text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600/20 data-[state=active]:to-emerald-600/20'
            >
              <Briefcase className='mr-2 h-4 w-4' />
              SERVICES
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
                {/* Only show type filter for P2P or all categories */}
                {(category === 'p2p' || category === 'all') && (
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
                )}

                {/* Only show token filter for P2P */}
                {(category === 'p2p' || category === 'all') &&
                  availableTokens.length > 0 && (
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
                  )}

                <Input
                  placeholder={
                    category === 'domain'
                      ? 'Search domains or users...'
                      : category === 'service'
                        ? 'Search services or freelancers...'
                        : 'Search by user...'
                  }
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
            {filteredListings.map((listing: EscrowListingWithUser) => (
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
                {category === 'domain' ? (
                  <Globe className='h-12 w-12 text-purple-600 dark:text-purple-400' />
                ) : category === 'service' ? (
                  <Briefcase className='h-12 w-12 text-green-600 dark:text-green-400' />
                ) : (
                  <ShoppingCart className='h-12 w-12 text-blue-600 dark:text-blue-400' />
                )}
              </div>
              <h3 className='mb-2 text-2xl font-black'>
                {category === 'domain'
                  ? 'NO DOMAINS FOUND'
                  : category === 'p2p'
                    ? 'NO P2P LISTINGS FOUND'
                    : category === 'service'
                      ? 'NO SERVICES FOUND'
                      : 'NO LISTINGS FOUND'}
              </h3>
              <p className='text-muted-foreground mb-6'>
                {searchQuery || filterType !== 'all' || filterToken !== 'all'
                  ? 'Try adjusting your filters'
                  : category === 'domain'
                    ? 'Be the first to list a domain'
                    : category === 'p2p'
                      ? 'Be the first to create a P2P listing'
                      : category === 'service'
                        ? 'Be the first to offer a service'
                        : 'Be the first to create a listing'}
              </p>
              {!searchQuery &&
                filterType === 'all' &&
                filterToken === 'all' &&
                showCreateButton &&
                !isPublic && (
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
