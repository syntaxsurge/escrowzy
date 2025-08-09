'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  ShoppingCart,
  ListPlus,
  TrendingUp,
  Clock,
  Trophy,
  Target,
  Zap,
  Shield,
  Activity,
  ArrowRight,
  Coins,
  Users,
  DollarSign,
  Globe
} from 'lucide-react'
import useSWR from 'swr'

import {
  GamifiedHeader,
  GamifiedStatsCards,
  type StatCard
} from '@/components/blocks/trading'
import { navigationProgress } from '@/components/providers/navigation-progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
// import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib'
import { api } from '@/lib/api/http-client'
import { formatCurrency } from '@/lib/utils/string'

interface QuickStat {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

interface NavigationCard {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
  bgColor: string
  badge?: string
  stats?: QuickStat[]
}

export default function TradingHubDashboard() {
  // const { user } = useSession()
  const router = useRouter()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Fetch trading statistics
  const { data: userStats } = useSWR(
    apiEndpoints.listings.userStats,
    async () => {
      const res = await api.get(apiEndpoints.listings.userStats)
      return res.success ? res.data : null
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  )

  const { data: tradesData } = useSWR(
    apiEndpoints.trades.userWithParams('status=active'),
    async () => {
      const res = await api.get(
        apiEndpoints.trades.userWithParams('status=active')
      )
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
      refreshInterval: 60000,
      revalidateOnFocus: true
    }
  )

  // Prepare stats cards for the header
  const statsCards: StatCard[] = [
    {
      title: 'Active Trades',
      value: tradesData?.trades?.length ?? 0,
      subtitle: 'Trades in progress',
      icon: <TrendingUp className='h-5 w-5 text-white' />,
      badge: 'LIVE',
      colorScheme: 'blue'
    },
    {
      title: 'Active Listings',
      value: userStats?.activeListings ?? 0,
      subtitle: 'Your buy/sell offers',
      icon: <ListPlus className='h-5 w-5 text-white' />,
      badge: 'LISTED',
      colorScheme: 'green'
    },
    {
      title: 'Total Volume',
      value: formatCurrency(userStats?.totalVolume ?? '0', 'XTZ'),
      subtitle: 'Lifetime trading',
      icon: <Coins className='h-5 w-5 text-white' />,
      badge: 'LIFETIME',
      colorScheme: 'purple'
    },
    {
      title: 'Success Rate',
      value: userStats?.successRate ? `${userStats.successRate}%` : '100%',
      subtitle: 'Completed trades',
      icon: <Trophy className='h-5 w-5 text-white' />,
      badge: 'PERFORMANCE',
      colorScheme: 'yellow'
    }
  ]

  // Navigation cards for different sections
  const navigationCards: NavigationCard[] = [
    {
      title: 'Create New Listing',
      description: 'List crypto, domains, or services for sale',
      icon: <ListPlus className='h-6 w-6' />,
      href: appRoutes.trades.listings.create,
      color: 'from-indigo-500 to-blue-600',
      bgColor: 'hover:bg-indigo-500/10',
      badge: 'Quick Start',
      stats: [
        {
          label: 'Low Fees',
          value: '1-2%',
          icon: <DollarSign className='h-4 w-4' />
        },
        {
          label: 'Secure',
          value: '100%',
          icon: <Shield className='h-4 w-4' />
        }
      ]
    },
    {
      title: 'Browse Marketplace',
      description: 'Find crypto, domain, and other listings',
      icon: <ShoppingCart className='h-6 w-6' />,
      href: appRoutes.trades.listings.base,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'hover:bg-blue-500/10',
      badge: 'Popular',
      stats: [
        {
          label: 'P2P Listings',
          value:
            (marketStats?.totalActiveListings || 0) -
            (marketStats?.totalDomainListings || 0),
          icon: <Zap className='h-4 w-4' />
        },
        {
          label: 'Domains',
          value: marketStats?.totalDomainListings || 0,
          icon: <Globe className='h-4 w-4' />
        }
      ]
    },
    {
      title: 'Active Trades',
      description: 'View and manage your ongoing trades',
      icon: <TrendingUp className='h-6 w-6' />,
      href: appRoutes.trades.active,
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'hover:bg-yellow-500/10',
      badge:
        tradesData?.trades?.length > 0
          ? `${tradesData.trades.length} Active`
          : undefined,
      stats: [
        {
          label: 'In Escrow',
          value:
            tradesData?.trades?.filter((t: any) => t.status === 'funded')
              .length || 0,
          icon: <Shield className='h-4 w-4' />
        },
        {
          label: 'Awaiting',
          value:
            tradesData?.trades?.filter(
              (t: any) => t.status === 'awaiting_deposit'
            ).length || 0,
          icon: <Clock className='h-4 w-4' />
        }
      ]
    },
    {
      title: 'My Listings',
      description: 'Manage your buy and sell offers',
      icon: <ListPlus className='h-6 w-6' />,
      href: appRoutes.trades.myListings,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'hover:bg-green-500/10',
      badge:
        userStats?.activeListings > 0
          ? `${userStats.activeListings} Active`
          : undefined,
      stats: [
        {
          label: 'Active',
          value: userStats?.activeListings || 0,
          icon: <Activity className='h-4 w-4' />,
          trend: 'up'
        },
        {
          label: 'Views',
          value: userStats?.totalViews || 0,
          icon: <Users className='h-4 w-4' />
        }
      ]
    },
    {
      title: 'Trade History',
      description: 'View your completed trades and stats',
      icon: <Clock className='h-6 w-6' />,
      href: appRoutes.trades.history.base,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'hover:bg-purple-500/10',
      stats: [
        {
          label: 'Completed',
          value: userStats?.completedTrades || 0,
          icon: <Trophy className='h-4 w-4' />
        },
        {
          label: 'This Month',
          value: userStats?.monthlyTrades || 0,
          icon: <Target className='h-4 w-4' />
        }
      ]
    },
    {
      title: 'Trading Chats',
      description: 'Message buyers and sellers directly',
      icon: <Activity className='h-6 w-6' />,
      href: appRoutes.withParams.tradesTab(appRoutes.chat.base),
      color: 'from-pink-500 to-rose-600',
      bgColor: 'hover:bg-pink-500/10',
      badge: tradesData?.trades?.length > 0 ? 'Messages' : undefined,
      stats: [
        {
          label: 'Active Chats',
          value: tradesData?.trades?.length || 0,
          icon: <Users className='h-4 w-4' />
        },
        {
          label: 'Quick Reply',
          value: '< 5min',
          icon: <Zap className='h-4 w-4' />
        }
      ]
    }
  ]

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-8 py-6'>
        {/* Gaming Header */}
        <GamifiedHeader
          title='TRADING HUB'
          subtitle='Your central command for secure trading and escrow management'
          icon={<Zap className='h-8 w-8 text-white' />}
          actions={
            <div className='flex gap-3'>
              <Button
                onClick={() => {
                  navigationProgress.start()
                  router.push(appRoutes.trades.listings.create)
                }}
                size='lg'
                className='border-0 bg-gradient-to-r from-green-600 to-emerald-700 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-800 hover:shadow-xl'
              >
                <ListPlus className='mr-2 h-5 w-5' />
                CREATE LISTING
              </Button>
              <Button
                onClick={() => {
                  navigationProgress.start()
                  router.push(appRoutes.dashboard.base)
                }}
                size='lg'
                variant='outline'
                className='border-primary/30 hover:border-primary/50 hover:bg-primary/10 font-bold backdrop-blur-sm transition-all hover:scale-105'
              >
                <Activity className='mr-2 h-5 w-5' />
                MAIN DASHBOARD
              </Button>
            </div>
          }
        />

        {/* Gaming Stats Cards */}
        <GamifiedStatsCards cards={statsCards} />

        {/* Navigation Cards Grid */}
        <div className='grid gap-6 md:grid-cols-2'>
          {navigationCards.map(card => (
            <Link
              key={card.href}
              href={card.href}
              onMouseEnter={() => setHoveredCard(card.title)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Card
                className={cn(
                  'group relative overflow-hidden transition-all duration-500',
                  'hover:scale-[1.02] hover:shadow-2xl',
                  'from-background via-muted/50 to-primary/5 dark:to-primary/10 bg-gradient-to-br',
                  'border-2 backdrop-blur-sm',
                  hoveredCard === card.title
                    ? 'border-primary/60 shadow-primary/20 shadow-xl'
                    : 'border-border/50 hover:border-border'
                )}
              >
                {/* Progress Bar Effect */}
                <div className='absolute top-0 right-0 left-0 h-1 bg-black/20 dark:bg-white/10'>
                  <div
                    className={cn(
                      'h-full bg-gradient-to-r transition-all duration-1000',
                      card.color,
                      hoveredCard === card.title ? 'w-full' : 'w-0'
                    )}
                  >
                    <div className='animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent' />
                  </div>
                </div>

                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-4'>
                      <div
                        className={cn(
                          'rounded-lg bg-gradient-to-br p-3 shadow-lg transition-transform group-hover:rotate-12',
                          card.color
                        )}
                      >
                        {card.icon}
                      </div>
                      <div>
                        <CardTitle className='text-xl font-black'>
                          {card.title}
                        </CardTitle>
                        <CardDescription className='mt-1'>
                          {card.description}
                        </CardDescription>
                      </div>
                    </div>
                    {card.badge && (
                      <Badge
                        className={cn(
                          'border-0 font-bold',
                          card.badge === 'Popular' &&
                            'bg-blue-500/20 text-blue-600 dark:text-blue-400',
                          card.badge.includes('Active') &&
                            'bg-green-500/20 text-green-600 dark:text-green-400'
                        )}
                      >
                        {card.badge}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                {card.stats && card.stats.length > 0 && (
                  <CardContent>
                    <div className='grid grid-cols-2 gap-4'>
                      {card.stats.map((stat, index) => (
                        <div
                          key={index}
                          className='border-border/50 bg-muted/50 flex items-center gap-2 rounded-lg border p-3'
                        >
                          <div className='text-muted-foreground'>
                            {stat.icon}
                          </div>
                          <div>
                            <p className='text-2xl font-bold'>{stat.value}</p>
                            <p className='text-muted-foreground text-xs'>
                              {stat.label}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}

                {/* Action Indicator */}
                <div className='absolute right-4 bottom-4 opacity-0 transition-opacity group-hover:opacity-100'>
                  <div className='text-primary flex items-center gap-1'>
                    <span className='text-sm font-bold'>View</span>
                    <ArrowRight className='h-4 w-4' />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
