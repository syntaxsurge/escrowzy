'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Trophy,
  History
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/string'
import { getUserDisplayName } from '@/lib/utils/user'
import { TRADE_STATUS, type TradeStatus } from '@/types/p2p-listings'
import type { TradeWithUsers } from '@/types/trade'

type FilterStatus =
  | 'all'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded'

export default function TradeHistoryPage() {
  const router = useRouter()
  const { user } = useSession()
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('all')

  // Fetch trade history
  const { data: tradesData } = useSWR(
    apiEndpoints.trades.user,
    async () => {
      const res = await api.get(apiEndpoints.trades.user)
      return res.success ? res.data : null
    },
    {
      refreshInterval: 60000,
      revalidateOnFocus: true
    }
  )

  // Get all trades (including pending ones)
  const allTrades = tradesData?.trades || []

  // Define pending statuses
  const pendingStatuses: TradeStatus[] = [
    TRADE_STATUS.CREATED,
    TRADE_STATUS.AWAITING_DEPOSIT,
    TRADE_STATUS.FUNDED,
    TRADE_STATUS.PAYMENT_SENT,
    TRADE_STATUS.PAYMENT_CONFIRMED,
    TRADE_STATUS.DELIVERED,
    TRADE_STATUS.CONFIRMED
  ]

  // Apply filters
  const filteredTrades = allTrades.filter((trade: TradeWithUsers) => {
    // Status filter
    if (filterStatus !== 'all') {
      if (
        filterStatus === 'pending' &&
        !pendingStatuses.includes(trade.status as TradeStatus)
      )
        return false
      if (filterStatus !== 'pending' && trade.status !== filterStatus)
        return false
    }

    // Period filter
    if (filterPeriod !== 'all') {
      const tradeDate = new Date(trade.createdAt)
      const now = new Date()
      const daysDiff = Math.floor(
        (now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      switch (filterPeriod) {
        case '7days':
          if (daysDiff > 7) return false
          break
        case '30days':
          if (daysDiff > 30) return false
          break
        case '90days':
          if (daysDiff > 90) return false
          break
      }
    }

    return true
  })

  // Calculate statistics
  const stats = {
    totalTrades: allTrades.length,
    pendingTrades: allTrades.filter((t: TradeWithUsers) =>
      pendingStatuses.includes(t.status as TradeStatus)
    ).length,
    completedTrades: allTrades.filter(
      (t: TradeWithUsers) => t.status === 'completed'
    ).length,
    disputedTrades: allTrades.filter(
      (t: TradeWithUsers) => t.status === 'disputed'
    ).length,
    totalVolume: allTrades
      .filter((t: TradeWithUsers) => t.status === 'completed')
      .reduce((sum: number, t: TradeWithUsers) => sum + parseFloat(t.amount), 0)
  }

  const successRate =
    stats.totalTrades > 0
      ? Math.round((stats.completedTrades / stats.totalTrades) * 100)
      : 100

  // Prepare stats cards
  const statsCards: StatCard[] = [
    {
      title: 'Total Trades',
      value: stats.totalTrades,
      subtitle: 'All-time trades',
      icon: <History className='h-5 w-5 text-white' />,
      badge: 'HISTORY',
      colorScheme: 'blue'
    },
    {
      title: 'Pending',
      value: stats.pendingTrades,
      subtitle: 'In progress',
      icon: <Clock className='h-5 w-5 text-white' />,
      badge: 'ACTIVE',
      colorScheme: 'orange'
    },
    {
      title: 'Completed',
      value: stats.completedTrades,
      subtitle: 'Successfully finished',
      icon: <CheckCircle className='h-5 w-5 text-white' />,
      badge: 'SUCCESS',
      colorScheme: 'green'
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      subtitle: 'Completion rate',
      icon: <Trophy className='h-5 w-5 text-white' />,
      badge: 'PERFORMANCE',
      colorScheme: 'yellow'
    }
  ]

  // Get status badge color
  const getStatusBadge = (status: string) => {
    // Check if it's a pending status
    if (pendingStatuses.includes(status as TradeStatus)) {
      const pendingLabel = status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      return (
        <Badge className='border-0 bg-orange-500/20 text-orange-600 dark:text-orange-400'>
          <Clock className='mr-1 h-3 w-3' />
          {pendingLabel}
        </Badge>
      )
    }

    switch (status) {
      case 'completed':
        return (
          <Badge className='border-0 bg-green-500/20 text-green-600 dark:text-green-400'>
            <CheckCircle className='mr-1 h-3 w-3' />
            Completed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className='border-0 bg-gray-500/20 text-gray-600 dark:text-gray-400'>
            <XCircle className='mr-1 h-3 w-3' />
            Cancelled
          </Badge>
        )
      case 'disputed':
        return (
          <Badge className='border-0 bg-red-500/20 text-red-600 dark:text-red-400'>
            <AlertCircle className='mr-1 h-3 w-3' />
            Disputed
          </Badge>
        )
      case 'refunded':
        return (
          <Badge className='border-0 bg-blue-500/20 text-blue-600 dark:text-blue-400'>
            <Clock className='mr-1 h-3 w-3' />
            Refunded
          </Badge>
        )
      case 'deposit_timeout':
        return (
          <Badge className='border-0 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'>
            <AlertCircle className='mr-1 h-3 w-3' />
            Deposit Timeout
          </Badge>
        )
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  return (
    <div className='from-background via-background to-primary/5 dark:to-primary/10 min-h-screen bg-gradient-to-br'>
      <div className='container mx-auto space-y-8 py-6'>
        {/* Gaming Header */}
        <GamifiedHeader
          title='TRADE HISTORY'
          subtitle='View all your trades including pending and completed transactions'
          icon={<Clock className='h-8 w-8 text-white' />}
        />

        {/* Gaming Stats Cards */}
        <GamifiedStatsCards cards={statsCards} />

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
                onValueChange={(value: FilterStatus) => setFilterStatus(value)}
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

              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
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

        {/* Trade History Table */}
        <Card className='border-primary/20 from-primary/5 border-2 bg-gradient-to-br to-purple-600/5'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5 text-purple-500' />
              Trade History ({filteredTrades.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTrades.length > 0 ? (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trade ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Other Party</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map((trade: TradeWithUsers) => {
                      const isBuyer = user?.id === trade.buyerId
                      const otherParty = isBuyer ? trade.seller : trade.buyer
                      const tradeType = isBuyer ? 'Buy' : 'Sell'

                      return (
                        <TableRow key={trade.id}>
                          <TableCell className='font-mono text-sm'>
                            #{trade.id.toString().slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant='outline'
                              className={
                                isBuyer
                                  ? 'border-green-500/30 text-green-600 dark:text-green-400'
                                  : 'border-blue-500/30 text-blue-600 dark:text-blue-400'
                              }
                            >
                              {tradeType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getUserDisplayName(otherParty)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(trade.amount, trade.currency)}
                          </TableCell>
                          <TableCell>{getStatusBadge(trade.status)}</TableCell>
                          <TableCell>
                            {formatRelativeTime(trade.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                navigationProgress.start()
                                router.push(
                                  appRoutes.trades.history.detail(
                                    trade.id.toString()
                                  )
                                )
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className='flex min-h-[300px] items-center justify-center'>
                <div className='text-center'>
                  <div className='mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-600/20'>
                    <Clock className='h-10 w-10 text-purple-600 dark:text-purple-400' />
                  </div>
                  <h3 className='mb-2 text-xl font-bold'>NO TRADES FOUND</h3>
                  <p className='text-muted-foreground'>
                    {filterStatus !== 'all' || filterPeriod !== 'all'
                      ? 'No trades found with the selected filters'
                      : 'You have no trades yet'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
