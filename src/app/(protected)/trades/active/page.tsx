'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'

import {
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  Zap,
  Flame
} from 'lucide-react'
import useSWR from 'swr'

import {
  GamifiedHeader,
  GamifiedStatsCards,
  ActionAlert,
  type StatCard
} from '@/components/blocks/trading'
import { navigationProgress } from '@/components/providers/navigation-progress'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { useTradeRealtime } from '@/hooks/use-trade-realtime'
import { cn } from '@/lib'
import { api } from '@/lib/api/http-client'
import type { TradeWithUsers } from '@/types/trade'

import { GamifiedTradeCard } from './gamified-trade-card'
import { TradeTable } from './trade-table'

export default function ActiveTradesPage() {
  const router = useRouter()
  const { user } = useSession()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all')

  // Fetch user's active trades
  const {
    data: response,
    error,
    isLoading,
    mutate
  } = useSWR(
    apiEndpoints.trades.userWithParams('status=active'),
    async () => {
      const res = await api.get(
        apiEndpoints.trades.userWithParams('status=active')
      )
      return res.success ? res.data : null
    },
    {
      refreshInterval: 30000, // Reduced to 30 seconds since we have real-time updates
      revalidateOnFocus: true
    }
  )

  const trades = response?.trades || []

  // Real-time trade updates
  const handleTradeUpdate = useCallback(
    (updatedTrade: TradeWithUsers) => {
      mutate((currentResponse: any) => {
        if (!currentResponse || !currentResponse.trades) {
          return {
            ...currentResponse,
            trades: [updatedTrade]
          }
        }

        const trades = currentResponse.trades
        const index = trades.findIndex(
          (t: TradeWithUsers) => t.id === updatedTrade.id
        )

        if (index === -1) {
          // New trade, add to beginning
          return {
            ...currentResponse,
            trades: [updatedTrade, ...trades],
            total: currentResponse.total + 1
          }
        }

        // Update existing trade
        const newTrades = [...trades]
        newTrades[index] = updatedTrade
        return {
          ...currentResponse,
          trades: newTrades
        }
      }, false)
    },
    [mutate]
  )

  const handleStatusChange = useCallback(
    (tradeId: number, newStatus: string) => {
      // Optionally show a toast notification here
      console.log(`Trade ${tradeId} status changed to ${newStatus}`)
    },
    []
  )

  // Set up real-time listeners
  useTradeRealtime({
    userId: user?.id,
    onTradeUpdate: handleTradeUpdate,
    onStatusChange: handleStatusChange
  })

  // Filter trades based on user role
  const filteredTrades = trades.filter((trade: TradeWithUsers) => {
    if (filter === 'all') return true
    // Check if current user is buyer or seller
    return filter === 'buyer'
      ? trade.buyerId === user?.id
      : trade.sellerId === user?.id
  })

  const activeTrades = filteredTrades.filter((t: TradeWithUsers) =>
    [
      'created',
      'awaiting_deposit',
      'funded',
      'payment_sent',
      'delivered'
    ].includes(t.status)
  )
  const disputedTrades = filteredTrades.filter(
    (t: TradeWithUsers) => t.status === 'disputed'
  )

  if (isLoading) {
    return (
      <div className='container mx-auto py-6'>
        <div className='flex justify-center py-12'>
          <Spinner size='lg' />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='container mx-auto py-6'>
        <Card className='p-8 text-center'>
          <p className='text-destructive mb-4'>Failed to load your trades</p>
          <Button variant='outline' onClick={() => mutate()}>
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-8 py-6'>
        {/* Gaming Header with Parallax Effect */}
        <GamifiedHeader
          title='ACTIVE TRADES'
          subtitle='Manage your ongoing P2P transactions'
          icon={<TrendingUp className='h-8 w-8 text-white' />}
          actions={
            <Button
              onClick={() => {
                navigationProgress.start()
                router.push(appRoutes.trades.listings.base)
              }}
              className='border-0 bg-gradient-to-r from-blue-600 to-blue-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl'
            >
              <Sparkles className='mr-2 h-5 w-5' />
              BROWSE LISTINGS
            </Button>
          }
        />

        {/* Gaming Stats Dashboard */}
        <GamifiedStatsCards
          cards={
            [
              {
                title: 'Active Trades',
                value: activeTrades.length,
                icon: <Zap className='h-5 w-5 text-white' />,
                badge: 'ACTIVE',
                colorScheme: 'yellow'
              },
              {
                title: 'In Escrow',
                value: trades.filter(
                  (t: TradeWithUsers) => t.status === 'funded'
                ).length,
                icon: <Shield className='h-5 w-5 text-white' />,
                badge: 'SECURED',
                colorScheme: 'blue'
              },
              {
                title: 'Need Action',
                value: trades.filter(
                  (t: TradeWithUsers) =>
                    t.status === 'created' ||
                    t.status === 'awaiting_deposit' ||
                    t.status === 'delivered'
                ).length,
                icon: <Target className='h-5 w-5 text-white' />,
                badge: 'ACTION',
                colorScheme: 'orange'
              },
              {
                title: 'Under Review',
                value: disputedTrades.length,
                icon: <Flame className='h-5 w-5 text-white' />,
                badge: 'ALERT',
                colorScheme: 'red'
              }
            ] as StatCard[]
          }
        />

        {/* Gaming Action Alert */}
        {trades.some(
          (t: TradeWithUsers) =>
            t.status === 'awaiting_deposit' && t.sellerId === user?.id
        ) && (
          <ActionAlert
            title='⚡ ACTION REQUIRED: DEPOSIT CRYPTO'
            description='Your trading partner is waiting! Complete the crypto deposit to secure the escrow and proceed with your epic trade.'
            icon={<Flame className='h-6 w-6 text-white' />}
            badge='ACTION NOW'
            actionCount={
              trades.filter(
                (t: TradeWithUsers) =>
                  t.status === 'awaiting_deposit' && t.sellerId === user?.id
              ).length
            }
            variant='warning'
            progressBar={true}
            progressValue={75}
          />
        )}

        {/* Gaming Disputed Alert */}
        {disputedTrades.length > 0 && (
          <ActionAlert
            title='⚠️ DISPUTE ALERT: RESOLUTION NEEDED'
            description={`You have ${disputedTrades.length} disputed trade${disputedTrades.length > 1 ? 's' : ''} in the resolution queue. Resolve quickly to maintain your reputation score!`}
            icon={<AlertCircle className='h-6 w-6 text-white' />}
            actionCount={disputedTrades.length}
            variant='danger'
          />
        )}

        {/* Gaming Tabs */}
        <Tabs defaultValue='active' className='space-y-6'>
          <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <TabsList className='from-background/80 to-muted/80 border-primary/20 border bg-gradient-to-r backdrop-blur-sm'>
              <TabsTrigger
                value='active'
                className='font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white'
              >
                <Zap className='mr-2 h-4 w-4' />
                Active ({activeTrades.length})
              </TabsTrigger>
              <TabsTrigger
                value='disputed'
                className='font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white'
              >
                <AlertTriangle className='mr-2 h-4 w-4' />
                Disputed ({disputedTrades.length})
              </TabsTrigger>
            </TabsList>

            <div className='flex items-center gap-3'>
              {/* Gaming Role Filter */}
              <div className='relative'>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value as any)}
                  className='from-background/80 to-muted/80 border-primary/20 hover:border-primary/40 focus:ring-primary/50 appearance-none rounded-lg border bg-gradient-to-r px-4 py-2 pr-10 text-sm font-medium backdrop-blur-sm transition-colors focus:ring-2 focus:outline-none'
                >
                  <option value='all'>🎮 All Trades</option>
                  <option value='buyer'>💰 As Buyer</option>
                  <option value='seller'>🏪 As Seller</option>
                </select>
                <div className='pointer-events-none absolute top-1/2 right-2 -translate-y-1/2'>
                  <Target className='text-muted-foreground h-4 w-4' />
                </div>
              </div>

              {/* Gaming View Toggle */}
              <div className='from-background/80 to-muted/80 border-primary/20 flex gap-1 rounded-lg border bg-gradient-to-r p-1 backdrop-blur-sm'>
                <Button
                  variant={view === 'grid' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setView('grid')}
                  className={cn(
                    'font-bold transition-all',
                    view === 'grid' &&
                      'border-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  )}
                >
                  <div className='mr-2 grid grid-cols-2 gap-0.5'>
                    <div className='h-1 w-1 rounded-sm bg-current' />
                    <div className='h-1 w-1 rounded-sm bg-current' />
                    <div className='h-1 w-1 rounded-sm bg-current' />
                    <div className='h-1 w-1 rounded-sm bg-current' />
                  </div>
                  Grid
                </Button>
                <Button
                  variant={view === 'table' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setView('table')}
                  className={cn(
                    'font-bold transition-all',
                    view === 'table' &&
                      'border-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  )}
                >
                  <div className='mr-2 flex flex-col gap-0.5'>
                    <div className='h-0.5 w-3 bg-current' />
                    <div className='h-0.5 w-3 bg-current' />
                    <div className='h-0.5 w-3 bg-current' />
                  </div>
                  Table
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value='active' className='space-y-4'>
            {activeTrades.length === 0 ? (
              <div className='from-primary/10 border-primary/20 hover:border-primary/30 relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br via-purple-600/10 to-pink-600/10 p-12 text-center backdrop-blur-sm transition-all'>
                <div className='bg-grid-white/5 dark:bg-grid-white/10 absolute inset-0' />
                <div className='relative z-10'>
                  <div className='relative mb-6 inline-block'>
                    <div className='from-primary absolute inset-0 animate-pulse rounded-full bg-gradient-to-r to-purple-600 opacity-40 blur-2xl' />
                    <div className='from-primary relative rounded-2xl bg-gradient-to-br via-purple-600 to-pink-600 p-4 shadow-xl'>
                      <MessageSquare className='h-12 w-12 text-white' />
                    </div>
                  </div>
                  <h3 className='from-primary mb-2 bg-gradient-to-r via-purple-600 to-pink-600 bg-clip-text text-2xl font-black text-transparent'>
                    NO ACTIVE TRADES
                  </h3>
                  <p className='text-muted-foreground mb-6 font-medium'>
                    Ready to start your trading adventure? Browse the
                    marketplace!
                  </p>
                  <Button
                    onClick={() => {
                      navigationProgress.start()
                      router.push(appRoutes.trades.listings.base)
                    }}
                    className='border-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl'
                  >
                    <Sparkles className='mr-2 h-5 w-5' />
                    BROWSE LISTINGS
                  </Button>
                </div>
              </div>
            ) : view === 'grid' ? (
              <div className='grid auto-rows-fr gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2'>
                {activeTrades.map((trade: TradeWithUsers) => (
                  <GamifiedTradeCard
                    key={trade.id}
                    trade={trade}
                    onUpdate={mutate}
                    userId={user?.id}
                  />
                ))}
              </div>
            ) : (
              <TradeTable trades={activeTrades} onUpdate={mutate} />
            )}
          </TabsContent>

          <TabsContent value='disputed' className='space-y-4'>
            {disputedTrades.length === 0 ? (
              <div className='relative overflow-hidden rounded-2xl border-2 border-green-500/20 bg-gradient-to-br from-green-500/10 via-emerald-600/10 to-teal-600/10 p-12 text-center backdrop-blur-sm transition-all hover:border-green-500/30'>
                <div className='bg-grid-white/5 dark:bg-grid-white/10 absolute inset-0' />
                <div className='relative z-10'>
                  <div className='relative mb-6 inline-block'>
                    <div className='absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-green-500 to-emerald-600 opacity-40 blur-2xl' />
                    <div className='relative rounded-2xl bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 p-4 shadow-xl'>
                      <Shield className='h-12 w-12 text-white' />
                    </div>
                  </div>
                  <h3 className='mb-2 bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 bg-clip-text text-2xl font-black text-transparent'>
                    ALL CLEAR!
                  </h3>
                  <p className='text-muted-foreground font-medium'>
                    No disputes - Your reputation remains perfect! 🏆
                  </p>
                </div>
              </div>
            ) : view === 'grid' ? (
              <div className='grid auto-rows-fr gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2'>
                {disputedTrades.map((trade: TradeWithUsers) => (
                  <GamifiedTradeCard
                    key={trade.id}
                    trade={trade}
                    onUpdate={mutate}
                    userId={user?.id}
                  />
                ))}
              </div>
            ) : (
              <TradeTable trades={disputedTrades} onUpdate={mutate} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
