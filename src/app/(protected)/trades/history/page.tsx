import { Suspense } from 'react'

import { Clock, Globe } from 'lucide-react'

import { TableSkeleton } from '@/components/blocks/table/table-skeleton'
import {
  GamifiedHeader,
  GamifiedStatsCards,
  type StatCard
} from '@/components/blocks/trading'
import { apiEndpoints } from '@/config/api-endpoints'
import { serverFetch } from '@/lib/api/server-utils'
import { getSession } from '@/lib/auth/session'

import { TradeHistoryContent } from './trade-history-content'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getTradeHistory(
  searchParams: Record<string, string | string[] | undefined>
) {
  const params = new URLSearchParams()

  // Forward all search params to the API
  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (value) {
      params.append(key, String(value))
    }
  })

  return serverFetch(`${apiEndpoints.trades.table}?${params.toString()}`, {
    cache: 'no-store'
  })
}

export default async function TradeHistoryPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const session = await getSession()

  // Get stats data for header
  const statsData = await serverFetch(apiEndpoints.trades.stats, {
    cache: 'no-store'
  }).catch(() => null)

  const listingCategoryFilter =
    (resolvedSearchParams.listingCategory as string) || 'all'

  // Prepare stats cards
  const statsCards: StatCard[] = statsData
    ? [
        {
          title:
            listingCategoryFilter === 'domain'
              ? 'Domain Trades'
              : listingCategoryFilter === 'p2p'
                ? 'P2P Trades'
                : 'Total Trades',
          value: statsData.totalTrades || 0,
          subtitle: 'All-time trades',
          icon:
            listingCategoryFilter === 'domain' ? (
              <Globe className='h-5 w-5 text-white' />
            ) : (
              <Clock className='h-5 w-5 text-white' />
            ),
          badge: 'HISTORY',
          colorScheme: listingCategoryFilter === 'domain' ? 'purple' : 'blue'
        },
        {
          title: 'Pending',
          value: statsData.pendingTrades || 0,
          subtitle: 'In progress',
          icon: <Clock className='h-5 w-5 text-white' />,
          badge: 'ACTIVE',
          colorScheme: 'orange'
        },
        {
          title: 'Completed',
          value: statsData.completedTrades || 0,
          subtitle: 'Successfully finished',
          icon: <Clock className='h-5 w-5 text-white' />,
          badge: 'SUCCESS',
          colorScheme: 'green'
        },
        {
          title: 'Success Rate',
          value: `${statsData.successRate || 100}%`,
          subtitle: 'Completion rate',
          icon: <Clock className='h-5 w-5 text-white' />,
          badge: 'PERFORMANCE',
          colorScheme: 'yellow'
        }
      ]
    : []

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-8 py-6'>
        {/* Gaming Header */}
        <GamifiedHeader
          title='TRADE HISTORY'
          subtitle={
            listingCategoryFilter === 'domain'
              ? 'View your domain escrow transaction history'
              : listingCategoryFilter === 'p2p'
                ? 'View your P2P crypto transaction history'
                : 'View all your escrow transactions'
          }
          icon={<Clock className='h-8 w-8 text-white' />}
        />

        {/* Gaming Stats Cards */}
        <GamifiedStatsCards cards={statsCards} />

        {/* Trade History Content */}
        <Suspense
          fallback={<TableSkeleton variant='simple' showSection={false} />}
        >
          <TradeHistoryContent
            searchParams={resolvedSearchParams}
            userId={session?.user?.id}
          />
        </Suspense>
      </div>
    </div>
  )
}
