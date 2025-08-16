'use client'

import { useState } from 'react'

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from 'chart.js'
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  TrendingUp,
  Wallet
} from 'lucide-react'
import { Line } from 'react-chartjs-2'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface EarningsWidgetProps {
  summary: {
    totalEarnings: number
    availableBalance: number
    pendingEarnings: number
    withdrawnAmount: number
    platformFees: number
    netEarnings: number
  }
  statistics: {
    currentMonthEarnings: number
    previousMonthEarnings: number
    growthRate: number
    averageProjectValue: number
    totalProjects: number
    totalHoursTracked?: number
    billableHours?: number
    averageHourlyRate?: number
  }
  recentEarnings: Array<{
    period: string
    amount: number
    count: number
    netAmount: number
  }>
  detailed?: boolean
}

export function EarningsWidget({
  summary,
  statistics,
  recentEarnings,
  detailed = false
}: EarningsWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30')

  // Prepare chart data
  const chartData = {
    labels: recentEarnings.map(e => {
      const date = new Date(e.period)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }),
    datasets: [
      {
        label: 'Earnings',
        data: recentEarnings.map(e => e.netAmount),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `$${value}`
        }
      }
    }
  }

  const earningsCards = [
    {
      title: 'Available Balance',
      value: summary.availableBalance,
      icon: Wallet,
      change: null,
      color: 'text-green-600'
    },
    {
      title: 'Pending Earnings',
      value: summary.pendingEarnings,
      icon: Calendar,
      change: null,
      color: 'text-yellow-600'
    },
    {
      title: 'This Month',
      value: statistics.currentMonthEarnings,
      icon: TrendingUp,
      change: statistics.growthRate,
      color: statistics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Total Withdrawn',
      value: summary.withdrawnAmount,
      icon: DollarSign,
      change: null,
      color: 'text-blue-600'
    }
  ]

  if (detailed) {
    return (
      <div className='space-y-4'>
        {/* Summary Cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {earningsCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  {card.title}
                </CardTitle>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  ${card.value.toFixed(2)}
                </div>
                {card.change !== null && (
                  <p className='text-muted-foreground flex items-center text-xs'>
                    {card.change >= 0 ? (
                      <ArrowUpRight className='mr-1 h-3 w-3 text-green-600' />
                    ) : (
                      <ArrowDownRight className='mr-1 h-3 w-3 text-red-600' />
                    )}
                    <span
                      className={
                        card.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {Math.abs(card.change).toFixed(1)}%
                    </span>
                    <span className='ml-1'>vs last month</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='space-y-2'>
                <p className='text-muted-foreground text-sm'>Total Earnings</p>
                <p className='text-2xl font-bold'>
                  ${summary.totalEarnings.toFixed(2)}
                </p>
              </div>
              <div className='space-y-2'>
                <p className='text-muted-foreground text-sm'>Platform Fees</p>
                <p className='text-2xl font-bold'>
                  ${summary.platformFees.toFixed(2)}
                </p>
              </div>
              <div className='space-y-2'>
                <p className='text-muted-foreground text-sm'>Net Earnings</p>
                <p className='text-2xl font-bold'>
                  ${summary.netEarnings.toFixed(2)}
                </p>
              </div>
            </div>

            {statistics.totalHoursTracked !== undefined && (
              <div className='mt-6 grid gap-4 border-t pt-6 md:grid-cols-3'>
                <div className='space-y-2'>
                  <p className='text-muted-foreground text-sm'>Hours Tracked</p>
                  <p className='text-xl font-bold'>
                    {statistics.totalHoursTracked.toFixed(1)}h
                  </p>
                </div>
                <div className='space-y-2'>
                  <p className='text-muted-foreground text-sm'>
                    Billable Hours
                  </p>
                  <p className='text-xl font-bold'>
                    {statistics.billableHours?.toFixed(1) || 0}h
                  </p>
                </div>
                <div className='space-y-2'>
                  <p className='text-muted-foreground text-sm'>
                    Avg Hourly Rate
                  </p>
                  <p className='text-xl font-bold'>
                    ${statistics.averageHourlyRate?.toFixed(2) || 0}/hr
                  </p>
                </div>
              </div>
            )}

            <div className='mt-6 grid gap-4 border-t pt-6 md:grid-cols-2'>
              <div className='space-y-2'>
                <p className='text-muted-foreground text-sm'>
                  Average Project Value
                </p>
                <p className='text-xl font-bold'>
                  ${statistics.averageProjectValue.toFixed(2)}
                </p>
              </div>
              <div className='space-y-2'>
                <p className='text-muted-foreground text-sm'>Total Projects</p>
                <p className='text-xl font-bold'>{statistics.totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Chart */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle>Earnings Trend</CardTitle>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className='w-[120px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='7'>7 days</SelectItem>
                <SelectItem value='30'>30 days</SelectItem>
                <SelectItem value='90'>90 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <Line data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center justify-between'>
          <span className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Earnings Overview
          </span>
          <Badge
            variant='outline'
            className={cn(
              'ml-auto',
              statistics.growthRate >= 0
                ? 'border-green-500/50 text-green-700 dark:text-green-300'
                : 'border-red-500/50 text-red-700 dark:text-red-300'
            )}
          >
            {statistics.growthRate >= 0 ? (
              <ArrowUpRight className='mr-1 h-3 w-3' />
            ) : (
              <ArrowDownRight className='mr-1 h-3 w-3' />
            )}
            {Math.abs(statistics.growthRate).toFixed(1)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Main Balance Display */}
          <div className='rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-4 dark:from-indigo-950/20 dark:to-purple-950/20'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>
                  Available Balance
                </p>
                <p className='text-3xl font-bold'>
                  ${summary.availableBalance.toFixed(2)}
                </p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  ${summary.pendingEarnings.toFixed(2)} pending
                </p>
              </div>
              <Button size='sm'>Withdraw</Button>
            </div>
          </div>

          {/* Mini Stats */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1'>
              <p className='text-muted-foreground text-xs'>This Month</p>
              <p className='text-xl font-semibold'>
                ${statistics.currentMonthEarnings.toFixed(2)}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-muted-foreground text-xs'>Last Month</p>
              <p className='text-xl font-semibold'>
                ${statistics.previousMonthEarnings.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Mini Chart */}
          <div className='h-[150px]'>
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Bottom Stats */}
          <div className='flex items-center justify-between border-t pt-3 text-sm'>
            <div>
              <span className='text-muted-foreground'>Avg Project: </span>
              <span className='font-medium'>
                ${statistics.averageProjectValue.toFixed(2)}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>Projects: </span>
              <span className='font-medium'>{statistics.totalProjects}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
