'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  ListPlus,
  Plus,
  Shield,
  TrendingUp,
  Eye,
  Activity,
  Zap,
  Globe,
  ShoppingCart,
  DollarSign
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { api } from '@/lib/api/http-client'
import type { EscrowListingWithUser } from '@/types/listings'

export default function MyListingsPage() {
  const router = useRouter()
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'p2p' | 'domain' | 'service'
  >('all')

  // Fetch user's listings (both jobs and services from jobPostings table)
  const {
    data: listingsData,
    mutate: mutateListings,
    isLoading
  } = useSWR(
    `${apiEndpoints.jobs.base}?clientId=current`,
    async () => {
      const res = await api.get(
        `${apiEndpoints.jobs.base}?clientId=current&status=all`
      )
      if (res.success) {
        // Transform jobs data to match the expected format
        return {
          listings:
            res.data?.jobs?.map((job: any) => ({
              ...job,
              listingCategory:
                job.postingType === 'service' ? 'service' : 'job',
              listingType: job.postingType === 'service' ? 'sell' : 'buy',
              isActive: job.status === 'open',
              amount: job.servicePrice || job.budgetMin || '0',
              pricePerUnit: job.pricePerUnit,
              user: job.client
            })) || []
        }
      }
      return { listings: [] }
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  )

  // Fetch user stats
  const { data: userStatsData, mutate: mutateUserStats } = useSWR(
    apiEndpoints.listings.userStats,
    async () => {
      const res = await api.get(apiEndpoints.listings.userStats)
      if (res.success) {
        return res.data || null
      }
      return null
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  )

  const handleListingUpdate = () => {
    mutateListings()
    mutateUserStats()
  }

  // Filter listings by category
  const allListings = listingsData?.listings || []
  const filteredListings = allListings.filter((l: any) => {
    if (categoryFilter === 'all') return true
    // Service category includes both services and jobs
    if (categoryFilter === 'service') {
      return l.listingCategory === 'service' || l.listingCategory === 'job'
    }
    return l.listingCategory === categoryFilter
  })

  // Calculate listings
  const activeListings = filteredListings.filter(
    (l: EscrowListingWithUser) => l.isActive
  )
  const inactiveListings = filteredListings.filter(
    (l: EscrowListingWithUser) => !l.isActive
  )

  // Calculate actual stats from listings
  const actualActiveCount = activeListings.length
  const _actualTotalCount = listingsData?.listings?.length || 0

  // Prepare stats cards based on category filter
  const statsCards: StatCard[] =
    categoryFilter === 'service'
      ? [
          {
            title: 'Active Services',
            value: actualActiveCount,
            subtitle: 'Services available',
            icon: <ShoppingCart className='h-5 w-5 text-white' />,
            badge: 'SERVICES',
            colorScheme: 'green'
          },
          {
            title: 'Avg Rate',
            value:
              activeListings.length > 0
                ? `$${Math.round(
                    activeListings.reduce(
                      (sum: number, l: EscrowListingWithUser) =>
                        sum + parseFloat(l.pricePerUnit || l.amount || '0'),
                      0
                    ) / activeListings.length
                  )}`
                : '$0',
            subtitle: 'Average service rate',
            icon: <DollarSign className='h-5 w-5 text-white' />,
            badge: 'PRICING',
            colorScheme: 'purple'
          },
          {
            title: 'Total Views',
            value: userStatsData?.totalViews ?? 0,
            subtitle: 'All-time service views',
            icon: <Eye className='h-5 w-5 text-white' />,
            badge: 'VISIBILITY',
            colorScheme: 'blue'
          },
          {
            title: 'Response Time',
            value: userStatsData?.avgResponseTime
              ? `${userStatsData.avgResponseTime}m`
              : 'N/A',
            subtitle: 'Time to first response',
            icon: <Activity className='h-5 w-5 text-white' />,
            badge: 'SPEED',
            colorScheme: 'yellow'
          }
        ]
      : [
          {
            title:
              categoryFilter === 'domain'
                ? 'Active Domains'
                : categoryFilter === 'p2p'
                  ? 'Active P2P'
                  : 'Active Listings',
            value: actualActiveCount,
            subtitle: 'Currently active offers',
            icon:
              categoryFilter === 'domain' ? (
                <Globe className='h-5 w-5 text-white' />
              ) : (
                <ListPlus className='h-5 w-5 text-white' />
              ),
            badge: 'ACTIVE',
            colorScheme: categoryFilter === 'domain' ? 'purple' : 'green'
          },
          {
            title: 'Total Views',
            value: userStatsData?.totalViews ?? 0,
            subtitle: 'All-time listing views',
            icon: <Eye className='h-5 w-5 text-white' />,
            badge: 'VISIBILITY',
            colorScheme: 'blue'
          },
          {
            title: 'Conversion Rate',
            value: userStatsData?.conversionRate
              ? `${userStatsData.conversionRate}%`
              : '0%',
            subtitle: 'Listings to trades',
            icon: <TrendingUp className='h-5 w-5 text-white' />,
            badge: 'PERFORMANCE',
            colorScheme: 'purple'
          },
          {
            title: 'Avg Response Time',
            value: userStatsData?.avgResponseTime
              ? `${userStatsData.avgResponseTime}m`
              : 'N/A',
            subtitle: 'Time to first response',
            icon: <Activity className='h-5 w-5 text-white' />,
            badge: 'SPEED',
            colorScheme: 'yellow'
          }
        ]

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-8 py-6'>
        {/* Gaming Header */}
        <GamifiedHeader
          title='MY LISTINGS'
          subtitle={
            categoryFilter === 'domain'
              ? 'Manage your domain listings'
              : categoryFilter === 'p2p'
                ? 'Manage your P2P crypto offers'
                : categoryFilter === 'service'
                  ? 'Manage your professional services'
                  : 'Manage all your marketplace listings'
          }
          icon={<Shield className='h-8 w-8 text-white' />}
          actions={
            <Button
              onClick={() => {
                navigationProgress.start()
                router.push(appRoutes.trades.listings.create)
              }}
              size='lg'
              className='border-0 bg-gradient-to-r from-green-600 to-emerald-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-800 hover:shadow-xl'
            >
              <Plus className='mr-2 h-5 w-5' />
              CREATE NEW LISTING
            </Button>
          }
        />

        {/* Category Tabs */}
        <Tabs
          value={categoryFilter}
          onValueChange={v => setCategoryFilter(v as any)}
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
              P2P CRYPTO
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
              <ShoppingCart className='mr-2 h-4 w-4' />
              SERVICES
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Gaming Stats Cards */}
        <GamifiedStatsCards cards={statsCards} />

        {/* Loading State */}
        {isLoading && (
          <div className='flex min-h-[400px] items-center justify-center'>
            <div className='text-center'>
              <div className='mb-4 text-2xl font-black'>
                Loading listings...
              </div>
            </div>
          </div>
        )}

        {/* Active Listings Section */}
        {!isLoading && activeListings.length > 0 && (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='h-8 w-1 rounded-full bg-gradient-to-b from-green-500 to-emerald-600' />
              <h2 className='text-2xl font-black'>
                ACTIVE LISTINGS ({activeListings.length})
              </h2>
              <div className='ml-2 rounded-full bg-green-500/20 px-3 py-1'>
                <span className='text-xs font-bold text-green-600 dark:text-green-400'>
                  LIVE
                </span>
              </div>
            </div>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {activeListings.map((listing: EscrowListingWithUser) => (
                <GamifiedListingCard
                  key={listing.id}
                  listing={listing}
                  onUpdate={handleListingUpdate}
                  showManageButton
                />
              ))}
            </div>
          </div>
        )}

        {/* Inactive Listings Section */}
        {!isLoading && inactiveListings.length > 0 && (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='h-8 w-1 rounded-full bg-gradient-to-b from-gray-500 to-gray-600' />
              <h2 className='text-2xl font-black text-gray-600 dark:text-gray-400'>
                INACTIVE LISTINGS ({inactiveListings.length})
              </h2>
              <div className='ml-2 rounded-full bg-gray-500/20 px-3 py-1'>
                <span className='text-xs font-bold text-gray-600 dark:text-gray-400'>
                  PAUSED
                </span>
              </div>
            </div>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {inactiveListings.map((listing: EscrowListingWithUser) => (
                <GamifiedListingCard
                  key={listing.id}
                  listing={listing}
                  onUpdate={handleListingUpdate}
                  showManageButton
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading &&
          listingsData &&
          (!listingsData.listings || listingsData.listings.length === 0) && (
            <div className='flex min-h-[400px] items-center justify-center'>
              <div className='text-center'>
                <div className='mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20'>
                  <ListPlus className='h-12 w-12 text-green-600 dark:text-green-400' />
                </div>
                <h3 className='mb-2 text-2xl font-black'>NO LISTINGS YET</h3>
                <p className='text-muted-foreground mb-6'>
                  Create your first listing to start trading
                </p>
                <Button
                  onClick={() => {
                    navigationProgress.start()
                    router.push(appRoutes.trades.listings.create)
                  }}
                  size='lg'
                  className='border-0 bg-gradient-to-r from-green-600 to-emerald-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-800 hover:shadow-xl'
                >
                  <Plus className='mr-2 h-5 w-5' />
                  CREATE YOUR FIRST LISTING
                </Button>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
