'use client'

import { useRouter } from 'next/navigation'

import { ListPlus, Plus, Shield, TrendingUp, Eye, Activity } from 'lucide-react'
import useSWR from 'swr'

import {
  GamifiedHeader,
  GamifiedStatsCards,
  GamifiedListingCard,
  type StatCard
} from '@/components/blocks/trading'
import { navigationProgress } from '@/components/providers/navigation-progress'
import { Button } from '@/components/ui/button'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { api } from '@/lib/api/http-client'
import type { P2PListingWithUser } from '@/types/p2p-listings'

export default function MyListingsPage() {
  const router = useRouter()

  // Fetch user's listings
  const {
    data: listingsData,
    mutate: mutateListings,
    isLoading
  } = useSWR(
    apiEndpoints.listings.user,
    async () => {
      const res = await api.get(apiEndpoints.listings.user)
      // The API returns { success: true, data: { listings: [...] } }
      // But api.get puts the whole response in data, so we need res.data.data
      if (res.success && res.data) {
        // Check if res.data has a nested data property (double wrapping issue)
        if ('data' in res.data && 'success' in res.data) {
          return res.data.data
        }
        return res.data
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
      // Handle the same double-wrapping issue
      if (res.success && res.data) {
        // Check if res.data has a nested data property (double wrapping issue)
        if ('data' in res.data && 'success' in res.data) {
          return res.data.data
        }
        return res.data
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

  // Calculate listings
  const activeListings =
    listingsData?.listings?.filter((l: P2PListingWithUser) => l.isActive) || []
  const inactiveListings =
    listingsData?.listings?.filter((l: P2PListingWithUser) => !l.isActive) || []

  // Calculate actual stats from listings
  const actualActiveCount = activeListings.length
  const _actualTotalCount = listingsData?.listings?.length || 0

  // Prepare stats cards
  const statsCards: StatCard[] = [
    {
      title: 'Active Listings',
      value: userStatsData?.activeListings ?? actualActiveCount,
      subtitle: 'Currently active offers',
      icon: <ListPlus className='h-5 w-5 text-white' />,
      badge: 'ACTIVE',
      colorScheme: 'green'
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
          subtitle='Manage your buy and sell offers in the P2P marketplace'
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
              {activeListings.map((listing: P2PListingWithUser) => (
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
            <div className='grid gap-6 opacity-60 md:grid-cols-2 lg:grid-cols-3'>
              {inactiveListings.map((listing: P2PListingWithUser) => (
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
